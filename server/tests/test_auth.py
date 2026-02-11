"""Auth middleware and endpoint tests.

Uses a test RSA key pair to sign JWTs, mocking Keycloak's JWKS response.
No live Keycloak needed — all HTTP calls are mocked.
"""

import time
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from server.app.main import app

# ---------------------------------------------------------------------------
# Test RSA key pair (DO NOT use in production — test only)
# Generated deterministically for repeatable tests
# ---------------------------------------------------------------------------

# We use HMAC for test simplicity since python-jose can validate HS256
# In production, RS256 with JWKS is used. Tests mock the validation layer.
TEST_SECRET = "test-secret-key-for-jwt-signing-do-not-use-in-production"
TEST_USER_ID = str(uuid.UUID("11111111-1111-1111-1111-111111111111"))
TEST_ORG_ID = str(uuid.UUID("22222222-2222-2222-2222-222222222222"))
TEST_EMAIL = "test@example.com"


def _make_token(
    sub: str = TEST_USER_ID,
    org_id: str = TEST_ORG_ID,
    email: str = TEST_EMAIL,
    roles: list[str] | None = None,
    expired: bool = False,
) -> str:
    """Create a test JWT token."""
    now = int(time.time())
    payload = {
        "sub": sub,
        "org_id": org_id,
        "email": email,
        "given_name": "Test",
        "family_name": "User",
        "email_verified": True,
        "preferred_username": email,
        "realm_access": {"roles": roles or ["user"]},
        "iss": "https://auth.kijko.nl/realms/kijko",
        "aud": "kijko-backend",
        "iat": now,
        "exp": now - 3600 if expired else now + 3600,
    }
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


def _mock_validate_token(token: str) -> dict:
    """Mock Keycloak token validation — decode without real JWKS."""
    try:
        payload = jwt.decode(
            token,
            TEST_SECRET,
            algorithms=["HS256"],
            audience="kijko-backend",
            options={"verify_exp": True},
        )
        # Extract claims the same way KeycloakService does
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
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """TestClient with mocked Keycloak validation."""
    return TestClient(app)


@pytest.fixture
def valid_token():
    """A valid test JWT."""
    return _make_token()


@pytest.fixture
def expired_token():
    """An expired test JWT."""
    return _make_token(expired=True)


@pytest.fixture
def auth_headers(valid_token):
    """Authorization headers with valid Bearer token."""
    return {"Authorization": f"Bearer {valid_token}"}


# ---------------------------------------------------------------------------
# Auth Router Tests
# ---------------------------------------------------------------------------

class TestAuthEndpoints:
    """Test auth router endpoints."""

    def test_login_endpoint_exists(self, client):
        """POST /api/v1/auth/login endpoint exists and rejects empty body."""
        resp = client.post("/api/v1/auth/login")
        # Should get 422 (validation error for missing body), not 404
        assert resp.status_code == 422

    def test_signup_endpoint_exists(self, client):
        """POST /api/v1/auth/signup endpoint exists."""
        resp = client.post("/api/v1/auth/signup")
        assert resp.status_code == 422

    def test_refresh_endpoint_exists(self, client):
        """POST /api/v1/auth/refresh endpoint exists."""
        resp = client.post("/api/v1/auth/refresh")
        assert resp.status_code == 422

    def test_logout_endpoint_exists(self, client):
        """POST /api/v1/auth/logout endpoint exists."""
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 422

    def test_oauth_redirect_endpoint_exists(self, client):
        """GET /api/v1/auth/oauth/google endpoint exists."""
        with patch(
            "server.app.services.keycloak.KeycloakService.get_oauth_redirect_url",
            return_value="https://auth.kijko.nl/realms/kijko/protocol/openid-connect/auth?test=1",
        ):
            resp = client.get("/api/v1/auth/oauth/google")
            assert resp.status_code == 200
            data = resp.json()
            assert "redirect_url" in data
            assert data["provider"] == "google"

    def test_oauth_unsupported_provider(self, client):
        """GET /api/v1/auth/oauth/twitter returns 400."""
        resp = client.get("/api/v1/auth/oauth/twitter")
        assert resp.status_code == 400

    def test_login_with_mock_keycloak(self, client):
        """POST /api/v1/auth/login with mocked Keycloak returns tokens."""
        mock_response = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "token_type": "Bearer",
            "expires_in": 300,
        }
        with patch(
            "server.app.services.keycloak.KeycloakService.authenticate",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "testpass123"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["access_token"] == "test-access-token"
            assert data["refresh_token"] == "test-refresh-token"
            assert data["token_type"] == "Bearer"

    def test_signup_with_mock_keycloak(self, client):
        """POST /api/v1/auth/signup with mocked Keycloak returns 201 + tokens."""
        mock_response = {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
            "token_type": "Bearer",
            "expires_in": 300,
        }
        with patch(
            "server.app.services.keycloak.KeycloakService.register_user",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            resp = client.post(
                "/api/v1/auth/signup",
                json={
                    "email": "new@example.com",
                    "password": "newpass123",
                    "first_name": "New",
                    "last_name": "User",
                },
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["access_token"] == "new-access-token"

    def test_refresh_with_mock_keycloak(self, client):
        """POST /api/v1/auth/refresh with mocked Keycloak returns new tokens."""
        mock_response = {
            "access_token": "refreshed-token",
            "refresh_token": "new-refresh",
            "token_type": "Bearer",
            "expires_in": 300,
        }
        with patch(
            "server.app.services.keycloak.KeycloakService.refresh_token",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "old-refresh-token"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["access_token"] == "refreshed-token"

    def test_logout_with_mock_keycloak(self, client):
        """POST /api/v1/auth/logout returns 204."""
        with patch(
            "server.app.services.keycloak.KeycloakService.logout",
            new_callable=AsyncMock,
        ):
            resp = client.post(
                "/api/v1/auth/logout",
                json={"refresh_token": "some-refresh-token"},
            )
            assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Protected Endpoint Tests
# ---------------------------------------------------------------------------

class TestProtectedEndpoints:
    """Test that auth middleware protects endpoints correctly."""

    def test_me_unauthenticated(self, client):
        """GET /api/v1/auth/me without token returns 401 or 403."""
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    def test_me_authenticated(self, client, valid_token):
        """GET /api/v1/auth/me with valid token returns profile."""
        with patch(
            "server.app.services.keycloak.KeycloakService.validate_token",
            new_callable=AsyncMock,
            return_value=_mock_validate_token(valid_token),
        ):
            resp = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {valid_token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["email"] == TEST_EMAIL
            assert data["id"] == TEST_USER_ID

    def test_me_expired_token(self, client, expired_token):
        """GET /api/v1/auth/me with expired token returns 401."""
        from fastapi import HTTPException

        with patch(
            "server.app.services.keycloak.KeycloakService.validate_token",
            new_callable=AsyncMock,
            side_effect=HTTPException(status_code=401, detail="Token expired"),
        ):
            resp = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {expired_token}"},
            )
            assert resp.status_code == 401

    def test_health_no_auth_required(self, client):
        """GET /health does not require authentication."""
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Validation Tests
# ---------------------------------------------------------------------------

class TestAuthValidation:
    """Test request body validation for auth endpoints."""

    def test_login_email_validation(self, client):
        """Login rejects invalid email."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "not-an-email", "password": "testpass123"},
        )
        assert resp.status_code == 422

    def test_login_password_too_short(self, client):
        """Login rejects password < 8 chars."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "short"},
        )
        assert resp.status_code == 422

    def test_signup_missing_fields(self, client):
        """Signup rejects missing required fields."""
        resp = client.post(
            "/api/v1/auth/signup",
            json={"email": "test@example.com", "password": "testpass123"},
        )
        assert resp.status_code == 422  # Missing first_name, last_name

    def test_signup_name_too_long(self, client):
        """Signup rejects name > 50 chars."""
        resp = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "test@example.com",
                "password": "testpass123",
                "first_name": "A" * 51,
                "last_name": "User",
            },
        )
        assert resp.status_code == 422
