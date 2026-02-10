"""Base Pydantic models and shared utilities."""

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common config for all models."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class TimestampMixin(BaseModel):
    """Mixin for created_at/updated_at timestamps."""

    created_at: datetime
    updated_at: datetime


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    data: list[T]
    total: int
    page: int
    page_size: int
    has_more: bool


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
    detail: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
