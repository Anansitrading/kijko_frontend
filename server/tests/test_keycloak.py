"""Unit tests for KeycloakService — OIDC discovery, JWKS caching, token validation.

Mocks all HTTP calls (httpx) to test business logic in isolation.
"""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException
from jose import JWTError

from server.app.services.keycloak import KeycloakService, get_keycloak, JWKS_CACHE_TTL


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def kc():
    """Fresh KeycloakService instance with mocked HTTP client."""
    service = KeycloakService()
    service._http_client = AsyncMock(spec=httpx.AsyncClient)
    service._http_client.is_closed = False
    return service


@pytest.fixture
def sample_oidc_config():
    """Sample OIDC discovery document."""
    return {
        "token_endpoint": "https://auth.kijko.nl/realms/kijko/protocol/openid-connect/token",
        "end_session_endpoint": "https://auth.kijko.nl/realms/kijko/protocol/openid-connect/logout",
        "authorization_endpoint": "https://auth.kijko.nl/realms/kijko/protocol/openid-connect/auth",
        "userinfo_endpoint": "https://auth.kijko.nl/realms/kijko/protocol/openid-connect/userinfo",
        "jwks_uri": "https://auth.kijko.nl/realms/kijko/protocol/openid-connect/certs",
    }


@pytest.fixture
def sample_jwks():
    """Sample JWKS response."""
    return {
        "keys": [
            {
                "kid": "test-key-id",
                "kty": "RSA",
                "alg": "RS256",
                "use": "sig",
                "n": "test-modulus",
                "e": "AQAB",
            }
        ]
    }


@pytest.fixture
def sample_jwt_payload():
    """Decoded JWT payload from Keycloak."""
    return {
        "sub": "user-uuid-123",
        "email": "test@kijko.nl",
        "email_verified": True,
        "given_name": "Test",
        "family_name": "User",
        "preferred_username": "testuser",
        "org_id": "org-uuid-456",
        "realm_access": {
            "roles": ["admin", "offline_access", "uma_authorization", "default-roles-kijko"]
        },
        "resource_access": {
            "kijko-backend": {
                "roles": ["developer"]
            }
        },
    }


# ---------------------------------------------------------------------------
# OIDC Discovery
# ---------------------------------------------------------------------------

class TestOIDCDiscovery:

    @pytest.mark.asyncio
    async def test_discover_oidc_success(self, kc, sample_oidc_config):
        """OIDC discovery fetches and caches config."""
        resp_mock = MagicMock()
        resp_mock.json.return_value = sample_oidc_config
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.get = AsyncMock(return_value=resp_mock)

        result = await kc.discover_oidc()

        assert result == sample_oidc_config
        assert kc.token_endpoint == sample_oidc_config["token_endpoint"]
        assert kc.jwks_uri == sample_oidc_config["jwks_uri"]
        kc._http_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_discover_oidc_cached(self, kc, sample_oidc_config):
        """Second call returns cached config without HTTP request."""
        kc._oidc_config = sample_oidc_config

        result = await kc.discover_oidc()

        assert result == sample_oidc_config
        kc._http_client.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_discover_oidc_http_failure(self, kc):
        """OIDC discovery returns empty dict on HTTP failure (graceful degradation)."""
        kc._http_client.get = AsyncMock(side_effect=httpx.HTTPError("Connection refused"))

        result = await kc.discover_oidc()

        assert result == {}
        # Endpoints should remain at defaults
        assert "/protocol/openid-connect/token" in kc.token_endpoint


# ---------------------------------------------------------------------------
# JWKS Key Fetching
# ---------------------------------------------------------------------------

class TestJWKS:

    @pytest.mark.asyncio
    async def test_get_jwks_fetches_on_first_call(self, kc, sample_jwks):
        """First JWKS call fetches from endpoint."""
        resp_mock = MagicMock()
        resp_mock.json.return_value = sample_jwks
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.get = AsyncMock(return_value=resp_mock)

        result = await kc.get_jwks()

        assert result == sample_jwks
        assert kc._jwks == sample_jwks
        assert kc._jwks_fetched_at > 0

    @pytest.mark.asyncio
    async def test_get_jwks_cached_within_ttl(self, kc, sample_jwks):
        """JWKS returned from cache within TTL."""
        kc._jwks = sample_jwks
        kc._jwks_fetched_at = time.time()  # Just fetched

        result = await kc.get_jwks()

        assert result == sample_jwks
        kc._http_client.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_jwks_refetches_after_ttl(self, kc, sample_jwks):
        """JWKS refetched after TTL expires."""
        kc._jwks = {"keys": []}
        kc._jwks_fetched_at = time.time() - JWKS_CACHE_TTL - 1  # Expired

        resp_mock = MagicMock()
        resp_mock.json.return_value = sample_jwks
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.get = AsyncMock(return_value=resp_mock)

        result = await kc.get_jwks()

        assert result == sample_jwks
        kc._http_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_jwks_force_refresh_ignores_cache(self, kc, sample_jwks):
        """Force refresh bypasses cache."""
        kc._jwks = {"keys": []}
        kc._jwks_fetched_at = time.time()  # Still valid

        resp_mock = MagicMock()
        resp_mock.json.return_value = sample_jwks
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.get = AsyncMock(return_value=resp_mock)

        result = await kc.get_jwks(force_refresh=True)

        assert result == sample_jwks
        kc._http_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_jwks_returns_stale_on_http_failure(self, kc, sample_jwks):
        """Returns stale keys if HTTP fails but cache exists."""
        kc._jwks = sample_jwks
        kc._jwks_fetched_at = time.time() - JWKS_CACHE_TTL - 1  # Expired

        kc._http_client.get = AsyncMock(side_effect=httpx.HTTPError("timeout"))

        result = await kc.get_jwks()

        assert result == sample_jwks  # Stale but returned

    @pytest.mark.asyncio
    async def test_get_jwks_raises_503_when_no_cache_and_http_fails(self, kc):
        """503 raised when no cached keys and HTTP fails."""
        kc._jwks = None
        kc._http_client.get = AsyncMock(side_effect=httpx.HTTPError("timeout"))

        with pytest.raises(HTTPException) as exc_info:
            await kc.get_jwks()

        assert exc_info.value.status_code == 503
        assert "unavailable" in exc_info.value.detail.lower()


# ---------------------------------------------------------------------------
# Token Validation
# ---------------------------------------------------------------------------

class TestTokenValidation:

    @pytest.mark.asyncio
    async def test_validate_token_success(self, kc, sample_jwks, sample_jwt_payload):
        """Successful token validation returns extracted claims."""
        kc._jwks = sample_jwks
        kc._jwks_fetched_at = time.time()

        with patch.object(kc, "_decode_token", return_value=sample_jwt_payload):
            claims = await kc.validate_token("valid-token")

        assert claims["sub"] == "user-uuid-123"
        assert claims["email"] == "test@kijko.nl"
        assert claims["org_id"] == "org-uuid-456"
        assert "admin" in claims["roles"]
        assert "developer" in claims["roles"]

    @pytest.mark.asyncio
    async def test_validate_token_retries_with_fresh_jwks(self, kc, sample_jwks, sample_jwt_payload):
        """Token validation retries with refreshed JWKS on first failure."""
        kc._jwks = sample_jwks
        kc._jwks_fetched_at = time.time()

        call_count = 0

        def mock_decode(token, jwks):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise JWTError("Signature verification failed")
            return sample_jwt_payload

        with patch.object(kc, "_decode_token", side_effect=mock_decode):
            with patch.object(kc, "get_jwks", new_callable=AsyncMock, return_value=sample_jwks):
                claims = await kc.validate_token("token-with-rotated-key")

        assert claims["sub"] == "user-uuid-123"
        assert call_count == 2  # Tried twice

    @pytest.mark.asyncio
    async def test_validate_token_fails_after_retry(self, kc, sample_jwks):
        """Token validation raises 401 after both attempts fail."""
        kc._jwks = sample_jwks
        kc._jwks_fetched_at = time.time()

        with patch.object(kc, "_decode_token", side_effect=JWTError("Invalid")):
            with patch.object(kc, "get_jwks", new_callable=AsyncMock, return_value=sample_jwks):
                with pytest.raises(HTTPException) as exc_info:
                    await kc.validate_token("bad-token")

        assert exc_info.value.status_code == 401
        assert "WWW-Authenticate" in exc_info.value.headers


# ---------------------------------------------------------------------------
# Claims Extraction
# ---------------------------------------------------------------------------

class TestClaimsExtraction:

    def test_extract_claims_full_payload(self, kc, sample_jwt_payload):
        """Full payload extracts all fields correctly."""
        claims = kc._extract_claims(sample_jwt_payload)

        assert claims["sub"] == "user-uuid-123"
        assert claims["email"] == "test@kijko.nl"
        assert claims["email_verified"] is True
        assert claims["first_name"] == "Test"
        assert claims["last_name"] == "User"
        assert claims["org_id"] == "org-uuid-456"
        assert claims["preferred_username"] == "testuser"

    def test_extract_claims_filters_internal_roles(self, kc, sample_jwt_payload):
        """Internal Keycloak roles are filtered out."""
        claims = kc._extract_claims(sample_jwt_payload)

        assert "offline_access" not in claims["roles"]
        assert "uma_authorization" not in claims["roles"]
        assert "default-roles-kijko" not in claims["roles"]
        assert "admin" in claims["roles"]
        assert "developer" in claims["roles"]

    def test_extract_claims_merges_realm_and_client_roles(self, kc):
        """Roles from both realm_access and resource_access are merged."""
        payload = {
            "sub": "user-1",
            "realm_access": {"roles": ["role-a", "role-b"]},
            "resource_access": {
                "kijko-backend": {"roles": ["role-c", "role-b"]}  # role-b duplicate
            },
        }
        claims = kc._extract_claims(payload)

        # Deduplication + merge
        assert set(claims["roles"]) == {"role-a", "role-b", "role-c"}

    def test_extract_claims_missing_optional_fields(self, kc):
        """Missing optional fields default to empty strings/lists."""
        payload = {"sub": "user-1"}
        claims = kc._extract_claims(payload)

        assert claims["sub"] == "user-1"
        assert claims["email"] == ""
        assert claims["email_verified"] is False
        assert claims["first_name"] == ""
        assert claims["last_name"] == ""
        assert claims["org_id"] == ""
        assert claims["roles"] == []

    def test_extract_claims_alternative_org_id_field(self, kc):
        """Falls back to organization_id if org_id not present."""
        payload = {
            "sub": "user-1",
            "organization_id": "org-from-alt-field",
        }
        claims = kc._extract_claims(payload)
        assert claims["org_id"] == "org-from-alt-field"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class TestAuthentication:

    @pytest.mark.asyncio
    async def test_authenticate_success(self, kc):
        """Successful authentication returns token response."""
        token_response = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "token_type": "Bearer",
            "expires_in": 300,
        }

        resp_mock = MagicMock()
        resp_mock.status_code = 200
        resp_mock.json.return_value = token_response
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        result = await kc.authenticate("test@kijko.nl", "password123")

        assert result["access_token"] == "test-access-token"
        assert result["refresh_token"] == "test-refresh-token"
        assert result["token_type"] == "Bearer"
        assert result["expires_in"] == 300

    @pytest.mark.asyncio
    async def test_authenticate_invalid_credentials(self, kc):
        """Invalid credentials raise 401."""
        resp_mock = MagicMock()
        resp_mock.status_code = 401
        resp_mock.json.return_value = {"error_description": "Invalid user credentials"}
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        with pytest.raises(HTTPException) as exc_info:
            await kc.authenticate("test@kijko.nl", "wrong-password")

        assert exc_info.value.status_code == 401
        assert "Invalid user credentials" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_authenticate_bad_request(self, kc):
        """Keycloak 400 (e.g. disabled account) raises 401."""
        resp_mock = MagicMock()
        resp_mock.status_code = 400
        resp_mock.json.return_value = {"error_description": "Account disabled"}
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        with pytest.raises(HTTPException) as exc_info:
            await kc.authenticate("test@kijko.nl", "password")

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_authenticate_service_unavailable(self, kc):
        """HTTP error raises 503."""
        kc._http_client.post = AsyncMock(side_effect=httpx.HTTPError("Connection refused"))

        with pytest.raises(HTTPException) as exc_info:
            await kc.authenticate("test@kijko.nl", "password")

        assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------

class TestTokenRefresh:

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, kc):
        """Successful refresh returns new tokens."""
        token_response = {
            "access_token": "new-access",
            "refresh_token": "new-refresh",
            "token_type": "Bearer",
            "expires_in": 300,
        }

        resp_mock = MagicMock()
        resp_mock.status_code = 200
        resp_mock.json.return_value = token_response
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        result = await kc.refresh_token("old-refresh-token")

        assert result["access_token"] == "new-access"
        assert result["refresh_token"] == "new-refresh"

    @pytest.mark.asyncio
    async def test_refresh_token_expired(self, kc):
        """Expired refresh token raises 401."""
        resp_mock = MagicMock()
        resp_mock.status_code = 400
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        with pytest.raises(HTTPException) as exc_info:
            await kc.refresh_token("expired-refresh")

        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_refresh_token_service_unavailable(self, kc):
        """HTTP error raises 503."""
        kc._http_client.post = AsyncMock(side_effect=httpx.HTTPError("timeout"))

        with pytest.raises(HTTPException) as exc_info:
            await kc.refresh_token("some-refresh")

        assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# User Registration
# ---------------------------------------------------------------------------

class TestRegistration:

    @pytest.mark.asyncio
    async def test_register_user_success(self, kc):
        """Successful registration creates user and auto-logs in."""
        # Mock admin token
        admin_resp = MagicMock()
        admin_resp.status_code = 200
        admin_resp.json.return_value = {"access_token": "admin-token"}
        admin_resp.raise_for_status = MagicMock()

        # Mock user creation (201)
        create_resp = MagicMock()
        create_resp.status_code = 201

        # Mock auto-login
        login_resp = MagicMock()
        login_resp.status_code = 200
        login_resp.json.return_value = {
            "access_token": "user-access",
            "refresh_token": "user-refresh",
            "token_type": "Bearer",
            "expires_in": 300,
        }
        login_resp.raise_for_status = MagicMock()

        kc._http_client.post = AsyncMock(side_effect=[admin_resp, create_resp, login_resp])

        result = await kc.register_user("new@kijko.nl", "pass123", "New", "User")

        assert result["access_token"] == "user-access"
        assert kc._http_client.post.call_count == 3

    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(self, kc):
        """Duplicate email raises 409 Conflict."""
        admin_resp = MagicMock()
        admin_resp.status_code = 200
        admin_resp.json.return_value = {"access_token": "admin-token"}
        admin_resp.raise_for_status = MagicMock()

        create_resp = MagicMock()
        create_resp.status_code = 409

        kc._http_client.post = AsyncMock(side_effect=[admin_resp, create_resp])

        with pytest.raises(HTTPException) as exc_info:
            await kc.register_user("existing@kijko.nl", "pass", "Ex", "User")

        assert exc_info.value.status_code == 409

    @pytest.mark.asyncio
    async def test_register_user_server_error(self, kc):
        """Non-201/204 from Keycloak raises 500."""
        admin_resp = MagicMock()
        admin_resp.status_code = 200
        admin_resp.json.return_value = {"access_token": "admin-token"}
        admin_resp.raise_for_status = MagicMock()

        create_resp = MagicMock()
        create_resp.status_code = 500
        create_resp.text = "Internal Server Error"

        kc._http_client.post = AsyncMock(side_effect=[admin_resp, create_resp])

        with pytest.raises(HTTPException) as exc_info:
            await kc.register_user("new@kijko.nl", "pass", "New", "User")

        assert exc_info.value.status_code == 500


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class TestLogout:

    @pytest.mark.asyncio
    async def test_logout_success(self, kc):
        """Successful logout doesn't raise."""
        resp_mock = MagicMock()
        resp_mock.status_code = 204
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        # Should not raise
        await kc.logout("refresh-token")

    @pytest.mark.asyncio
    async def test_logout_best_effort_on_failure(self, kc):
        """Logout doesn't raise on HTTP failure (best-effort)."""
        kc._http_client.post = AsyncMock(side_effect=httpx.HTTPError("failed"))

        # Should not raise
        await kc.logout("refresh-token")

    @pytest.mark.asyncio
    async def test_logout_non_204_logs_warning(self, kc):
        """Non-204 status is logged but doesn't raise."""
        resp_mock = MagicMock()
        resp_mock.status_code = 400
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        # Should not raise
        await kc.logout("already-expired-token")


# ---------------------------------------------------------------------------
# OAuth Redirect
# ---------------------------------------------------------------------------

class TestOAuthRedirect:

    def test_get_oauth_redirect_url_google(self, kc):
        """Google OAuth redirect URL is correctly built."""
        url = kc.get_oauth_redirect_url(
            provider="google",
            redirect_uri="https://app.kijko.nl/callback",
        )

        assert "kc_idp_hint=google" in url
        assert "redirect_uri=https" in url
        assert "response_type=code" in url
        assert "scope=openid" in url
        assert f"client_id={kc.client_id}" in url

    def test_get_oauth_redirect_url_with_state(self, kc):
        """State parameter is included when provided."""
        url = kc.get_oauth_redirect_url(
            provider="github",
            redirect_uri="https://app.kijko.nl/callback",
            state="csrf-token-123",
        )

        assert "state=csrf-token-123" in url
        assert "kc_idp_hint=github" in url

    def test_get_oauth_redirect_url_without_state(self, kc):
        """No state parameter when not provided."""
        url = kc.get_oauth_redirect_url(
            provider="google",
            redirect_uri="https://app.kijko.nl/callback",
        )

        assert "state=" not in url


# ---------------------------------------------------------------------------
# Code Exchange
# ---------------------------------------------------------------------------

class TestCodeExchange:

    @pytest.mark.asyncio
    async def test_exchange_code_success(self, kc):
        """Successful code exchange returns tokens."""
        resp_mock = MagicMock()
        resp_mock.status_code = 200
        resp_mock.json.return_value = {
            "access_token": "oauth-access",
            "refresh_token": "oauth-refresh",
            "token_type": "Bearer",
            "expires_in": 300,
        }
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        result = await kc.exchange_code("auth-code-123", "https://app.kijko.nl/callback")

        assert result["access_token"] == "oauth-access"

    @pytest.mark.asyncio
    async def test_exchange_code_invalid_code(self, kc):
        """Invalid auth code raises 401."""
        resp_mock = MagicMock()
        resp_mock.status_code = 400
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        with pytest.raises(HTTPException) as exc_info:
            await kc.exchange_code("invalid-code", "https://app.kijko.nl/callback")

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_exchange_code_service_unavailable(self, kc):
        """HTTP error raises 503."""
        kc._http_client.post = AsyncMock(side_effect=httpx.HTTPError("timeout"))

        with pytest.raises(HTTPException) as exc_info:
            await kc.exchange_code("code", "https://app.kijko.nl/callback")

        assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# Admin Token
# ---------------------------------------------------------------------------

class TestAdminToken:

    @pytest.mark.asyncio
    async def test_get_admin_token_success(self, kc):
        """Admin token fetched via client credentials grant."""
        resp_mock = MagicMock()
        resp_mock.status_code = 200
        resp_mock.json.return_value = {"access_token": "admin-token-123"}
        resp_mock.raise_for_status = MagicMock()
        kc._http_client.post = AsyncMock(return_value=resp_mock)

        token = await kc._get_admin_token()

        assert token == "admin-token-123"

    @pytest.mark.asyncio
    async def test_get_admin_token_http_failure(self, kc):
        """HTTP failure raises 503."""
        kc._http_client.post = AsyncMock(side_effect=httpx.HTTPError("refused"))

        with pytest.raises(HTTPException) as exc_info:
            await kc._get_admin_token()

        assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

class TestSingleton:

    def test_get_keycloak_returns_same_instance(self):
        """get_keycloak returns singleton."""
        kc1 = get_keycloak()
        kc2 = get_keycloak()
        assert kc1 is kc2

    def test_keycloak_default_urls(self):
        """Default URLs constructed from settings."""
        kc = KeycloakService()
        assert "/realms/kijko" in kc.realm_url
        assert kc.token_endpoint.endswith("/protocol/openid-connect/token")
        assert kc.jwks_uri.endswith("/protocol/openid-connect/certs")


# ---------------------------------------------------------------------------
# HTTP Client Lifecycle
# ---------------------------------------------------------------------------

class TestHTTPClient:

    def test_http_client_lazy_init(self, kc):
        """HTTP client lazy-initializes when accessed."""
        kc._http_client = None
        client = kc.http_client
        assert client is not None

    @pytest.mark.asyncio
    async def test_close_client(self):
        """close() gracefully closes HTTP client."""
        service = KeycloakService()
        service._http_client = AsyncMock(spec=httpx.AsyncClient)
        service._http_client.is_closed = False

        await service.close()

        service._http_client.aclose.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_already_closed(self):
        """close() is safe when client already closed."""
        service = KeycloakService()
        service._http_client = AsyncMock(spec=httpx.AsyncClient)
        service._http_client.is_closed = True

        await service.close()

        service._http_client.aclose.assert_not_called()
