"""Tests for webhook event handlers and config module.

Covers:
- Stripe webhook signature verification
- Idempotency (duplicate event detection)
- Event routing to correct handlers
- Handler behavior and edge cases
- Error handling that prevents Stripe retries
- Settings defaults from config module
"""

import logging
import uuid
import pytest
from unittest.mock import patch, AsyncMock

import stripe
from fastapi.testclient import TestClient

from server.app.main import app
from server.app.config import Settings, settings
import server.app.routers.webhooks as webhooks_mod
from server.app.routers.webhooks import _mark_processed, _MAX_PROCESSED_CACHE

client = TestClient(app, raise_server_exceptions=False)

WEBHOOK_URL = "/api/v1/webhooks/stripe"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clear_processed_events():
    """Ensure a clean idempotency cache for every test.

    Because _mark_processed uses ``global _processed_events`` and can rebind
    the module-level name to a *new* set (during cache trimming), we must
    always access and reset it through the module object rather than through
    a stale local reference.
    """
    webhooks_mod._processed_events = set()
    yield
    webhooks_mod._processed_events = set()


def _unique_id() -> str:
    """Return a unique event ID for each call to avoid idempotency collisions."""
    return f"evt_{uuid.uuid4().hex[:12]}"


def _make_event(
    event_id: str | None = None,
    event_type: str = "checkout.session.completed",
    data_object: dict | None = None,
) -> dict:
    """Build a mock Stripe event dict."""
    if event_id is None:
        event_id = _unique_id()
    if data_object is None:
        data_object = {
            "customer": "cus_123",
            "subscription": "sub_123",
            "metadata": {"plan": "pro"},
        }
    return {
        "id": event_id,
        "type": event_type,
        "data": {"object": data_object},
    }


# =========================================================================
# TestWebhookSignatureVerification
# =========================================================================

class TestWebhookSignatureVerification:
    """Stripe signature verification on the webhook endpoint."""

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_missing_stripe_signature_header(self, mock_construct):
        """Request without stripe-signature header should fail with 400."""
        mock_construct.side_effect = stripe.error.SignatureVerificationError(
            "No signature", "sig"
        )
        resp = client.post(WEBHOOK_URL, content=b'{}')
        assert resp.status_code == 400
        assert "signature" in resp.json()["detail"].lower()

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_invalid_payload(self, mock_construct):
        """Corrupt body raises ValueError -> 400."""
        mock_construct.side_effect = ValueError("Invalid payload")
        resp = client.post(
            WEBHOOK_URL,
            content=b'not-json',
            headers={"stripe-signature": "t=123,v1=abc"},
        )
        assert resp.status_code == 400
        assert "payload" in resp.json()["detail"].lower()

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_invalid_signature(self, mock_construct):
        """Bad HMAC -> SignatureVerificationError -> 400."""
        mock_construct.side_effect = stripe.error.SignatureVerificationError(
            "Signature mismatch", "sig_header"
        )
        resp = client.post(
            WEBHOOK_URL,
            content=b'{"id":"evt_1"}',
            headers={"stripe-signature": "t=123,v1=bad"},
        )
        assert resp.status_code == 400
        assert "signature" in resp.json()["detail"].lower()

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_valid_signature_processes_event(self, mock_construct):
        """Valid signature allows the event to be processed."""
        mock_construct.return_value = _make_event()
        resp = client.post(
            WEBHOOK_URL,
            content=b'{}',
            headers={"stripe-signature": "t=123,v1=valid"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["event_type"] == "checkout.session.completed"


# =========================================================================
# TestWebhookIdempotency
# =========================================================================

class TestWebhookIdempotency:
    """Duplicate-event detection via in-memory idempotency set."""

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_first_processing_returns_ok(self, mock_construct):
        """First time seeing an event ID -> status ok."""
        mock_construct.return_value = _make_event(event_id="evt_first")
        resp = client.post(
            WEBHOOK_URL,
            content=b'{}',
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_duplicate_event_returns_already_processed(self, mock_construct):
        """Second submission of the same event ID -> already_processed."""
        event = _make_event(event_id="evt_dup")
        mock_construct.return_value = event

        # First call
        resp1 = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp1.json()["status"] == "ok"

        # Duplicate
        resp2 = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "already_processed"

    def test_cache_trimming_when_exceeding_max_size(self):
        """_mark_processed trims the set when it exceeds _MAX_PROCESSED_CACHE."""
        # Fill the cache beyond max
        for i in range(_MAX_PROCESSED_CACHE + 1):
            _mark_processed(f"evt_{i}")

        # After trimming, read the *current* module-level set (may have been rebound)
        current = webhooks_mod._processed_events
        assert len(current) <= _MAX_PROCESSED_CACHE
        assert len(current) >= _MAX_PROCESSED_CACHE // 2


# =========================================================================
# TestWebhookEventRouting
# =========================================================================

class TestWebhookEventRouting:
    """Each recognised event type dispatches to its handler."""

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_checkout_session_completed(self, mock_construct):
        mock_construct.return_value = _make_event(
            event_type="checkout.session.completed",
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.json() == {"status": "ok", "event_type": "checkout.session.completed"}

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_customer_subscription_updated(self, mock_construct):
        mock_construct.return_value = _make_event(
            event_type="customer.subscription.updated",
            data_object={"id": "sub_1", "status": "active", "cancel_at_period_end": False},
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.json() == {"status": "ok", "event_type": "customer.subscription.updated"}

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_customer_subscription_deleted(self, mock_construct):
        mock_construct.return_value = _make_event(
            event_type="customer.subscription.deleted",
            data_object={"id": "sub_1"},
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.json() == {"status": "ok", "event_type": "customer.subscription.deleted"}

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_invoice_payment_succeeded(self, mock_construct):
        mock_construct.return_value = _make_event(
            event_type="invoice.payment_succeeded",
            data_object={"id": "inv_1", "amount_paid": 2999, "customer": "cus_1"},
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.json() == {"status": "ok", "event_type": "invoice.payment_succeeded"}

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_invoice_payment_failed(self, mock_construct):
        mock_construct.return_value = _make_event(
            event_type="invoice.payment_failed",
            data_object={
                "id": "inv_2",
                "amount_due": 2999,
                "customer": "cus_1",
                "attempt_count": 2,
            },
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.json() == {"status": "ok", "event_type": "invoice.payment_failed"}

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_unknown_event_type_returns_ok(self, mock_construct):
        """Unrecognised event types are accepted but not dispatched."""
        mock_construct.return_value = _make_event(
            event_type="charge.refunded",
            data_object={"id": "ch_1"},
        )
        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        body = resp.json()
        assert body["status"] == "ok"
        assert body["event_type"] == "charge.refunded"


# =========================================================================
# TestWebhookHandlers
# =========================================================================

class TestWebhookHandlers:
    """Verify individual handler behaviour via log output."""

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_checkout_completed_logs_customer_and_subscription(
        self, mock_construct, caplog,
    ):
        mock_construct.return_value = _make_event(
            event_type="checkout.session.completed",
            data_object={
                "customer": "cus_abc",
                "subscription": "sub_xyz",
                "metadata": {"plan": "pro"},
            },
        )
        with caplog.at_level(logging.INFO, logger="server.app.routers.webhooks"):
            resp = client.post(
                WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
            )
        assert resp.status_code == 200
        assert any("cus_abc" in r.message for r in caplog.records)
        assert any("sub_xyz" in r.message for r in caplog.records)

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_checkout_completed_handles_missing_customer(
        self, mock_construct, caplog,
    ):
        """Missing customer/subscription logs a warning and returns early."""
        mock_construct.return_value = _make_event(
            event_type="checkout.session.completed",
            data_object={"metadata": {}},
        )
        with caplog.at_level(logging.WARNING, logger="server.app.routers.webhooks"):
            resp = client.post(
                WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
            )
        assert resp.status_code == 200
        assert any("missing" in r.message.lower() for r in caplog.records)

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_subscription_updated_logs_status(self, mock_construct, caplog):
        mock_construct.return_value = _make_event(
            event_type="customer.subscription.updated",
            data_object={"id": "sub_up", "status": "past_due", "cancel_at_period_end": True},
        )
        with caplog.at_level(logging.INFO, logger="server.app.routers.webhooks"):
            resp = client.post(
                WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
            )
        assert resp.status_code == 200
        assert any("past_due" in r.message for r in caplog.records)

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_subscription_deleted_logs_revert_to_free(self, mock_construct, caplog):
        mock_construct.return_value = _make_event(
            event_type="customer.subscription.deleted",
            data_object={"id": "sub_del"},
        )
        with caplog.at_level(logging.INFO, logger="server.app.routers.webhooks"):
            resp = client.post(
                WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
            )
        assert resp.status_code == 200
        assert any("free" in r.message.lower() for r in caplog.records)

    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_payment_failed_logs_warning_with_attempt_count(
        self, mock_construct, caplog,
    ):
        mock_construct.return_value = _make_event(
            event_type="invoice.payment_failed",
            data_object={
                "id": "inv_fail",
                "amount_due": 4999,
                "customer": "cus_fail",
                "attempt_count": 3,
            },
        )
        with caplog.at_level(logging.WARNING, logger="server.app.routers.webhooks"):
            resp = client.post(
                WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
            )
        assert resp.status_code == 200
        assert any("3" in r.message and "FAILED" in r.message for r in caplog.records)


# =========================================================================
# TestWebhookErrorHandling
# =========================================================================

class TestWebhookErrorHandling:
    """Application errors in handlers return 200 to prevent Stripe retries."""

    @patch("server.app.routers.webhooks._handle_checkout_completed", new_callable=AsyncMock)
    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_handler_exception_returns_200_with_error_status(
        self, mock_construct, mock_handler,
    ):
        """If a handler raises, the endpoint returns 200 + status error."""
        mock_construct.return_value = _make_event(
            event_type="checkout.session.completed",
        )
        mock_handler.side_effect = RuntimeError("DB connection lost")

        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "error"
        assert body["event_type"] == "checkout.session.completed"

    @patch("server.app.routers.webhooks._handle_subscription_updated", new_callable=AsyncMock)
    @patch("server.app.routers.webhooks.stripe.Webhook.construct_event")
    def test_prevents_stripe_retries_on_application_errors(
        self, mock_construct, mock_handler,
    ):
        """Even on error the HTTP status is 200 so Stripe won't retry."""
        mock_construct.return_value = _make_event(
            event_type="customer.subscription.updated",
            data_object={"id": "sub_err", "status": "active"},
        )
        mock_handler.side_effect = Exception("unexpected crash")

        resp = client.post(
            WEBHOOK_URL, content=b'{}', headers={"stripe-signature": "sig"},
        )
        # Must be 200 -- any 4xx/5xx causes Stripe to retry
        assert resp.status_code == 200
        assert resp.json()["status"] == "error"


# =========================================================================
# TestSettings
# =========================================================================

class TestSettings:
    """Config module default values.

    Note: the conftest.py sets CORS_ORIGINS via an env var, so Settings()
    picks up that override.  Tests below therefore check the *loaded* values
    rather than the class defaults when env vars are present.
    """

    def test_default_supabase_url(self):
        s = Settings()
        assert s.SUPABASE_URL == "http://localhost:54321"

    def test_default_keycloak_settings(self):
        s = Settings()
        assert s.KEYCLOAK_URL == "https://auth.kijko.nl"
        assert s.KEYCLOAK_REALM == "kijko"
        assert s.KEYCLOAK_CLIENT_ID == "kijko-backend"

    def test_cors_origins_has_expected_entries(self):
        """CORS_ORIGINS should always include app.kijko.nl regardless of env."""
        s = Settings()
        assert "https://app.kijko.nl" in s.CORS_ORIGINS
        # Should have at least one localhost entry
        assert any("localhost" in origin for origin in s.CORS_ORIGINS)

    def test_default_debug_is_false(self):
        s = Settings()
        assert s.DEBUG is False

    def test_default_api_prefix(self):
        s = Settings()
        assert s.API_PREFIX == "/api/v1"

    def test_app_title_and_version(self):
        s = Settings()
        assert s.APP_TITLE == "Kijko API"
        assert s.APP_VERSION == "1.0.0"

    def test_sentry_defaults(self):
        s = Settings()
        assert s.SENTRY_DSN == ""
        assert s.SENTRY_ENVIRONMENT == "development"
        assert s.SENTRY_TRACES_SAMPLE_RATE == 0.1

    def test_stripe_defaults_are_placeholder_values(self):
        s = Settings()
        assert s.STRIPE_SECRET_KEY == "sk_test_placeholder"
        assert s.STRIPE_WEBHOOK_SECRET == "whsec_placeholder"

    def test_settings_singleton_is_importable(self):
        """The module-level ``settings`` instance should be a Settings object."""
        assert isinstance(settings, Settings)

    def test_redis_url_default(self):
        s = Settings()
        assert s.REDIS_URL == "redis://localhost:6379"

    def test_celery_defaults(self):
        s = Settings()
        assert s.CELERY_BROKER_URL == "redis://localhost:6379/0"
        assert s.CELERY_RESULT_BACKEND == "redis://localhost:6379/1"
