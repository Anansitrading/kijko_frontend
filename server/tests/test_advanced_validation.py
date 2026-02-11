"""Advanced validation tests for routers and models not covered by test_routers.py.

Covers: Reflexes, Executions (extended), GDPR, Admin routers,
        and Pydantic model validation for Billing, Habit, and User models.
"""

from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from server.app.main import app

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Auth helpers (same pattern as test_routers.py)
# ---------------------------------------------------------------------------

MOCK_USER = {
    "sub": "user-uuid-123",
    "email": "test@kijko.nl",
    "org_id": "org-uuid-456",
    "roles": ["developer"],
}

MOCK_ADMIN = {
    "sub": "admin-uuid-789",
    "email": "admin@kijko.nl",
    "org_id": "org-uuid-456",
    "roles": ["admin"],
}


def auth_headers():
    return {"Authorization": "Bearer mock-test-token"}


def mock_auth(user=None):
    """Context manager that mocks both Keycloak validation and RLS context."""
    if user is None:
        user = MOCK_USER

    kc_mock = patch(
        "server.app.middleware.auth.KeycloakService.validate_token",
        new_callable=AsyncMock,
        return_value=user,
    )
    rls_mock = patch(
        "server.app.services.database.set_rls_context",
        new_callable=AsyncMock,
    )

    class _MockContext:
        def __enter__(self):
            self._kc = kc_mock.__enter__()
            self._rls = rls_mock.__enter__()
            return self

        def __exit__(self, *args):
            rls_mock.__exit__(*args)
            kc_mock.__exit__(*args)

    return _MockContext()


# ===========================================================================
# 1. Reflexes Router
# ===========================================================================

class TestReflexesRouter:

    def test_list_reflexes_accepts_filter_skill_id(self):
        """List reflexes accepts skill_id filter param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?skill_id=some-skill-id",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_reflexes_accepts_filter_trigger_type(self):
        """List reflexes accepts trigger_type filter param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?trigger_type=webhook",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_reflexes_accepts_filter_is_active(self):
        """List reflexes accepts is_active filter param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?is_active=true",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_reflexes_pagination(self):
        """List reflexes accepts page and page_size params."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?page=2&page_size=10",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_reflexes_invalid_page_size_too_large(self):
        """Page size >100 is rejected."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?page_size=101",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_reflex_requires_fields(self):
        """Create reflex validates required fields (skill_id, trigger_type, trigger_config)."""
        with mock_auth():
            resp = client.post(
                "/api/v1/reflexes",
                json={
                    "skill_id": str(uuid4()),
                    "trigger_type": "webhook",
                    "trigger_config": {"url": "https://example.com"},
                },
                headers=auth_headers(),
            )
            # Valid body passes validation (may fail at DB level with 500)
            assert resp.status_code != 422

    def test_create_reflex_missing_skill_id(self):
        """Create reflex without skill_id returns 422."""
        with mock_auth():
            resp = client.post(
                "/api/v1/reflexes",
                json={
                    "trigger_type": "webhook",
                    "trigger_config": {"url": "https://example.com"},
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_get_reflex_invalid_uuid(self):
        """Invalid UUID in path returns 422."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes/not-a-uuid",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_get_reflex_valid_uuid(self):
        """Valid UUID passes path validation."""
        reflex_id = str(uuid4())
        with mock_auth():
            resp = client.get(
                f"/api/v1/reflexes/{reflex_id}",
                headers=auth_headers(),
            )
            # 404 or 500 (DB) -- not 422
            assert resp.status_code != 422

    def test_delete_reflex_requires_auth(self):
        """Reflex deletion requires authentication."""
        reflex_id = str(uuid4())
        resp = client.delete(f"/api/v1/reflexes/{reflex_id}")
        assert resp.status_code in (401, 403)

    def test_test_reflex_accepts_event_data(self):
        """Test reflex endpoint accepts event_data in body."""
        reflex_id = str(uuid4())
        with mock_auth():
            resp = client.post(
                f"/api/v1/reflexes/{reflex_id}/test",
                json={"event_data": {"source": "test", "payload": {"key": "value"}}},
                headers=auth_headers(),
            )
            # Passes validation (may 404/500 at service level)
            assert resp.status_code != 422

    def test_stats_endpoint_accepts_auth(self):
        """Stats endpoint accessible with valid auth."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes/stats",
                headers=auth_headers(),
            )
            assert resp.status_code != 422
            assert resp.status_code != 401

    def test_list_reflexes_invalid_page_zero(self):
        """Page 0 is rejected (minimum is 1)."""
        with mock_auth():
            resp = client.get(
                "/api/v1/reflexes?page=0",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_reflex_invalid_trigger_type(self):
        """Invalid trigger_type is rejected."""
        with mock_auth():
            resp = client.post(
                "/api/v1/reflexes",
                json={
                    "skill_id": str(uuid4()),
                    "trigger_type": "invalid_type",
                    "trigger_config": {},
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422


# ===========================================================================
# 2. Executions Router (extended)
# ===========================================================================

class TestExecutionsRouterAdvanced:

    def test_list_executions_accepts_filter_skill_id(self):
        """List executions accepts skill_id filter."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions?skill_id=some-skill-id",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_executions_accepts_filter_status(self):
        """List executions accepts status filter."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions?status=completed",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_list_executions_accepts_date_range(self):
        """List executions accepts date_from and date_to filters."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions?date_from=2024-01-01&date_to=2024-12-31",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_stats_accepts_days_param(self):
        """Stats endpoint accepts days query param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/stats?days=90",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_stats_days_too_large(self):
        """Stats days >365 is rejected."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/stats?days=400",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_stats_by_skill_accepts_limit(self):
        """Stats by-skill endpoint accepts limit param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/stats/by-skill?limit=10",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_stats_by_period_accepts_granularity(self):
        """Stats by-period endpoint accepts granularity param."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/stats/by-period?granularity=week",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_stats_by_period_invalid_granularity(self):
        """Stats by-period rejects invalid granularity."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/stats/by-period?granularity=hourly",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_get_execution_invalid_uuid(self):
        """Invalid UUID in path returns 422."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions/not-a-uuid",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_execution_endpoints_require_auth(self):
        """Execution listing requires auth."""
        resp = client.get("/api/v1/executions")
        assert resp.status_code in (401, 403)

    def test_execution_stats_requires_auth(self):
        """Execution stats requires auth."""
        resp = client.get("/api/v1/executions/stats")
        assert resp.status_code in (401, 403)


# ===========================================================================
# 3. GDPR Router
# ===========================================================================

class TestGDPRRouter:

    def test_categories_requires_auth(self):
        """Categories endpoint requires authentication."""
        resp = client.get("/api/v1/gdpr/categories")
        assert resp.status_code in (401, 403)

    def test_export_requires_auth(self):
        """Export endpoint requires authentication."""
        resp = client.post("/api/v1/gdpr/export")
        assert resp.status_code in (401, 403)

    def test_delete_requires_auth(self):
        """Delete endpoint requires authentication."""
        resp = client.post("/api/v1/gdpr/delete", json={"confirm": "DELETE_ALL_MY_DATA"})
        assert resp.status_code in (401, 403)

    def test_delete_requires_confirmation(self):
        """Delete endpoint requires proper confirmation field."""
        with mock_auth():
            resp = client.post(
                "/api/v1/gdpr/delete",
                json={"confirm": "wrong_value"},
                headers=auth_headers(),
            )
            assert resp.status_code == 400

    def test_categories_returns_not_422(self):
        """Categories returns structure (or 500 if DB down, but not 422)."""
        with mock_auth():
            resp = client.get(
                "/api/v1/gdpr/categories",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_export_returns_not_422(self):
        """Export returns structure (or 500 if DB down, but not 422)."""
        with mock_auth():
            resp = client.post(
                "/api/v1/gdpr/export",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_delete_with_correct_confirmation(self):
        """Delete with correct confirmation passes validation (may 500 at DB level)."""
        with mock_auth():
            resp = client.post(
                "/api/v1/gdpr/delete",
                json={"confirm": "DELETE_ALL_MY_DATA"},
                headers=auth_headers(),
            )
            # Should not be 400 (validation passed) or 422
            assert resp.status_code not in (400, 422)


# ===========================================================================
# 4. Admin Router
# ===========================================================================

class TestAdminRouter:

    def test_admin_requires_auth(self):
        """Admin endpoint requires authentication."""
        resp = client.post("/api/v1/admin/cleanup-logs")
        assert resp.status_code in (401, 403)

    def test_admin_requires_admin_role(self):
        """Admin endpoint rejects regular user with 403."""
        with mock_auth(user=MOCK_USER):
            resp = client.post(
                "/api/v1/admin/cleanup-logs",
                headers=auth_headers(),
            )
            assert resp.status_code == 403

    def test_admin_with_admin_role_passes_auth(self):
        """Admin endpoint accepts admin role (may fail at DB level)."""
        with mock_auth(user=MOCK_ADMIN):
            resp = client.post(
                "/api/v1/admin/cleanup-logs",
                headers=auth_headers(),
            )
            # Should not be 403 (auth passed) or 422 (no body needed)
            assert resp.status_code not in (403, 422)

    def test_cleanup_logs_is_post(self):
        """Cleanup-logs only accepts POST method."""
        with mock_auth(user=MOCK_ADMIN):
            resp = client.get(
                "/api/v1/admin/cleanup-logs",
                headers=auth_headers(),
            )
            assert resp.status_code == 405


# ===========================================================================
# 5. Billing Model Validation
# ===========================================================================

class TestBillingModelValidation:

    def test_plan_limits_with_alias_fields(self):
        """PlanLimits accepts alias fields (apiCalls, storageGb, oracleQueries)."""
        from server.app.models.billing import PlanLimits

        limits = PlanLimits(
            apiCalls=1000,
            ingestions=50,
            storageGb=10,
            seats=5,
            oracleQueries=200,
        )
        assert limits.api_calls == 1000
        assert limits.storage_gb == 10
        assert limits.oracle_queries == 200

    def test_plan_with_decimal_price(self):
        """Plan uses Decimal for price, not float."""
        from server.app.models.billing import Plan, PlanLimits
        from server.app.models.enums import PlanTier

        plan = Plan(
            id=PlanTier.PRO,
            name="Pro Plan",
            price=Decimal("29.99"),
            description="Professional tier",
            features=["feature1", "feature2"],
            limits=PlanLimits(
                apiCalls=5000,
                ingestions=100,
                storageGb=50,
                seats=10,
                oracleQueries=500,
            ),
        )
        assert isinstance(plan.price, Decimal)
        assert plan.price == Decimal("29.99")

    def test_subscription_create_request_requires_fields(self):
        """SubscriptionCreateRequest requires plan, success_url, cancel_url."""
        from server.app.models.billing import SubscriptionCreateRequest

        with pytest.raises(ValidationError):
            SubscriptionCreateRequest()

        # Valid creation
        req = SubscriptionCreateRequest(
            plan="pro",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
        )
        assert req.success_url == "https://example.com/success"
        assert req.cancel_url == "https://example.com/cancel"

    def test_subscription_create_request_invalid_plan(self):
        """SubscriptionCreateRequest rejects invalid plan tier."""
        from server.app.models.billing import SubscriptionCreateRequest

        with pytest.raises(ValidationError):
            SubscriptionCreateRequest(
                plan="nonexistent_plan",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel",
            )

    def test_payment_method_create_request_requires_id(self):
        """PaymentMethodCreateRequest requires payment_method_id."""
        from server.app.models.billing import PaymentMethodCreateRequest

        with pytest.raises(ValidationError):
            PaymentMethodCreateRequest()

        req = PaymentMethodCreateRequest(payment_method_id="pm_test_123")
        assert req.payment_method_id == "pm_test_123"

    def test_checkout_session_response_requires_fields(self):
        """CheckoutSessionResponse requires session_id and url."""
        from server.app.models.billing import CheckoutSessionResponse

        with pytest.raises(ValidationError):
            CheckoutSessionResponse()

        session = CheckoutSessionResponse(
            session_id="cs_test_123",
            url="https://checkout.stripe.com/pay/cs_test_123",
        )
        assert session.session_id == "cs_test_123"
        assert session.url == "https://checkout.stripe.com/pay/cs_test_123"

    def test_billing_details_defaults_country_to_nl(self):
        """BillingDetails defaults country to 'NL'."""
        from server.app.models.billing import BillingDetails

        details = BillingDetails()
        assert details.country == "NL"

    def test_invoice_requires_decimal_amounts(self):
        """Invoice requires Decimal amounts."""
        from datetime import datetime
        from server.app.models.billing import Invoice

        now = datetime.now()
        invoice = Invoice(
            id="inv_test_123",
            number="INV-001",
            status="paid",
            amount_due=Decimal("2999"),
            amount_paid=Decimal("2999"),
            currency="eur",
            period_start=now,
            period_end=now,
            created_at=now,
        )
        assert isinstance(invoice.amount_due, Decimal)
        assert isinstance(invoice.amount_paid, Decimal)

    def test_invoice_missing_required_fields(self):
        """Invoice rejects missing required fields."""
        from server.app.models.billing import Invoice

        with pytest.raises(ValidationError):
            Invoice()


# ===========================================================================
# 6. Habit Model Validation
# ===========================================================================

class TestHabitModelValidation:

    def test_habit_create_requires_skill_id_and_cron(self):
        """HabitCreate requires skill_id and schedule_cron."""
        from server.app.models.habit import HabitCreate

        with pytest.raises(ValidationError):
            HabitCreate()

        habit = HabitCreate(
            skill_id=str(uuid4()),
            schedule_cron="0 9 * * MON",
        )
        assert habit.schedule_cron == "0 9 * * MON"

    def test_habit_create_schedule_cron_min_length(self):
        """HabitCreate schedule_cron must be at least 9 characters."""
        from server.app.models.habit import HabitCreate

        with pytest.raises(ValidationError):
            HabitCreate(
                skill_id=str(uuid4()),
                schedule_cron="* * *",  # Too short (5 chars)
            )

    def test_habit_create_schedule_description_max_length(self):
        """HabitCreate schedule_description max_length=255."""
        from server.app.models.habit import HabitCreate

        with pytest.raises(ValidationError):
            HabitCreate(
                skill_id=str(uuid4()),
                schedule_cron="0 9 * * MON",
                schedule_description="x" * 256,
            )

    def test_habit_create_defaults_timezone_to_utc(self):
        """HabitCreate defaults timezone to 'UTC'."""
        from server.app.models.habit import HabitCreate

        habit = HabitCreate(
            skill_id=str(uuid4()),
            schedule_cron="0 9 * * MON",
        )
        assert habit.timezone == "UTC"

    def test_cron_validation_request_requires_expression(self):
        """CronValidationRequest requires expression field."""
        from server.app.models.habit import CronValidationRequest

        with pytest.raises(ValidationError):
            CronValidationRequest()

        req = CronValidationRequest(expression="0 9 * * MON")
        assert req.expression == "0 9 * * MON"

    def test_habit_update_all_fields_optional(self):
        """HabitUpdate allows empty body (all fields optional)."""
        from server.app.models.habit import HabitUpdate

        update = HabitUpdate()
        assert update.schedule_cron is None
        assert update.timezone is None
        assert update.is_active is None
        assert update.config is None


# ===========================================================================
# 7. User Model Validation
# ===========================================================================

class TestUserModelValidation:

    def test_user_profile_requires_fields(self):
        """UserProfile requires id, email, first_name, last_name, org_id."""
        from server.app.models.user import UserProfile

        with pytest.raises(ValidationError):
            UserProfile()

        profile = UserProfile(
            id=str(uuid4()),
            email="test@kijko.nl",
            first_name="Test",
            last_name="User",
            org_id=str(uuid4()),
        )
        assert profile.email == "test@kijko.nl"

    def test_user_profile_defaults_plan_to_free(self):
        """UserProfile defaults plan to FREE."""
        from server.app.models.user import UserProfile
        from server.app.models.enums import PlanTier

        profile = UserProfile(
            id=str(uuid4()),
            email="test@kijko.nl",
            first_name="Test",
            last_name="User",
            org_id=str(uuid4()),
        )
        assert profile.plan == PlanTier.FREE

    def test_user_profile_defaults_roles_to_empty(self):
        """UserProfile defaults roles to empty list."""
        from server.app.models.user import UserProfile

        profile = UserProfile(
            id=str(uuid4()),
            email="test@kijko.nl",
            first_name="Test",
            last_name="User",
            org_id=str(uuid4()),
        )
        assert profile.roles == []

    def test_user_search_result_minimal_fields(self):
        """UserSearchResult accepts minimal fields."""
        from server.app.models.user import UserSearchResult

        result = UserSearchResult(
            id=str(uuid4()),
            email="test@kijko.nl",
            name=None,
            avatar_url=None,
        )
        assert result.email == "test@kijko.nl"
        assert result.name is None
        assert result.avatar_url is None
