"""Stripe service — Customer, subscription, checkout, payment methods, invoices.

All monetary amounts are in EUR cents. Uses Decimal for money operations.
iDEAL is enabled as a payment method for Dutch market.
"""

import logging
from decimal import Decimal
from typing import Any

import stripe

from server.app.config import settings
from server.app.models.enums import BillingInterval, PlanTier

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# =============================================================================
# Plan Pricing Configuration
# Mapping: (PlanTier, BillingInterval) → Stripe price_id
# These should match Stripe Dashboard price objects.
# =============================================================================

PLAN_PRICES: dict[tuple[str, str], str] = {
    (PlanTier.FREE, BillingInterval.MONTHLY): "price_free_monthly",
    (PlanTier.PRO, BillingInterval.MONTHLY): "price_pro_monthly",
    (PlanTier.PRO, BillingInterval.ANNUALLY): "price_pro_annual",
    (PlanTier.TEAMS, BillingInterval.MONTHLY): "price_teams_monthly",
    (PlanTier.TEAMS, BillingInterval.ANNUALLY): "price_teams_annual",
    (PlanTier.ENTERPRISE, BillingInterval.MONTHLY): "price_enterprise_monthly",
    (PlanTier.ENTERPRISE, BillingInterval.ANNUALLY): "price_enterprise_annual",
}

# Static plan definitions (used by GET /billing/plans)
PLANS = [
    {
        "id": PlanTier.FREE,
        "name": "Free",
        "price": Decimal("0"),
        "annual_price": Decimal("0"),
        "description": "Get started with basic AI tools",
        "features": ["5 skills", "100 API calls/month", "1 seat", "1GB storage"],
        "limits": {
            "apiCalls": 100,
            "ingestions": 2,
            "storageGb": 1,
            "seats": 1,
            "oracleQueries": 10,
        },
    },
    {
        "id": PlanTier.PRO,
        "name": "Pro",
        "price": Decimal("29"),
        "annual_price": Decimal("290"),
        "description": "For individuals and small teams",
        "features": ["25 skills", "1,000 API calls/month", "3 seats", "10GB storage"],
        "limits": {
            "apiCalls": 1000,
            "ingestions": 10,
            "storageGb": 10,
            "seats": 3,
            "oracleQueries": 100,
        },
        "is_popular": True,
    },
    {
        "id": PlanTier.TEAMS,
        "name": "Teams",
        "price": Decimal("79"),
        "annual_price": Decimal("790"),
        "description": "For growing teams with advanced needs",
        "features": ["Unlimited skills", "10,000 API calls/month", "10 seats", "100GB storage"],
        "limits": {
            "apiCalls": 10000,
            "ingestions": 50,
            "storageGb": 100,
            "seats": 10,
            "oracleQueries": 1000,
        },
    },
    {
        "id": PlanTier.ENTERPRISE,
        "name": "Enterprise",
        "price": Decimal("199"),
        "annual_price": Decimal("1990"),
        "description": "For large organizations with custom requirements",
        "features": ["Unlimited everything", "Priority support", "Custom integrations", "SLA"],
        "limits": {
            "apiCalls": 100000,
            "ingestions": 500,
            "storageGb": 1000,
            "seats": 100,
            "oracleQueries": 10000,
        },
    },
]


# =============================================================================
# Customer Management
# =============================================================================

def get_or_create_customer(
    org_id: str,
    email: str,
    name: str | None = None,
) -> stripe.Customer:
    """Get or create a Stripe customer for an organization.

    Uses org_id as metadata for lookup. Each organization has one Stripe customer.
    """
    # Search for existing customer by org_id metadata
    existing = stripe.Customer.search(
        query=f'metadata["org_id"]:"{org_id}"',
    )

    if existing.data:
        return existing.data[0]

    # Create new customer
    customer = stripe.Customer.create(
        email=email,
        name=name,
        metadata={"org_id": org_id},
        preferred_locales=["nl", "en"],
    )
    logger.info("Created Stripe customer %s for org %s", customer.id, org_id)
    return customer


def get_customer_by_org(org_id: str) -> stripe.Customer | None:
    """Find Stripe customer by organization ID."""
    result = stripe.Customer.search(
        query=f'metadata["org_id"]:"{org_id}"',
    )
    return result.data[0] if result.data else None


# =============================================================================
# Checkout Sessions
# =============================================================================

def create_checkout_session(
    customer_id: str,
    plan: str,
    billing_interval: str,
    success_url: str,
    cancel_url: str,
) -> stripe.checkout.Session:
    """Create a Stripe Checkout session with iDEAL + card support.

    Returns a session with a URL to redirect the user to.
    """
    price_id = PLAN_PRICES.get((plan, billing_interval))
    if not price_id:
        raise ValueError(f"No price configured for {plan}/{billing_interval}")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        payment_method_types=["card", "ideal"],
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={"plan": plan, "billing_interval": billing_interval},
        locale="nl",  # Dutch locale for iDEAL
        allow_promotion_codes=True,
    )
    return session


# =============================================================================
# Subscription Management
# =============================================================================

def get_subscription(subscription_id: str) -> stripe.Subscription | None:
    """Retrieve a Stripe subscription by ID."""
    try:
        return stripe.Subscription.retrieve(subscription_id)
    except stripe.error.InvalidRequestError:
        return None


def get_customer_subscription(customer_id: str) -> stripe.Subscription | None:
    """Get the active subscription for a customer."""
    subs = stripe.Subscription.list(
        customer=customer_id,
        status="active",
        limit=1,
    )
    if subs.data:
        return subs.data[0]

    # Check for trialing
    subs = stripe.Subscription.list(
        customer=customer_id,
        status="trialing",
        limit=1,
    )
    return subs.data[0] if subs.data else None


def update_subscription(
    subscription_id: str,
    new_price_id: str,
) -> stripe.Subscription:
    """Update a subscription to a new plan (upgrade/downgrade).

    Uses proration for immediate upgrades.
    """
    sub = stripe.Subscription.retrieve(subscription_id)
    updated = stripe.Subscription.modify(
        subscription_id,
        items=[{
            "id": sub["items"]["data"][0]["id"],
            "price": new_price_id,
        }],
        proration_behavior="create_prorations",
    )
    return updated


def cancel_subscription(
    subscription_id: str,
    at_period_end: bool = True,
) -> stripe.Subscription:
    """Cancel a subscription.

    Default: cancel at period end (user keeps access until then).
    """
    if at_period_end:
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
        )
    return stripe.Subscription.delete(subscription_id)


# =============================================================================
# Payment Methods
# =============================================================================

def list_payment_methods(customer_id: str) -> list[dict[str, Any]]:
    """List all payment methods for a customer."""
    methods = stripe.PaymentMethod.list(
        customer=customer_id,
        type="card",
    )
    ideal_methods = stripe.PaymentMethod.list(
        customer=customer_id,
        type="ideal",
    )
    sepa_methods = stripe.PaymentMethod.list(
        customer=customer_id,
        type="sepa_debit",
    )

    all_methods = list(methods.data) + list(ideal_methods.data) + list(sepa_methods.data)

    # Get default payment method
    customer = stripe.Customer.retrieve(customer_id)
    default_pm = customer.get("invoice_settings", {}).get("default_payment_method")

    result = []
    for pm in all_methods:
        entry = {
            "id": pm.id,
            "type": pm.type,
            "is_default": pm.id == default_pm,
        }
        if pm.type == "card" and pm.card:
            entry.update({
                "card_last4": pm.card.last4,
                "card_brand": pm.card.brand,
                "card_exp_month": pm.card.exp_month,
                "card_exp_year": pm.card.exp_year,
            })
        elif pm.type == "ideal" and pm.ideal:
            entry["ideal_bank"] = pm.ideal.bank
        elif pm.type == "sepa_debit" and pm.sepa_debit:
            entry["sepa_last4"] = pm.sepa_debit.last4
        result.append(entry)

    return result


def attach_payment_method(
    customer_id: str,
    payment_method_id: str,
    set_default: bool = True,
) -> stripe.PaymentMethod:
    """Attach a payment method to a customer."""
    pm = stripe.PaymentMethod.attach(
        payment_method_id,
        customer=customer_id,
    )
    if set_default:
        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
    return pm


def detach_payment_method(payment_method_id: str) -> stripe.PaymentMethod:
    """Detach a payment method from a customer."""
    return stripe.PaymentMethod.detach(payment_method_id)


# =============================================================================
# Invoices
# =============================================================================

def list_invoices(customer_id: str, limit: int = 20) -> list[dict[str, Any]]:
    """List invoices for a customer."""
    invoices = stripe.Invoice.list(
        customer=customer_id,
        limit=min(limit, 100),
    )

    return [
        {
            "id": inv.id,
            "number": inv.number,
            "status": inv.status,
            "amount_due": Decimal(str(inv.amount_due)),
            "amount_paid": Decimal(str(inv.amount_paid)),
            "currency": inv.currency,
            "period_start": inv.period_start,
            "period_end": inv.period_end,
            "hosted_invoice_url": inv.hosted_invoice_url,
            "invoice_pdf": inv.invoice_pdf,
            "created_at": inv.created,
        }
        for inv in invoices.data
    ]


# =============================================================================
# Customer Portal
# =============================================================================

def create_portal_session(
    customer_id: str,
    return_url: str,
) -> stripe.billing_portal.Session:
    """Create a Stripe Customer Portal session.

    Allows customers to manage subscriptions, payment methods, and invoices.
    """
    return stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )


# =============================================================================
# BTW (VAT) Validation
# =============================================================================

def validate_btw_number(btw_number: str) -> dict[str, Any]:
    """Validate a Dutch BTW (VAT) number.

    Uses basic format validation. In production, integrate with VIES API.
    Format: NL + 9 digits + B + 2 digits (e.g., NL123456789B01)
    """
    import re

    btw_number = btw_number.strip().upper().replace(" ", "")

    # Dutch BTW format
    pattern = r"^NL\d{9}B\d{2}$"
    if re.match(pattern, btw_number):
        return {
            "valid": True,
            "btw_number": btw_number,
            "message": "BTW number format is valid",
        }

    # EU VAT format (any country)
    eu_pattern = r"^[A-Z]{2}\d{8,12}$"
    if re.match(eu_pattern, btw_number):
        return {
            "valid": True,
            "btw_number": btw_number,
            "message": "EU VAT number format is valid",
        }

    return {
        "valid": False,
        "btw_number": btw_number,
        "message": "Invalid BTW/VAT number format",
    }
