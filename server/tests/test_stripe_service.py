"""Comprehensive unit tests for the Stripe service layer.

All Stripe API calls are mocked -- no live connection required.
Covers: plan configuration, BTW/VAT validation, customer management,
checkout sessions, subscriptions, payment methods, invoices, and portal sessions.
"""

import pytest
from decimal import Decimal
from unittest.mock import MagicMock, patch, call

import stripe as stripe_module

from server.app.services.stripe_service import (
    PLAN_PRICES,
    PLANS,
    get_or_create_customer,
    get_customer_by_org,
    create_checkout_session,
    get_subscription,
    get_customer_subscription,
    update_subscription,
    cancel_subscription,
    list_payment_methods,
    attach_payment_method,
    detach_payment_method,
    list_invoices,
    create_portal_session,
    validate_btw_number,
)
from server.app.models.enums import PlanTier, BillingInterval


# =============================================================================
# Helpers: mock Stripe objects
# =============================================================================

def _mock_customer(id="cus_test1", email="test@kijko.nl", name="Test Org", org_id="org-1"):
    """Build a MagicMock that behaves like stripe.Customer."""
    c = MagicMock()
    c.id = id
    c.email = email
    c.name = name
    c.metadata = {"org_id": org_id}
    c.get = lambda k, d=None: {"invoice_settings": {"default_payment_method": None}}.get(k, d)
    return c


def _mock_subscription(
    id="sub_test1",
    status="active",
    item_id="si_item1",
    price_id="price_pro_monthly",
):
    """Build a MagicMock that behaves like stripe.Subscription.

    The Stripe SDK returns objects that support both attribute and dict-style access.
    The service uses ``sub["items"]["data"][0]["id"]``, so we need real dicts
    nested inside the mock to make __getitem__ resolve correctly.
    """
    sub = MagicMock()
    sub.id = id
    sub.status = status
    # Use a real dict so sub["items"]["data"][0]["id"] works
    items_data = {"data": [{"id": item_id, "price": {"id": price_id}}]}
    sub.__getitem__ = lambda self_unused, key: {"items": items_data}[key]
    return sub


def _mock_payment_method(id="pm_test1", pm_type="card", **kwargs):
    """Build a MagicMock that behaves like stripe.PaymentMethod."""
    pm = MagicMock()
    pm.id = id
    pm.type = pm_type

    # Reset sub-objects so truthiness tests work correctly
    pm.card = None
    pm.ideal = None
    pm.sepa_debit = None

    if pm_type == "card":
        card = MagicMock()
        card.last4 = kwargs.get("last4", "4242")
        card.brand = kwargs.get("brand", "visa")
        card.exp_month = kwargs.get("exp_month", 12)
        card.exp_year = kwargs.get("exp_year", 2027)
        pm.card = card
    elif pm_type == "ideal":
        ideal = MagicMock()
        ideal.bank = kwargs.get("bank", "ing")
        pm.ideal = ideal
    elif pm_type == "sepa_debit":
        sepa = MagicMock()
        sepa.last4 = kwargs.get("last4", "3456")
        pm.sepa_debit = sepa

    return pm


def _mock_invoice(
    id="in_test1",
    number="INV-001",
    status="paid",
    amount_due=2900,
    amount_paid=2900,
    currency="eur",
    period_start=1700000000,
    period_end=1702592000,
    hosted_invoice_url="https://invoice.stripe.com/i/test",
    invoice_pdf="https://invoice.stripe.com/i/test/pdf",
    created=1700000000,
):
    inv = MagicMock()
    inv.id = id
    inv.number = number
    inv.status = status
    inv.amount_due = amount_due
    inv.amount_paid = amount_paid
    inv.currency = currency
    inv.period_start = period_start
    inv.period_end = period_end
    inv.hosted_invoice_url = hosted_invoice_url
    inv.invoice_pdf = invoice_pdf
    inv.created = created
    return inv


# =============================================================================
# 1. Plan Configuration
# =============================================================================

class TestPlanConfiguration:
    """Verify the static PLANS list and PLAN_PRICES dict."""

    def test_plans_count(self):
        """There should be exactly 4 plans."""
        assert len(PLANS) == 4

    def test_plan_ids(self):
        """Plans should include Free, Pro, Teams, Enterprise in order."""
        ids = [p["id"] for p in PLANS]
        assert ids == [PlanTier.FREE, PlanTier.PRO, PlanTier.TEAMS, PlanTier.ENTERPRISE]

    def test_plan_names(self):
        """Plans have human-readable names."""
        names = [p["name"] for p in PLANS]
        assert names == ["Free", "Pro", "Teams", "Enterprise"]

    def test_free_plan_zero_price(self):
        """Free plan costs nothing."""
        free = PLANS[0]
        assert free["price"] == Decimal("0")
        assert free["annual_price"] == Decimal("0")

    def test_pro_pricing(self):
        """Pro is $29 monthly / $290 annual."""
        pro = PLANS[1]
        assert pro["price"] == Decimal("29")
        assert pro["annual_price"] == Decimal("290")

    def test_teams_pricing(self):
        """Teams is $79 monthly / $790 annual."""
        teams = PLANS[2]
        assert teams["price"] == Decimal("79")
        assert teams["annual_price"] == Decimal("790")

    def test_enterprise_pricing(self):
        """Enterprise is $199 monthly / $1990 annual."""
        ent = PLANS[3]
        assert ent["price"] == Decimal("199")
        assert ent["annual_price"] == Decimal("1990")

    def test_annual_discount_vs_monthly(self):
        """Annual price should be less than 12x monthly for paid plans."""
        for plan in PLANS:
            if plan["price"] > 0:
                twelve_months = plan["price"] * 12
                assert plan["annual_price"] < twelve_months, (
                    f"{plan['name']} annual ({plan['annual_price']}) should be < 12x monthly ({twelve_months})"
                )

    def test_every_paid_tier_has_monthly_and_annual_price_ids(self):
        """Every paid tier must have both monthly and annual price IDs in PLAN_PRICES."""
        paid_tiers = [PlanTier.PRO, PlanTier.TEAMS, PlanTier.ENTERPRISE]
        for tier in paid_tiers:
            assert (tier, BillingInterval.MONTHLY) in PLAN_PRICES, f"Missing monthly price for {tier}"
            assert (tier, BillingInterval.ANNUALLY) in PLAN_PRICES, f"Missing annual price for {tier}"

    def test_free_tier_has_monthly_price_id(self):
        """Free tier should have at least a monthly price ID."""
        assert (PlanTier.FREE, BillingInterval.MONTHLY) in PLAN_PRICES

    def test_plan_prices_values_are_strings(self):
        """All price IDs should be non-empty strings."""
        for key, val in PLAN_PRICES.items():
            assert isinstance(val, str) and val, f"Invalid price ID for {key}: {val!r}"

    def test_plans_have_features_list(self):
        """Each plan should have a non-empty features list."""
        for plan in PLANS:
            assert "features" in plan
            assert isinstance(plan["features"], list)
            assert len(plan["features"]) > 0

    def test_plans_have_limits_dict(self):
        """Each plan should have a limits dict with required keys."""
        required_keys = {"apiCalls", "storageGb", "seats"}
        for plan in PLANS:
            assert "limits" in plan
            assert required_keys.issubset(plan["limits"].keys()), (
                f"{plan['name']} missing limit keys: {required_keys - plan['limits'].keys()}"
            )

    def test_limits_increase_with_tier(self):
        """Higher tiers should have greater or equal API call limits."""
        for i in range(len(PLANS) - 1):
            lower = PLANS[i]["limits"]["apiCalls"]
            higher = PLANS[i + 1]["limits"]["apiCalls"]
            assert higher >= lower, (
                f"{PLANS[i+1]['name']} ({higher}) should have >= apiCalls than {PLANS[i]['name']} ({lower})"
            )

    def test_pro_is_popular(self):
        """Pro plan should be marked as popular."""
        pro = PLANS[1]
        assert pro.get("is_popular") is True

    def test_plan_prices_count(self):
        """PLAN_PRICES should have 7 entries (1 free + 3 paid x 2 intervals)."""
        assert len(PLAN_PRICES) == 7


# =============================================================================
# 2. BTW / VAT Validation
# =============================================================================

class TestBTWValidation:
    """validate_btw_number: Dutch and EU VAT format checks."""

    # --- Valid Dutch BTW ---

    def test_valid_dutch_btw_standard(self):
        result = validate_btw_number("NL123456789B01")
        assert result["valid"] is True
        assert result["btw_number"] == "NL123456789B01"
        assert "BTW" in result["message"]

    def test_valid_dutch_btw_different_suffix(self):
        result = validate_btw_number("NL999999999B99")
        assert result["valid"] is True

    # --- Valid EU VAT ---

    def test_valid_german_vat(self):
        result = validate_btw_number("DE123456789")
        assert result["valid"] is True
        assert "EU VAT" in result["message"]

    def test_valid_belgian_vat(self):
        result = validate_btw_number("BE1234567890")
        assert result["valid"] is True

    def test_valid_french_vat_10_digits(self):
        result = validate_btw_number("FR1234567890")
        assert result["valid"] is True

    def test_valid_eu_vat_8_digits(self):
        """Minimum 8-digit EU VAT number."""
        result = validate_btw_number("DE12345678")
        assert result["valid"] is True

    def test_valid_eu_vat_12_digits(self):
        """Maximum 12-digit EU VAT number."""
        result = validate_btw_number("IT123456789012")
        assert result["valid"] is True

    # --- Normalization (spaces, lowercase) ---

    def test_lowercase_is_normalized(self):
        result = validate_btw_number("nl123456789b01")
        assert result["valid"] is True
        assert result["btw_number"] == "NL123456789B01"

    def test_leading_trailing_spaces(self):
        result = validate_btw_number("  NL123456789B01  ")
        assert result["valid"] is True
        assert result["btw_number"] == "NL123456789B01"

    def test_internal_spaces_removed(self):
        result = validate_btw_number("NL 123456789 B01")
        assert result["valid"] is True
        assert result["btw_number"] == "NL123456789B01"

    def test_mixed_case_with_spaces(self):
        result = validate_btw_number("  nl 123 456 789 b 01  ")
        assert result["valid"] is True

    # --- Invalid formats ---

    def test_empty_string(self):
        result = validate_btw_number("")
        assert result["valid"] is False

    def test_only_spaces(self):
        result = validate_btw_number("   ")
        assert result["valid"] is False

    def test_random_text(self):
        result = validate_btw_number("INVALID123")
        assert result["valid"] is False

    def test_too_short(self):
        result = validate_btw_number("NL123")
        assert result["valid"] is False

    def test_dutch_wrong_separator_letter(self):
        """NL + 9 digits requires B before 2-digit suffix."""
        result = validate_btw_number("NL123456789A01")
        assert result["valid"] is False

    def test_missing_country_prefix(self):
        result = validate_btw_number("123456789B01")
        assert result["valid"] is False

    def test_single_digit_country(self):
        result = validate_btw_number("X12345678")
        assert result["valid"] is False

    def test_eu_vat_too_few_digits(self):
        """Country code + only 7 digits is too short."""
        result = validate_btw_number("DE1234567")
        assert result["valid"] is False

    def test_eu_vat_too_many_digits(self):
        """Country code + 13 digits exceeds max."""
        result = validate_btw_number("DE1234567890123")
        assert result["valid"] is False

    def test_numeric_only(self):
        result = validate_btw_number("1234567890")
        assert result["valid"] is False

    def test_special_characters(self):
        result = validate_btw_number("NL-123456789-B01")
        assert result["valid"] is False


# =============================================================================
# 3. Customer Management
# =============================================================================

class TestCustomerManagement:
    """get_or_create_customer and get_customer_by_org."""

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_or_create_returns_existing(self, mock_customer_cls):
        """When search finds an existing customer, return it without creating."""
        existing = _mock_customer()
        mock_customer_cls.search.return_value = MagicMock(data=[existing])

        result = get_or_create_customer("org-1", "test@kijko.nl", "Test Org")

        assert result.id == "cus_test1"
        mock_customer_cls.search.assert_called_once()
        mock_customer_cls.create.assert_not_called()

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_or_create_creates_new(self, mock_customer_cls):
        """When no existing customer found, create a new one."""
        mock_customer_cls.search.return_value = MagicMock(data=[])
        new_cust = _mock_customer(id="cus_new")
        mock_customer_cls.create.return_value = new_cust

        result = get_or_create_customer("org-new", "new@kijko.nl", "New Org")

        assert result.id == "cus_new"
        mock_customer_cls.create.assert_called_once_with(
            email="new@kijko.nl",
            name="New Org",
            metadata={"org_id": "org-new"},
            preferred_locales=["nl", "en"],
        )

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_or_create_search_query_contains_org_id(self, mock_customer_cls):
        """The search query should include the org_id."""
        mock_customer_cls.search.return_value = MagicMock(data=[_mock_customer()])

        get_or_create_customer("org-abc", "a@b.nl")

        query = mock_customer_cls.search.call_args[1]["query"]
        assert "org-abc" in query

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_or_create_name_optional(self, mock_customer_cls):
        """Name is optional; should pass None when omitted."""
        mock_customer_cls.search.return_value = MagicMock(data=[])
        mock_customer_cls.create.return_value = _mock_customer()

        get_or_create_customer("org-x", "x@y.nl")

        _, kwargs = mock_customer_cls.create.call_args
        assert kwargs["name"] is None

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_customer_by_org_found(self, mock_customer_cls):
        """Returns customer when search finds a match."""
        cust = _mock_customer(id="cus_found")
        mock_customer_cls.search.return_value = MagicMock(data=[cust])

        result = get_customer_by_org("org-1")

        assert result is not None
        assert result.id == "cus_found"

    @patch("server.app.services.stripe_service.stripe.Customer")
    def test_get_customer_by_org_not_found(self, mock_customer_cls):
        """Returns None when no customer matches."""
        mock_customer_cls.search.return_value = MagicMock(data=[])

        result = get_customer_by_org("org-unknown")

        assert result is None


# =============================================================================
# 4. Checkout Session
# =============================================================================

class TestCheckoutSession:
    """create_checkout_session: Stripe Checkout with iDEAL + card."""

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_valid_pro_monthly(self, mock_session_cls):
        """Creates a session for Pro/monthly with correct price ID."""
        mock_session_cls.create.return_value = MagicMock(
            id="cs_test1", url="https://checkout.stripe.com/x"
        )

        result = create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        assert result.id == "cs_test1"
        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["customer"] == "cus_1"
        assert kwargs["mode"] == "subscription"
        assert kwargs["line_items"] == [{"price": "price_pro_monthly", "quantity": 1}]
        assert "card" in kwargs["payment_method_types"]
        assert "ideal" in kwargs["payment_method_types"]

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_valid_teams_annual(self, mock_session_cls):
        """Creates a session for Teams/annual with correct price ID."""
        mock_session_cls.create.return_value = MagicMock(id="cs_teams")

        create_checkout_session(
            "cus_2", PlanTier.TEAMS, BillingInterval.ANNUALLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["line_items"][0]["price"] == "price_teams_annual"

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_valid_enterprise_monthly(self, mock_session_cls):
        """Creates a session for Enterprise/monthly."""
        mock_session_cls.create.return_value = MagicMock(id="cs_ent")

        create_checkout_session(
            "cus_3", PlanTier.ENTERPRISE, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["line_items"][0]["price"] == "price_enterprise_monthly"

    def test_invalid_plan_combo_raises(self):
        """A non-existent (plan, interval) combo should raise ValueError."""
        with pytest.raises(ValueError, match="No price configured"):
            create_checkout_session(
                "cus_1", "nonexistent", "monthly",
                "https://ok.nl/success", "https://ok.nl/cancel",
            )

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_success_url_gets_session_id_appended(self, mock_session_cls):
        """success_url should have ?session_id={CHECKOUT_SESSION_ID} appended."""
        mock_session_cls.create.return_value = MagicMock(id="cs_test")

        create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["success_url"] == "https://ok.nl/success?session_id={CHECKOUT_SESSION_ID}"

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_cancel_url_passed_through(self, mock_session_cls):
        """cancel_url should be passed as-is."""
        mock_session_cls.create.return_value = MagicMock(id="cs_test")

        create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["cancel_url"] == "https://ok.nl/cancel"

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_metadata_contains_plan_and_interval(self, mock_session_cls):
        """Session metadata should include the plan and billing_interval."""
        mock_session_cls.create.return_value = MagicMock(id="cs_test")

        create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["metadata"]["plan"] == PlanTier.PRO
        assert kwargs["metadata"]["billing_interval"] == BillingInterval.MONTHLY

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_locale_is_dutch(self, mock_session_cls):
        """Session locale should be 'nl' for Dutch market."""
        mock_session_cls.create.return_value = MagicMock(id="cs_test")

        create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["locale"] == "nl"

    @patch("server.app.services.stripe_service.stripe.checkout.Session")
    def test_allow_promotion_codes(self, mock_session_cls):
        """Promotion codes should be allowed."""
        mock_session_cls.create.return_value = MagicMock(id="cs_test")

        create_checkout_session(
            "cus_1", PlanTier.PRO, BillingInterval.MONTHLY,
            "https://ok.nl/success", "https://ok.nl/cancel",
        )

        _, kwargs = mock_session_cls.create.call_args
        assert kwargs["allow_promotion_codes"] is True


# =============================================================================
# 5. Subscription Management
# =============================================================================

class TestSubscriptionManagement:
    """get_subscription, get_customer_subscription, update, cancel."""

    # --- get_subscription ---

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_get_subscription_valid(self, mock_sub_cls):
        """Returns subscription object when ID is valid."""
        sub = _mock_subscription()
        mock_sub_cls.retrieve.return_value = sub

        result = get_subscription("sub_test1")

        assert result.id == "sub_test1"
        mock_sub_cls.retrieve.assert_called_once_with("sub_test1")

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_get_subscription_invalid_returns_none(self, mock_sub_cls):
        """Returns None when subscription ID is invalid."""
        mock_sub_cls.retrieve.side_effect = stripe_module.error.InvalidRequestError(
            "No such subscription", "subscription_id"
        )

        result = get_subscription("sub_bad")

        assert result is None

    # --- get_customer_subscription ---

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_get_customer_subscription_active(self, mock_sub_cls):
        """Returns the active subscription for a customer."""
        active_sub = _mock_subscription(status="active")
        mock_sub_cls.list.return_value = MagicMock(data=[active_sub])

        result = get_customer_subscription("cus_1")

        assert result.id == "sub_test1"
        # Should only list with status=active, never reaching trialing
        mock_sub_cls.list.assert_called_once_with(
            customer="cus_1", status="active", limit=1,
        )

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_get_customer_subscription_trialing_fallback(self, mock_sub_cls):
        """Falls back to trialing subscription when no active found."""
        trialing_sub = _mock_subscription(id="sub_trial", status="trialing")

        # First call (active) returns empty, second (trialing) returns the sub
        mock_sub_cls.list.side_effect = [
            MagicMock(data=[]),       # active search
            MagicMock(data=[trialing_sub]),  # trialing search
        ]

        result = get_customer_subscription("cus_1")

        assert result.id == "sub_trial"
        assert mock_sub_cls.list.call_count == 2

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_get_customer_subscription_none(self, mock_sub_cls):
        """Returns None when customer has no active or trialing subscription."""
        mock_sub_cls.list.side_effect = [
            MagicMock(data=[]),  # active
            MagicMock(data=[]),  # trialing
        ]

        result = get_customer_subscription("cus_1")

        assert result is None

    # --- update_subscription ---

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_update_subscription_with_proration(self, mock_sub_cls):
        """Updates subscription to new price with proration."""
        existing = _mock_subscription(item_id="si_old", price_id="price_pro_monthly")
        mock_sub_cls.retrieve.return_value = existing
        updated = _mock_subscription(price_id="price_teams_monthly")
        mock_sub_cls.modify.return_value = updated

        result = update_subscription("sub_test1", "price_teams_monthly")

        mock_sub_cls.modify.assert_called_once_with(
            "sub_test1",
            items=[{"id": "si_old", "price": "price_teams_monthly"}],
            proration_behavior="create_prorations",
        )
        assert result is updated

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_update_subscription_retrieves_first(self, mock_sub_cls):
        """update_subscription retrieves the subscription to get the item ID."""
        mock_sub_cls.retrieve.return_value = _mock_subscription()
        mock_sub_cls.modify.return_value = _mock_subscription()

        update_subscription("sub_x", "price_new")

        mock_sub_cls.retrieve.assert_called_once_with("sub_x")

    # --- cancel_subscription ---

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_cancel_at_period_end(self, mock_sub_cls):
        """Default cancel sets cancel_at_period_end=True via modify."""
        mock_sub_cls.modify.return_value = _mock_subscription()

        cancel_subscription("sub_test1")

        mock_sub_cls.modify.assert_called_once_with(
            "sub_test1",
            cancel_at_period_end=True,
        )
        mock_sub_cls.delete.assert_not_called()

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_cancel_at_period_end_explicit(self, mock_sub_cls):
        """Explicitly passing at_period_end=True uses modify."""
        mock_sub_cls.modify.return_value = _mock_subscription()

        cancel_subscription("sub_test1", at_period_end=True)

        mock_sub_cls.modify.assert_called_once()
        mock_sub_cls.delete.assert_not_called()

    @patch("server.app.services.stripe_service.stripe.Subscription")
    def test_cancel_immediate(self, mock_sub_cls):
        """Immediate cancel (at_period_end=False) calls delete."""
        mock_sub_cls.delete.return_value = _mock_subscription()

        cancel_subscription("sub_test1", at_period_end=False)

        mock_sub_cls.delete.assert_called_once_with("sub_test1")
        mock_sub_cls.modify.assert_not_called()


# =============================================================================
# 6. Payment Methods
# =============================================================================

class TestPaymentMethods:
    """list_payment_methods, attach, detach."""

    # --- list_payment_methods ---

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_card_methods(self, mock_pm_cls, mock_cust_cls):
        """Lists card payment methods with brand/last4/expiry."""
        card = _mock_payment_method("pm_card1", "card", last4="4242", brand="visa", exp_month=3, exp_year=2028)

        mock_pm_cls.list.side_effect = [
            MagicMock(data=[card]),   # card
            MagicMock(data=[]),       # ideal
            MagicMock(data=[]),       # sepa_debit
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": "pm_card1"}}.get(k, d)
        )

        result = list_payment_methods("cus_1")

        assert len(result) == 1
        assert result[0]["id"] == "pm_card1"
        assert result[0]["type"] == "card"
        assert result[0]["card_last4"] == "4242"
        assert result[0]["card_brand"] == "visa"
        assert result[0]["card_exp_month"] == 3
        assert result[0]["card_exp_year"] == 2028
        assert result[0]["is_default"] is True

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_ideal_methods(self, mock_pm_cls, mock_cust_cls):
        """Lists iDEAL payment methods with bank name."""
        ideal = _mock_payment_method("pm_ideal1", "ideal", bank="rabobank")

        mock_pm_cls.list.side_effect = [
            MagicMock(data=[]),          # card
            MagicMock(data=[ideal]),     # ideal
            MagicMock(data=[]),          # sepa_debit
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": None}}.get(k, d)
        )

        result = list_payment_methods("cus_1")

        assert len(result) == 1
        assert result[0]["type"] == "ideal"
        assert result[0]["ideal_bank"] == "rabobank"
        assert result[0]["is_default"] is False

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_sepa_debit_methods(self, mock_pm_cls, mock_cust_cls):
        """Lists SEPA debit payment methods with last4."""
        sepa = _mock_payment_method("pm_sepa1", "sepa_debit", last4="9876")

        mock_pm_cls.list.side_effect = [
            MagicMock(data=[]),          # card
            MagicMock(data=[]),          # ideal
            MagicMock(data=[sepa]),      # sepa_debit
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": None}}.get(k, d)
        )

        result = list_payment_methods("cus_1")

        assert len(result) == 1
        assert result[0]["type"] == "sepa_debit"
        assert result[0]["sepa_last4"] == "9876"

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_mixed_methods(self, mock_pm_cls, mock_cust_cls):
        """Lists multiple method types, correctly marks default."""
        card = _mock_payment_method("pm_card1", "card")
        ideal = _mock_payment_method("pm_ideal1", "ideal", bank="ing")
        sepa = _mock_payment_method("pm_sepa1", "sepa_debit", last4="1111")

        mock_pm_cls.list.side_effect = [
            MagicMock(data=[card]),
            MagicMock(data=[ideal]),
            MagicMock(data=[sepa]),
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": "pm_ideal1"}}.get(k, d)
        )

        result = list_payment_methods("cus_1")

        assert len(result) == 3
        types = {r["type"] for r in result}
        assert types == {"card", "ideal", "sepa_debit"}

        # Only ideal should be default
        defaults = [r for r in result if r["is_default"]]
        assert len(defaults) == 1
        assert defaults[0]["id"] == "pm_ideal1"

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_no_methods(self, mock_pm_cls, mock_cust_cls):
        """Returns empty list when no methods attached."""
        mock_pm_cls.list.side_effect = [
            MagicMock(data=[]),
            MagicMock(data=[]),
            MagicMock(data=[]),
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": None}}.get(k, d)
        )

        result = list_payment_methods("cus_1")

        assert result == []

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_list_queries_all_three_types(self, mock_pm_cls, mock_cust_cls):
        """list_payment_methods should query card, ideal, and sepa_debit."""
        mock_pm_cls.list.side_effect = [
            MagicMock(data=[]),
            MagicMock(data=[]),
            MagicMock(data=[]),
        ]
        mock_cust_cls.retrieve.return_value = MagicMock(
            get=lambda k, d=None: {"invoice_settings": {"default_payment_method": None}}.get(k, d)
        )

        list_payment_methods("cus_1")

        calls = mock_pm_cls.list.call_args_list
        types_queried = [c[1]["type"] for c in calls]
        assert types_queried == ["card", "ideal", "sepa_debit"]

    # --- attach_payment_method ---

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_attach_with_default(self, mock_pm_cls, mock_cust_cls):
        """Attach and set as default updates invoice_settings."""
        pm = _mock_payment_method("pm_new", "card")
        mock_pm_cls.attach.return_value = pm

        result = attach_payment_method("cus_1", "pm_new", set_default=True)

        mock_pm_cls.attach.assert_called_once_with("pm_new", customer="cus_1")
        mock_cust_cls.modify.assert_called_once_with(
            "cus_1",
            invoice_settings={"default_payment_method": "pm_new"},
        )
        assert result.id == "pm_new"

    @patch("server.app.services.stripe_service.stripe.Customer")
    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_attach_without_default(self, mock_pm_cls, mock_cust_cls):
        """Attach without setting default skips Customer.modify."""
        pm = _mock_payment_method("pm_new", "card")
        mock_pm_cls.attach.return_value = pm

        result = attach_payment_method("cus_1", "pm_new", set_default=False)

        mock_pm_cls.attach.assert_called_once_with("pm_new", customer="cus_1")
        mock_cust_cls.modify.assert_not_called()
        assert result.id == "pm_new"

    # --- detach_payment_method ---

    @patch("server.app.services.stripe_service.stripe.PaymentMethod")
    def test_detach(self, mock_pm_cls):
        """Detach removes payment method from customer."""
        mock_pm_cls.detach.return_value = _mock_payment_method("pm_old", "card")

        result = detach_payment_method("pm_old")

        mock_pm_cls.detach.assert_called_once_with("pm_old")
        assert result.id == "pm_old"


# =============================================================================
# 7. Invoices
# =============================================================================

class TestInvoices:
    """list_invoices formatting and limit."""

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_formatting(self, mock_inv_cls):
        """Returned dicts have the expected keys and types."""
        inv = _mock_invoice(
            id="in_1",
            number="INV-2024-001",
            status="paid",
            amount_due=2900,
            amount_paid=2900,
            currency="eur",
            period_start=1700000000,
            period_end=1702592000,
            hosted_invoice_url="https://invoice.stripe.com/i/1",
            invoice_pdf="https://invoice.stripe.com/i/1/pdf",
            created=1700000000,
        )
        mock_inv_cls.list.return_value = MagicMock(data=[inv])

        result = list_invoices("cus_1")

        assert len(result) == 1
        r = result[0]
        assert r["id"] == "in_1"
        assert r["number"] == "INV-2024-001"
        assert r["status"] == "paid"
        assert r["currency"] == "eur"
        assert r["hosted_invoice_url"] == "https://invoice.stripe.com/i/1"
        assert r["invoice_pdf"] == "https://invoice.stripe.com/i/1/pdf"
        assert r["period_start"] == 1700000000
        assert r["period_end"] == 1702592000
        assert r["created_at"] == 1700000000

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_invoice_amounts_are_decimal(self, mock_inv_cls):
        """amount_due and amount_paid should be Decimal instances."""
        inv = _mock_invoice(amount_due=7900, amount_paid=7900)
        mock_inv_cls.list.return_value = MagicMock(data=[inv])

        result = list_invoices("cus_1")

        assert isinstance(result[0]["amount_due"], Decimal)
        assert isinstance(result[0]["amount_paid"], Decimal)
        assert result[0]["amount_due"] == Decimal("7900")
        assert result[0]["amount_paid"] == Decimal("7900")

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_default_limit(self, mock_inv_cls):
        """Default limit is 20."""
        mock_inv_cls.list.return_value = MagicMock(data=[])

        list_invoices("cus_1")

        _, kwargs = mock_inv_cls.list.call_args
        assert kwargs["limit"] == 20

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_custom_limit(self, mock_inv_cls):
        """Custom limit is passed through."""
        mock_inv_cls.list.return_value = MagicMock(data=[])

        list_invoices("cus_1", limit=5)

        _, kwargs = mock_inv_cls.list.call_args
        assert kwargs["limit"] == 5

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_limit_capped_at_100(self, mock_inv_cls):
        """Limit should be capped at 100 even if a larger value is requested."""
        mock_inv_cls.list.return_value = MagicMock(data=[])

        list_invoices("cus_1", limit=500)

        _, kwargs = mock_inv_cls.list.call_args
        assert kwargs["limit"] == 100

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_multiple(self, mock_inv_cls):
        """Multiple invoices are all formatted."""
        invs = [
            _mock_invoice(id=f"in_{i}", number=f"INV-{i}", amount_due=i * 1000, amount_paid=i * 1000)
            for i in range(3)
        ]
        mock_inv_cls.list.return_value = MagicMock(data=invs)

        result = list_invoices("cus_1")

        assert len(result) == 3
        assert [r["id"] for r in result] == ["in_0", "in_1", "in_2"]

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_empty(self, mock_inv_cls):
        """Returns empty list when no invoices exist."""
        mock_inv_cls.list.return_value = MagicMock(data=[])

        result = list_invoices("cus_1")

        assert result == []

    @patch("server.app.services.stripe_service.stripe.Invoice")
    def test_list_invoices_url_fields(self, mock_inv_cls):
        """hosted_invoice_url and invoice_pdf should be included."""
        inv = _mock_invoice(
            hosted_invoice_url="https://inv.stripe.com/view",
            invoice_pdf="https://inv.stripe.com/pdf",
        )
        mock_inv_cls.list.return_value = MagicMock(data=[inv])

        result = list_invoices("cus_1")

        assert result[0]["hosted_invoice_url"] == "https://inv.stripe.com/view"
        assert result[0]["invoice_pdf"] == "https://inv.stripe.com/pdf"


# =============================================================================
# 8. Portal Session
# =============================================================================

class TestPortalSession:
    """create_portal_session: Stripe Customer Portal."""

    @patch("server.app.services.stripe_service.stripe.billing_portal.Session")
    def test_create_portal_session(self, mock_portal_cls):
        """Creates portal session with customer and return_url."""
        mock_portal_cls.create.return_value = MagicMock(
            id="bps_test", url="https://billing.stripe.com/p/session/test"
        )

        result = create_portal_session("cus_1", "https://app.kijko.nl/settings")

        mock_portal_cls.create.assert_called_once_with(
            customer="cus_1",
            return_url="https://app.kijko.nl/settings",
        )
        assert result.url == "https://billing.stripe.com/p/session/test"

    @patch("server.app.services.stripe_service.stripe.billing_portal.Session")
    def test_portal_session_returns_object(self, mock_portal_cls):
        """The return value should be the session object from Stripe."""
        session_mock = MagicMock(id="bps_123")
        mock_portal_cls.create.return_value = session_mock

        result = create_portal_session("cus_x", "https://app.kijko.nl/")

        assert result is session_mock
