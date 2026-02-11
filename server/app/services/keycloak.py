"""Keycloak OIDC service for authentication and user management.

Handles:
- OIDC discovery and JWKS key management
- JWT token validation (RS256)
- User registration, authentication, token refresh, logout
- OAuth redirect URL generation for Google/GitHub

Architecture:
  - Uses OIDC discovery endpoint for automatic configuration
  - JWKS keys cached with 1-hour TTL, auto-refresh on validation failure
  - All Keycloak API calls go through httpx async client
  - Token validation extracts user_id (sub), org_id, email, roles from claims
"""

import logging
import time
from typing import Any

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from server.app.config import settings

logger = logging.getLogger(__name__)

# JWKS cache TTL in seconds
JWKS_CACHE_TTL = 3600  # 1 hour


class KeycloakService:
    """Keycloak OIDC client for authentication operations."""

    def __init__(self) -> None:
        self._oidc_config: dict[str, Any] | None = None
        self._jwks: dict[str, Any] | None = None
        self._jwks_fetched_at: float = 0
        self._http_client: httpx.AsyncClient | None = None

        # Build Keycloak URLs
        self.base_url = settings.KEYCLOAK_URL.rstrip("/")
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET

        # Standard OIDC endpoints (will be populated from discovery)
        self.realm_url = f"{self.base_url}/realms/{self.realm}"
        self.token_endpoint = f"{self.realm_url}/protocol/openid-connect/token"
        self.logout_endpoint = f"{self.realm_url}/protocol/openid-connect/logout"
        self.auth_endpoint = f"{self.realm_url}/protocol/openid-connect/auth"
        self.userinfo_endpoint = f"{self.realm_url}/protocol/openid-connect/userinfo"
        self.jwks_uri = f"{self.realm_url}/protocol/openid-connect/certs"
        self.admin_url = f"{self.base_url}/admin/realms/{self.realm}"

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy-init HTTP client."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=10.0)
        return self._http_client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    # =========================================================================
    # OIDC Discovery & JWKS
    # =========================================================================

    async def discover_oidc(self) -> dict[str, Any]:
        """Fetch OIDC discovery document and populate endpoints.

        Fetches from: {base_url}/realms/{realm}/.well-known/openid-configuration
        Updates token_endpoint, jwks_uri, etc. from discovery document.
        """
        if self._oidc_config:
            return self._oidc_config

        discovery_url = f"{self.realm_url}/.well-known/openid-configuration"
        try:
            resp = await self.http_client.get(discovery_url)
            resp.raise_for_status()
            self._oidc_config = resp.json()

            # Update endpoints from discovery
            self.token_endpoint = self._oidc_config.get(
                "token_endpoint", self.token_endpoint
            )
            self.logout_endpoint = self._oidc_config.get(
                "end_session_endpoint", self.logout_endpoint
            )
            self.auth_endpoint = self._oidc_config.get(
                "authorization_endpoint", self.auth_endpoint
            )
            self.userinfo_endpoint = self._oidc_config.get(
                "userinfo_endpoint", self.userinfo_endpoint
            )
            self.jwks_uri = self._oidc_config.get(
                "jwks_uri", self.jwks_uri
            )

            logger.info("OIDC discovery complete: %s", discovery_url)
            return self._oidc_config

        except httpx.HTTPError as e:
            logger.warning(
                "OIDC discovery failed (using defaults): %s", str(e)
            )
            return {}

    async def get_jwks(self, force_refresh: bool = False) -> dict[str, Any]:
        """Fetch JWKS public keys for token validation.

        Keys are cached for JWKS_CACHE_TTL seconds.
        Force refresh on JWT validation failure (key rotation).
        """
        now = time.time()
        if (
            self._jwks
            and not force_refresh
            and (now - self._jwks_fetched_at) < JWKS_CACHE_TTL
        ):
            return self._jwks

        try:
            resp = await self.http_client.get(self.jwks_uri)
            resp.raise_for_status()
            self._jwks = resp.json()
            self._jwks_fetched_at = now
            logger.info("JWKS refreshed from %s", self.jwks_uri)
            return self._jwks
        except httpx.HTTPError as e:
            logger.error("Failed to fetch JWKS: %s", str(e))
            if self._jwks:
                return self._jwks  # Return stale keys rather than failing
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

    # =========================================================================
    # Token Validation
    # =========================================================================

    async def validate_token(self, token: str) -> dict[str, Any]:
        """Validate a JWT access token and return decoded claims.

        Validates:
        - Signature (RS256 using JWKS public keys)
        - Expiry (exp claim)
        - Issuer (iss must match Keycloak realm URL)
        - Audience (azp or aud must include client_id)

        Returns:
            Decoded claims dict with at minimum:
            - sub: user UUID
            - org_id: organization UUID
            - email: user email
            - roles: list of realm/client roles

        Raises:
            HTTPException(401) on any validation failure
        """
        jwks = await self.get_jwks()

        try:
            # Try to decode with current JWKS keys
            payload = self._decode_token(token, jwks)
        except JWTError:
            # Key might have rotated — refresh JWKS and retry once
            jwks = await self.get_jwks(force_refresh=True)
            try:
                payload = self._decode_token(token, jwks)
            except JWTError as e:
                logger.warning("JWT validation failed after JWKS refresh: %s", str(e))
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # Extract and normalize claims
        return self._extract_claims(payload)

    def _decode_token(self, token: str, jwks: dict[str, Any]) -> dict[str, Any]:
        """Decode and validate JWT using JWKS public keys."""
        return jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=self.client_id,
            issuer=self.realm_url,
            options={
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
                "verify_iat": True,
            },
        )

    def _extract_claims(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Extract standardized claims from decoded JWT payload.

        Keycloak puts claims in different places depending on configuration:
        - sub: always in top-level claims
        - org_id: custom claim mapper (could be in top-level or resource_access)
        - email: top-level
        - roles: realm_access.roles + resource_access.{client}.roles
        """
        # Extract roles from Keycloak's nested structure
        realm_roles = payload.get("realm_access", {}).get("roles", [])
        client_roles = (
            payload.get("resource_access", {})
            .get(self.client_id, {})
            .get("roles", [])
        )
        all_roles = list(set(realm_roles + client_roles))

        # Filter out Keycloak internal roles
        filtered_roles = [
            r for r in all_roles
            if r not in ("offline_access", "uma_authorization", "default-roles-kijko")
        ]

        return {
            "sub": payload.get("sub"),
            "email": payload.get("email", ""),
            "email_verified": payload.get("email_verified", False),
            "first_name": payload.get("given_name", ""),
            "last_name": payload.get("family_name", ""),
            "org_id": payload.get("org_id", payload.get("organization_id", "")),
            "roles": filtered_roles,
            "preferred_username": payload.get("preferred_username", ""),
        }

    # =========================================================================
    # User Operations
    # =========================================================================

    async def authenticate(
        self, email: str, password: str
    ) -> dict[str, Any]:
        """Authenticate user via Keycloak token endpoint (password grant).

        Returns:
            Token response with access_token, refresh_token, expires_in
        """
        data = {
            "grant_type": "password",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "username": email,
            "password": password,
            "scope": "openid email profile",
        }

        try:
            resp = await self.http_client.post(
                self.token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            logger.error("Keycloak token request failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        if resp.status_code == 401 or resp.status_code == 400:
            error_data = resp.json()
            error_desc = error_data.get("error_description", "Invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_desc,
            )

        resp.raise_for_status()
        token_data = resp.json()

        return {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token", ""),
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in", 300),
        }

    async def refresh_token(self, refresh_token: str) -> dict[str, Any]:
        """Refresh an access token using a refresh token.

        Returns:
            New token response with access_token, refresh_token, expires_in
        """
        data = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
        }

        try:
            resp = await self.http_client.post(
                self.token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            logger.error("Token refresh failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        if resp.status_code in (400, 401):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        resp.raise_for_status()
        token_data = resp.json()

        return {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token", ""),
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in", 300),
        }

    async def register_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> dict[str, Any]:
        """Register a new user in Keycloak via Admin API.

        Requires service account with user management permissions.

        Returns:
            Token response (auto-login after registration)
        """
        # First, get an admin token using client credentials
        admin_token = await self._get_admin_token()

        # Create user in Keycloak
        user_data = {
            "email": email,
            "username": email,
            "firstName": first_name,
            "lastName": last_name,
            "enabled": True,
            "emailVerified": True,  # Skip email verification for now
            "credentials": [
                {
                    "type": "password",
                    "value": password,
                    "temporary": False,
                }
            ],
        }

        try:
            resp = await self.http_client.post(
                f"{self.admin_url}/users",
                json=user_data,
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json",
                },
            )
        except httpx.HTTPError as e:
            logger.error("User registration failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        if resp.status_code == 409:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        if resp.status_code not in (201, 204):
            logger.error(
                "User registration failed: %d %s",
                resp.status_code,
                resp.text,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user",
            )

        # Auto-login after registration
        return await self.authenticate(email, password)

    async def logout(self, refresh_token: str) -> None:
        """Invalidate a refresh token (logout).

        Calls Keycloak's logout endpoint to revoke the session.
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
        }

        try:
            resp = await self.http_client.post(
                self.logout_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            # Keycloak returns 204 on success, but we don't error on non-204
            # because the refresh token might already be expired
            if resp.status_code not in (200, 204):
                logger.warning("Logout returned status %d", resp.status_code)
        except httpx.HTTPError as e:
            logger.warning("Logout request failed: %s", str(e))
            # Don't raise — logout should be best-effort

    # =========================================================================
    # OAuth
    # =========================================================================

    def get_oauth_redirect_url(
        self,
        provider: str,
        redirect_uri: str,
        state: str | None = None,
    ) -> str:
        """Build Keycloak OAuth redirect URL for social login.

        Uses Keycloak's identity provider (IdP) brokering.

        Args:
            provider: "google" or "github"
            redirect_uri: URL to redirect back to after auth
            state: Optional CSRF state parameter

        Returns:
            Full redirect URL to Keycloak authorization endpoint
        """
        import urllib.parse

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            "kc_idp_hint": provider,  # Keycloak IdP hint — skips login form
        }
        if state:
            params["state"] = state

        return f"{self.auth_endpoint}?{urllib.parse.urlencode(params)}"

    async def exchange_code(
        self,
        code: str,
        redirect_uri: str,
    ) -> dict[str, Any]:
        """Exchange an authorization code for tokens (OAuth callback).

        Args:
            code: Authorization code from OAuth callback
            redirect_uri: Must match the redirect_uri used in the auth request

        Returns:
            Token response with access_token, refresh_token, expires_in
        """
        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }

        try:
            resp = await self.http_client.post(
                self.token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            logger.error("Code exchange failed: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        if resp.status_code in (400, 401):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization code",
            )

        resp.raise_for_status()
        token_data = resp.json()

        return {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token", ""),
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in", 300),
        }

    # =========================================================================
    # Internal Helpers
    # =========================================================================

    async def _get_admin_token(self) -> str:
        """Get an admin access token using client credentials grant.

        The backend's Keycloak client must have service account enabled
        and appropriate roles for user management.
        """
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            resp = await self.http_client.post(
                self.token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            return resp.json()["access_token"]
        except (httpx.HTTPError, KeyError) as e:
            logger.error("Failed to get admin token: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )


# ---------------------------------------------------------------------------
# Singleton instance
# ---------------------------------------------------------------------------

_keycloak_service: KeycloakService | None = None


def get_keycloak() -> KeycloakService:
    """FastAPI dependency — returns singleton KeycloakService."""
    global _keycloak_service
    if _keycloak_service is None:
        _keycloak_service = KeycloakService()
    return _keycloak_service
