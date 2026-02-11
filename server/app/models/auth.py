"""Authentication request/response Pydantic models."""

from pydantic import EmailStr, Field

from server.app.models.base import BaseSchema


class LoginRequest(BaseSchema):
    """Request body for email/password login."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignupRequest(BaseSchema):
    """Request body for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)


class TokenResponse(BaseSchema):
    """Token response after successful authentication."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshRequest(BaseSchema):
    """Request body for token refresh."""

    refresh_token: str


class OAuthCallbackRequest(BaseSchema):
    """Request body for OAuth callback code exchange."""

    code: str
    redirect_uri: str
    state: str | None = None


class OAuthRedirectResponse(BaseSchema):
    """Response with OAuth redirect URL."""

    redirect_url: str
    provider: str
