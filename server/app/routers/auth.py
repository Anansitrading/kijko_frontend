"""Authentication router — signup, login, refresh, logout.

Uses Supabase Auth (GoTrue) for all user operations.
All endpoints are public (no auth required) except GET /me.
"""

from fastapi import APIRouter, Depends, Response, status

from server.app.middleware.auth import get_current_user
from server.app.models.auth import (
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
)
from server.app.models.user import UserProfile
from server.app.models.enums import PlanTier
from server.app.services.supabase_auth import SupabaseAuthService, get_supabase_auth

router = APIRouter(prefix="/auth", tags=["auth"])


# =========================================================================
# Registration & Login
# =========================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user in Supabase Auth and returns tokens (auto-login).",
)
async def signup(
    body: SignupRequest,
    auth: SupabaseAuthService = Depends(get_supabase_auth),
) -> TokenResponse:
    """Register a new user and return tokens."""
    result = await auth.signup(
        email=body.email,
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    return TokenResponse(**result)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
    description="Authenticate via Supabase Auth and return access + refresh tokens.",
)
async def login(
    body: LoginRequest,
    auth: SupabaseAuthService = Depends(get_supabase_auth),
) -> TokenResponse:
    """Authenticate user and return tokens."""
    result = await auth.login(
        email=body.email,
        password=body.password,
    )
    return TokenResponse(**result)


# =========================================================================
# Token Management
# =========================================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a refresh token for a new access token.",
)
async def refresh(
    body: RefreshRequest,
    auth: SupabaseAuthService = Depends(get_supabase_auth),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    result = await auth.refresh(body.refresh_token)
    return TokenResponse(**result)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (invalidate session)",
    description="Signs out the user from Supabase Auth.",
)
async def logout(
    body: RefreshRequest,
    auth: SupabaseAuthService = Depends(get_supabase_auth),
) -> Response:
    """Invalidate session."""
    await auth.logout(body.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =========================================================================
# User Profile
# =========================================================================

@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current user profile",
    description="Returns the authenticated user's profile from JWT claims.",
)
async def me(
    user: dict = Depends(get_current_user),
) -> UserProfile:
    """Return current user profile from JWT claims."""
    return UserProfile(
        id=user["sub"],
        email=user["email"],
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        org_id=user.get("org_id", "00000000-0000-0000-0000-000000000000"),
        roles=user.get("roles", []),
        plan=PlanTier(user.get("plan", "free")),
    )
