"""Tests for billing service, router, and webhook handler."""

import json
import time
import uuid
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from server.app.main import app

# Test credentials (same pattern as test_auth.py)
TEST_SECRET = "test-secret-key-for-jwt-signing-do-not-use-in-production"
TEST_USER_ID = str(uuid.UUID("11111111-1111-1111-1111-111111111111"))
TEST_ORG_ID = str(uuid.UUID("22222222-2222-2222-2222-222222222222"))


def _make_token() -> str:
    """Create a test JWT token."""
    now = int(time.time())
    return jose_jwt.encode({
        "sub": TEST_USER_ID,
        "org_id": TEST_ORG_ID,
        "email": "test@kijko.nl",
        "given_name": "Test", "family_name": "User",
        "email_verified": True,
        "preferred_username": "test@kijko.nl",
        "realm_access": {"roles": ["user"]},
        "iss": "https://auth.kijko.nl/realms/kijko",
        "aud": "kijko-backend",
        "iat": now, "exp": now + 3600,
    }, TEST_SECRET, algorithm="HS256")


def _mock_validate_token(token: str) -> dict:
    """Mock Keycloak token validation."""
    try:
        payload = jose_jwt.decode(
            token, TEST_SECRET, algorithms=["HS256"],
            audience="kijko-backend", options={"verify_exp": True},
        )
        realm_roles = payload.get("realm_access", {}).get("roles", [])
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email", ""),
            "email_verified": payload.get("email_verified", False),
            "first_name": payload.get("given_name", ""),
            "last_name": payload.get("family_name", ""),
            "org_id": payload.get("org_id", ""),
            "roles": realm_roles,
            "preferred_username": payload.get("preferred_username", ""),
        }
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid token")


@pytest.fixture
def test_client():
    """Test client with mocked Keycloak validation."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Authorization headers with valid Bearer token."""
    return {"Authorization": f"Bearer {_make_token()}"}


# =============================================================================
# Plan Tests
# =============================================================================

class TestPlans:
    """Tests for plan listing."""

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    def test_list_plans(self, mock_validate, test_client, auth_headers):
        """Test that plans endpoint returns all plan tiers."""
        mock_validate.side_effect = _mock_validate_token

        resp = test_client.get("/api/v1/billing/plans", headers=auth_headers)
        assert resp.status_code == 200
        plans = resp.json()
        assert len(plans) == 4  # free, pro, teams, enterprise
        assert plans[0]["id"] == "free"
        assert plans[1]["id"] == "pro"

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    def test_plan_has_limits(self, mock_validate, test_client, auth_headers):
        """Test that each plan includes limit definitions."""
        mock_validate.side_effect = _mock_validate_token

        resp = test_client.get("/api/v1/billing/plans", headers=auth_headers)
        plans = resp.json()
        for plan in plans:
            assert "limits" in plan
            assert "apiCalls" in plan["limits"]
            assert "storageGb" in plan["limits"]


# =============================================================================
# Checkout Tests
# =============================================================================

class TestCheckout:
    """Tests for checkout session creation."""

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    @patch("server.app.services.stripe_service.get_or_create_customer")
    @patch("server.app.services.stripe_service.create_checkout_session")
    def test_create_checkout(
        self, mock_session, mock_customer, mock_validate,
        test_client, auth_headers,
    ):
        """Test creating a Stripe checkout session."""
        mock_validate.side_effect = _mock_validate_token
        mock_customer.return_value = MagicMock(id="cus_test123")
        mock_session.return_value = MagicMock(id="cs_test123", url="https://checkout.stripe.com/test")

        resp = test_client.post("/api/v1/billing/checkout", headers=auth_headers, json={
            "plan": "pro",
            "billing_interval": "monthly",
            "success_url": "https://app.kijko.nl/billing/success",
            "cancel_url": "https://app.kijko.nl/billing",
        })

        assert resp.status_code == 200
        data = resp.json()
        assert data["session_id"] == "cs_test123"
        assert "url" in data


# =============================================================================
# Subscription Tests
# =============================================================================

class TestSubscription:
    """Tests for subscription management."""

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    @patch("server.app.services.stripe_service.get_customer_by_org")
    def test_no_subscription(self, mock_customer, mock_validate, test_client, auth_headers):
        """Test response when org has no subscription."""
        mock_validate.side_effect = _mock_validate_token
        mock_customer.return_value = None

        resp = test_client.get("/api/v1/billing/subscription", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "no_subscription"
        assert resp.json()["plan"] == "free"


# =============================================================================
# Webhook Tests
# =============================================================================

class TestWebhook:
    """Tests for Stripe webhook handler."""

    @patch("stripe.Webhook.construct_event")
    def test_valid_webhook(self, mock_construct, test_client):
        """Test webhook with valid signature processes event."""
        mock_construct.return_value = {
            "id": "evt_test123",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "customer": "cus_test",
                    "subscription": "sub_test",
                    "metadata": {"plan": "starter"},
                },
            },
        }

        resp = test_client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"test": true}',
            headers={"stripe-signature": "valid_sig"},
        )

        assert resp.status_code == 200
        assert resp.json()["event_type"] == "checkout.session.completed"

    @patch("stripe.Webhook.construct_event")
    def test_invalid_signature(self, mock_construct, test_client):
        """Test webhook rejects invalid signature."""
        import stripe as stripe_module
        mock_construct.side_effect = stripe_module.error.SignatureVerificationError(
            "Invalid", "sig_header",
        )

        resp = test_client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"test": true}',
            headers={"stripe-signature": "invalid_sig"},
        )

        assert resp.status_code == 400
        assert "signature" in resp.json()["detail"].lower()

    @patch("stripe.Webhook.construct_event")
    def test_duplicate_event_skipped(self, mock_construct, test_client):
        """Test that duplicate events are skipped."""
        event = {
            "id": "evt_duplicate_test",
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "inv_test",
                    "amount_paid": 2900,
                    "customer": "cus_test",
                },
            },
        }
        mock_construct.return_value = event

        # First call
        resp1 = test_client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"test": true}',
            headers={"stripe-signature": "valid_sig"},
        )
        assert resp1.status_code == 200

        # Second call (duplicate)
        resp2 = test_client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"test": true}',
            headers={"stripe-signature": "valid_sig"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "already_processed"

    @patch("stripe.Webhook.construct_event")
    def test_unhandled_event_type(self, mock_construct, test_client):
        """Test that unhandled event types return OK."""
        mock_construct.return_value = {
            "id": "evt_unhandled_test",
            "type": "some.unknown.event",
            "data": {"object": {}},
        }

        resp = test_client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"test": true}',
            headers={"stripe-signature": "valid_sig"},
        )

        assert resp.status_code == 200


# =============================================================================
# BTW Validation Tests
# =============================================================================

class TestBtwValidation:
    """Tests for BTW/VAT number validation."""

    def test_valid_dutch_btw(self):
        """Test valid Dutch BTW number format."""
        from server.app.services.stripe_service import validate_btw_number

        result = validate_btw_number("NL123456789B01")
        assert result["valid"] is True

    def test_invalid_btw(self):
        """Test invalid BTW number."""
        from server.app.services.stripe_service import validate_btw_number

        result = validate_btw_number("INVALID123")
        assert result["valid"] is False

    def test_btw_whitespace_handling(self):
        """Test BTW number with whitespace is cleaned."""
        from server.app.services.stripe_service import validate_btw_number

        result = validate_btw_number("  nl 123456789 b01  ")
        assert result["valid"] is True
        assert result["btw_number"] == "NL123456789B01"


# =============================================================================
# Portal Tests
# =============================================================================

class TestPortal:
    """Tests for Stripe Customer Portal."""

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    @patch("server.app.services.stripe_service.get_customer_by_org")
    @patch("server.app.services.stripe_service.create_portal_session")
    def test_create_portal_session(
        self, mock_portal, mock_customer, mock_validate,
        test_client, auth_headers,
    ):
        """Test creating a portal session."""
        mock_validate.side_effect = _mock_validate_token
        mock_customer.return_value = MagicMock(id="cus_test123")
        mock_portal.return_value = MagicMock(url="https://billing.stripe.com/session/test")

        resp = test_client.post("/api/v1/billing/portal", headers=auth_headers, json={
            "return_url": "https://app.kijko.nl/settings",
        })

        assert resp.status_code == 200
        assert "url" in resp.json()

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    @patch("server.app.services.stripe_service.get_customer_by_org")
    def test_portal_no_customer(self, mock_customer, mock_validate, test_client, auth_headers):
        """Test portal when no billing account exists."""
        mock_validate.side_effect = _mock_validate_token
        mock_customer.return_value = None

        resp = test_client.post("/api/v1/billing/portal", headers=auth_headers, json={})
        assert resp.status_code == 404


# =============================================================================
# Usage Service Tests
# =============================================================================

class TestUsageService:
    """Tests for usage metering (unit tests, no Redis)."""

    def test_plan_limits_defined(self):
        """Test that all plan tiers have limits defined."""
        from server.app.services.usage import PLAN_LIMITS
        from server.app.models.enums import PlanTier

        assert PlanTier.FREE in PLAN_LIMITS
        assert PlanTier.PRO in PLAN_LIMITS
        assert PlanTier.TEAMS in PLAN_LIMITS
        assert PlanTier.ENTERPRISE in PLAN_LIMITS

    def test_free_tier_limits(self):
        """Test free tier has restrictive limits."""
        from server.app.services.usage import PLAN_LIMITS
        from server.app.models.enums import PlanTier

        free = PLAN_LIMITS[PlanTier.FREE]
        assert free["api_calls"] == 100
        assert free["seats"] == 1

    def test_enterprise_tier_generous(self):
        """Test enterprise tier has generous limits."""
        from server.app.services.usage import PLAN_LIMITS
        from server.app.models.enums import PlanTier

        enterprise = PLAN_LIMITS[PlanTier.ENTERPRISE]
        assert enterprise["api_calls"] == 100000
        assert enterprise["seats"] == 100
