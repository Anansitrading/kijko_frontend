"""Supabase Auth service — signup, login, token validation, logout.

Replaces KeycloakService for authentication. Uses Supabase GoTrue
for user management and HS256 JWT validation with the shared secret.
"""

import logging
from typing import Any

import jwt
from fastapi import HTTPException, status
from supabase import Client as SupabaseClient

from server.app.config import settings

logger = logging.getLogger(__name__)


class SupabaseAuthService:
    """Authentication service backed by Supabase Auth (GoTrue)."""

    def __init__(self, client: SupabaseClient) -> None:
        self._client = client
        self._jwt_secret = settings.SUPABASE_JWT_SECRET
        # Separate admin client — sign_up/sign_in mutate client auth state
        from supabase import create_client
        self._admin_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
        )

    # =========================================================================
    # Token Validation
    # =========================================================================

    def validate_token(self, token: str) -> dict[str, Any]:
        """Validate a Supabase JWT and return normalised claims.

        Supabase JWTs are HS256 signed with the shared JWT secret.

        Returns:
            Dict with: sub, email, org_id, roles, first_name, last_name

        Raises:
            HTTPException(401) on invalid/expired token
        """
        try:
            payload = jwt.decode(
                token,
                self._jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={
                    "verify_exp": True,
                    "verify_aud": True,
                },
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            logger.warning("JWT validation failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return self._extract_claims(payload)

    def _extract_claims(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Extract normalised claims from Supabase JWT payload.

        Supabase puts user metadata under:
        - user_metadata: data set by the user during signup
        - app_metadata: data set by the service role (roles, org_id, etc.)
        """
        user_meta = payload.get("user_metadata", {})
        app_meta = payload.get("app_metadata", {})

        # org_id: check app_metadata first, fall back to user_metadata
        org_id = (
            app_meta.get("org_id")
            or user_meta.get("org_id")
            or payload.get("org_id", "")
        )

        # roles: Supabase stores the base role in "role" claim
        roles = app_meta.get("roles", [])
        base_role = payload.get("role", "")
        if base_role and base_role not in roles:
            roles.append(base_role)

        return {
            "sub": payload.get("sub", ""),
            "email": payload.get("email", ""),
            "email_verified": payload.get("email_confirmed_at") is not None,
            "first_name": user_meta.get("first_name", ""),
            "last_name": user_meta.get("last_name", ""),
            "org_id": org_id,
            "roles": roles,
        }

    # =========================================================================
    # User Operations
    # =========================================================================

    async def signup(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> dict[str, Any]:
        """Register a new user via Supabase Auth.

        Creates user with metadata, auto-assigns an organization, and
        returns access + refresh tokens (auto-login).
        """
        try:
            # Use a fresh client — sign_up mutates the client's auth state
            from supabase import create_client
            signup_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            result = signup_client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "first_name": first_name,
                        "last_name": last_name,
                    },
                },
            })
        except Exception as e:
            error_msg = str(e)
            if "already registered" in error_msg.lower() or "already been registered" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email already exists",
                )
            logger.error("Supabase signup failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user",
            )

        if not result.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup succeeded but no session returned (email confirmation may be required)",
            )

        # Auto-assign org_id to the new user (use their user_id as default org)
        user_id = result.user.id
        try:
            self._admin_client.auth.admin.update_user_by_id(
                str(user_id),
                {"app_metadata": {"org_id": str(user_id), "roles": ["member"]}},
            )
        except Exception as e:
            logger.warning("Failed to set org_id on new user: %s", e)

        # Re-login with a throwaway client to get JWT with updated app_metadata
        try:
            from supabase import create_client
            tmp_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            login_result = tmp_client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            if login_result.session:
                return {
                    "access_token": login_result.session.access_token,
                    "refresh_token": login_result.session.refresh_token,
                    "token_type": "Bearer",
                    "expires_in": login_result.session.expires_in or 3600,
                }
        except Exception as e:
            logger.warning("Post-signup re-login failed, using initial token: %s", e)

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "token_type": "Bearer",
            "expires_in": result.session.expires_in or 3600,
        }

    async def login(self, email: str, password: str) -> dict[str, Any]:
        """Authenticate with email/password.

        Returns:
            Token response with access_token, refresh_token, expires_in
        """
        try:
            # Use a fresh client — sign_in mutates the client's auth state
            from supabase import create_client
            login_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            result = login_client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
        except Exception as e:
            error_msg = str(e)
            if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )
            logger.error("Supabase login failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        if not result.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "token_type": "Bearer",
            "expires_in": result.session.expires_in or 3600,
        }

    async def refresh(self, refresh_token: str) -> dict[str, Any]:
        """Refresh an access token using a refresh token."""
        try:
            from supabase import create_client
            tmp_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            result = tmp_client.auth.refresh_session(refresh_token)
        except Exception as e:
            logger.warning("Token refresh failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        if not result.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "token_type": "Bearer",
            "expires_in": result.session.expires_in or 3600,
        }

    async def logout(self, access_token: str) -> None:
        """Sign out (invalidate session server-side)."""
        try:
            self._admin_client.auth.admin.sign_out(access_token)
        except Exception as e:
            logger.warning("Logout failed: %s (best-effort)", e)

    async def get_user(self, access_token: str) -> dict[str, Any] | None:
        """Get the user profile for a given access token."""
        try:
            result = self._admin_client.auth.get_user(access_token)
            if not result or not result.user:
                return None

            user = result.user
            user_meta = user.user_metadata or {}
            app_meta = user.app_metadata or {}

            return {
                "id": str(user.id),
                "email": user.email or "",
                "first_name": user_meta.get("first_name", ""),
                "last_name": user_meta.get("last_name", ""),
                "org_id": app_meta.get("org_id", str(user.id)),
                "roles": app_meta.get("roles", []),
                "created_at": str(user.created_at) if user.created_at else None,
            }
        except Exception as e:
            logger.warning("get_user failed: %s", e)
            return None


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_auth_service: SupabaseAuthService | None = None


def get_supabase_auth() -> SupabaseAuthService:
    """FastAPI dependency — returns singleton SupabaseAuthService."""
    global _auth_service
    if _auth_service is None:
        from server.app.dependencies import get_supabase
        _auth_service = SupabaseAuthService(get_supabase())
    return _auth_service
