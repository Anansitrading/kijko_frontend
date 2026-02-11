"""Authentication middleware for FastAPI.

Provides dependency functions for JWT validation and RLS context injection.

Usage in route handlers:
    @router.get("/protected")
    async def protected_endpoint(user: dict = Depends(require_auth)):
        # user contains: sub, email, org_id, roles, etc.
        # RLS context is already set on the Supabase client
        pass

    @router.get("/optional-auth")
    async def optional_endpoint(user: dict | None = Depends(get_optional_user)):
        # user is None if no token provided
        pass
"""

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.models.user import UserProfile
from server.app.services.database import set_rls_context
from server.app.services.keycloak import KeycloakService, get_keycloak

# HTTP Bearer security scheme — appears in Swagger docs
security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    keycloak: KeycloakService = Depends(get_keycloak),
) -> dict:
    """Validate JWT and return user claims.

    This is a "lightweight" auth check — validates the token but
    does NOT set RLS context. Use `require_auth` for data endpoints.

    Returns:
        Dict with user claims: sub, email, org_id, roles, etc.

    Raises:
        HTTPException(401) if token is missing, invalid, or expired
    """
    token = credentials.credentials
    return await keycloak.validate_token(token)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Security(optional_security),
    keycloak: KeycloakService = Depends(get_keycloak),
) -> dict | None:
    """Optionally validate JWT — returns None if no token provided.

    Useful for endpoints that behave differently for authenticated
    vs. anonymous users (e.g., public project views).
    """
    if credentials is None:
        return None

    try:
        return await keycloak.validate_token(credentials.credentials)
    except HTTPException:
        return None


async def require_auth(
    user: dict = Depends(get_current_user),
    db: SupabaseClient = Depends(get_supabase),
) -> dict:
    """Validate JWT AND set RLS context for database queries.

    This is the primary auth dependency for data endpoints. It:
    1. Validates the JWT (via get_current_user)
    2. Sets PostgreSQL session variables for RLS policies
    3. Returns the user claims dict

    After this dependency runs, all Supabase queries through the same
    client will be scoped by RLS policies.

    Returns:
        Dict with user claims

    Raises:
        HTTPException(401) if not authenticated
        HTTPException(403) if authenticated but missing org_id
    """
    # Ensure org_id is present in claims
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no organization assigned. Contact support.",
        )

    await set_rls_context(db, user["sub"], org_id)
    return user


async def require_role(required_roles: list[str]):
    """Create a dependency that requires specific roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["admin"]))])
        async def admin_endpoint():
            ...
    """
    async def _check_roles(user: dict = Depends(require_auth)) -> dict:
        user_roles = user.get("roles", [])
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {required_roles}",
            )
        return user
    return _check_roles


def get_user_profile(user: dict = Depends(require_auth)) -> UserProfile:
    """Convert JWT claims to a structured UserProfile model.

    Provides type-safe access to user data in route handlers.
    """
    from server.app.models.enums import PlanTier

    return UserProfile(
        id=user["sub"],
        email=user["email"],
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        org_id=user["org_id"],
        roles=user.get("roles", []),
        plan=PlanTier(user.get("plan", "free")),
    )
