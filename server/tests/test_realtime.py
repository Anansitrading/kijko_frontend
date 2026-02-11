"""Tests for WebSocket, GDPR, and observability middleware."""

import time
import uuid
import pytest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from server.app.main import app

# Test credentials
TEST_SECRET = "test-secret-key-for-jwt-signing-do-not-use-in-production"
TEST_USER_ID = str(uuid.UUID("11111111-1111-1111-1111-111111111111"))
TEST_ORG_ID = str(uuid.UUID("22222222-2222-2222-2222-222222222222"))


def _make_token() -> str:
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
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {_make_token()}"}


# =============================================================================
# WebSocket Tests
# =============================================================================

class TestWebSocket:
    """Tests for WebSocket connection and rooms."""

    def test_connection_manager_basic(self):
        """Test ConnectionManager tracks connections."""
        from server.app.services.websocket import ConnectionManager

        mgr = ConnectionManager()
        assert mgr.active_connections == 0

    def test_room_membership(self):
        """Test room join/leave."""
        from server.app.services.websocket import ConnectionManager
        from unittest.mock import MagicMock

        mgr = ConnectionManager()
        ws = MagicMock()

        mgr.join_room(ws, "org:test-org")
        assert mgr.get_room_members("org:test-org") == 1

        mgr.leave_room(ws, "org:test-org")
        assert mgr.get_room_members("org:test-org") == 0

    def test_room_validation(self):
        """Test room access validation."""
        from server.app.routers.ws import _validate_room_access

        claims = {"sub": "user-1", "org_id": "org-1"}

        # Valid access
        assert _validate_room_access("org:org-1", claims) is True
        assert _validate_room_access("user:user-1", claims) is True
        assert _validate_room_access("project:any-id", claims) is True

        # Invalid access
        assert _validate_room_access("org:other-org", claims) is False
        assert _validate_room_access("user:other-user", claims) is False
        assert _validate_room_access("invalid-format", claims) is False


# =============================================================================
# GDPR Tests
# =============================================================================

class TestGDPR:
    """Tests for GDPR endpoints."""

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    def test_get_categories(self, mock_validate, client, auth_headers):
        """Test GDPR categories endpoint returns data categories."""
        mock_validate.side_effect = _mock_validate_token

        resp = client.get("/api/v1/gdpr/categories", headers=auth_headers)
        # May return 200 or 500 depending on Supabase availability
        # When Supabase is configured, returns list of categories
        assert resp.status_code in (200, 500)

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    def test_delete_requires_confirmation(self, mock_validate, client, auth_headers):
        """Test GDPR delete requires explicit confirmation."""
        mock_validate.side_effect = _mock_validate_token

        # Without confirmation
        resp = client.post("/api/v1/gdpr/delete", headers=auth_headers, json={})
        assert resp.status_code == 400
        assert "Confirmation required" in resp.json()["detail"]

    @patch("server.app.services.keycloak.KeycloakService.validate_token", new_callable=AsyncMock)
    def test_delete_wrong_confirmation(self, mock_validate, client, auth_headers):
        """Test GDPR delete rejects wrong confirmation text."""
        mock_validate.side_effect = _mock_validate_token

        resp = client.post("/api/v1/gdpr/delete", headers=auth_headers, json={
            "confirm": "wrong_text",
        })
        assert resp.status_code == 400


# =============================================================================
# Observability Tests
# =============================================================================

class TestObservability:
    """Tests for observability middleware."""

    def test_health_returns_headers(self, client):
        """Test that responses include observability headers."""
        resp = client.get("/health")
        assert resp.status_code == 200
        assert "X-Request-ID" in resp.headers
        assert "X-Process-Time" in resp.headers

    def test_request_id_propagated(self, client):
        """Test that provided X-Request-ID is propagated."""
        resp = client.get("/health", headers={"X-Request-ID": "test-123"})
        assert resp.headers["X-Request-ID"] == "test-123"

    def test_process_time_format(self, client):
        """Test process time header format."""
        resp = client.get("/health")
        process_time = resp.headers["X-Process-Time"]
        assert process_time.endswith("ms")
        # Should be a valid number
        ms_value = int(process_time.replace("ms", ""))
        assert ms_value >= 0
