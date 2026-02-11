"""Authentication router — signup, login, refresh, logout, OAuth.

All endpoints are public (no auth required) except GET /me.
"""

from fastapi import APIRouter, Depends, Response, status

from server.app.middleware.auth import get_current_user
from server.app.models.auth import (
    LoginRequest,
    OAuthCallbackRequest,
    OAuthRedirectResponse,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
)
from server.app.models.user import UserProfile
from server.app.models.enums import PlanTier
from server.app.services.keycloak import KeycloakService, get_keycloak

router = APIRouter(prefix="/auth", tags=["auth"])


# =========================================================================
# Registration & Login
# =========================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user in Keycloak and returns tokens (auto-login).",
)
async def signup(
    body: SignupRequest,
    keycloak: KeycloakService = Depends(get_keycloak),
) -> TokenResponse:
    """Register a new user and return tokens."""
    result = await keycloak.register_user(
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
    description="Authenticate via Keycloak and return access + refresh tokens.",
)
async def login(
    body: LoginRequest,
    keycloak: KeycloakService = Depends(get_keycloak),
) -> TokenResponse:
    """Authenticate user and return tokens."""
    result = await keycloak.authenticate(
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
    keycloak: KeycloakService = Depends(get_keycloak),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    result = await keycloak.refresh_token(body.refresh_token)
    return TokenResponse(**result)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (invalidate refresh token)",
    description="Revokes the refresh token in Keycloak.",
)
async def logout(
    body: RefreshRequest,
    keycloak: KeycloakService = Depends(get_keycloak),
) -> Response:
    """Invalidate refresh token."""
    await keycloak.logout(body.refresh_token)
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


# =========================================================================
# OAuth (Social Login via Keycloak IdP Brokering)
# =========================================================================

@router.get(
    "/oauth/{provider}",
    response_model=OAuthRedirectResponse,
    summary="Get OAuth redirect URL",
    description="Returns a Keycloak OAuth redirect URL for Google or GitHub login.",
)
async def oauth_redirect(
    provider: str,
    redirect_uri: str = "https://app.kijko.nl/auth/callback",
    state: str | None = None,
    keycloak: KeycloakService = Depends(get_keycloak),
) -> OAuthRedirectResponse:
    """Generate OAuth redirect URL for social login."""
    if provider not in ("google", "github"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}. Supported: google, github",
        )

    url = keycloak.get_oauth_redirect_url(
        provider=provider,
        redirect_uri=redirect_uri,
        state=state,
    )
    return OAuthRedirectResponse(redirect_url=url, provider=provider)


@router.post(
    "/oauth/callback",
    response_model=TokenResponse,
    summary="OAuth callback — exchange code for tokens",
    description="Exchanges an OAuth authorization code for access + refresh tokens.",
)
async def oauth_callback(
    body: OAuthCallbackRequest,
    keycloak: KeycloakService = Depends(get_keycloak),
) -> TokenResponse:
    """Exchange OAuth authorization code for tokens."""
    result = await keycloak.exchange_code(
        code=body.code,
        redirect_uri=body.redirect_uri,
    )
    return TokenResponse(**result)
