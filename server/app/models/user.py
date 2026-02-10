"""User domain Pydantic models."""

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from server.app.models.base import BaseSchema
from server.app.models.enums import PlanTier


class UserProfile(BaseSchema):
    """User profile from JWT claims."""

    id: UUID
    email: str
    first_name: str
    last_name: str
    org_id: UUID
    roles: list[str] = []
    plan: PlanTier = PlanTier.FREE


class UserSearchResult(BaseSchema):
    """User search result for member invitation."""

    id: UUID
    email: str
    name: str | None
    avatar_url: str | None
