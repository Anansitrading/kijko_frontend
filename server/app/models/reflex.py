"""Reflex domain Pydantic models matching SQL schema and TypeScript interfaces."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from server.app.models.base import BaseSchema, TimestampMixin
from server.app.models.enums import ReflexTriggerType


class ReflexCreate(BaseSchema):
    """Request body for creating a reflex."""

    skill_id: UUID
    trigger_type: ReflexTriggerType
    trigger_config: dict[str, Any]
    conditions: dict[str, Any] | None = None


class ReflexUpdate(BaseSchema):
    """Request body for updating a reflex."""

    trigger_type: ReflexTriggerType | None = None
    trigger_config: dict[str, Any] | None = None
    conditions: dict[str, Any] | None = None
    is_active: bool | None = None


class ReflexResponse(BaseSchema, TimestampMixin):
    """Full reflex entity returned in responses."""

    id: UUID
    skill_id: UUID
    user_id: UUID
    trigger_type: ReflexTriggerType
    trigger_config: dict[str, Any]
    conditions: dict[str, Any] | None
    is_active: bool
    trigger_count: int
    last_triggered_at: datetime | None
    consecutive_failures: int
    last_error_message: str | None


class ReflexWithSkill(ReflexResponse):
    """Reflex with related skill details."""

    skill_name: str | None = None
    skill_category: str | None = None
    skill_is_active: bool | None = None


class ReflexTestRequest(BaseSchema):
    """Request body for testing a reflex with mock event."""

    event_data: dict[str, Any]


class ReflexWebhookInfo(BaseSchema):
    """Webhook endpoint information for a reflex."""

    reflex_id: UUID
    webhook_url: str
    webhook_secret: str
    trigger_type: ReflexTriggerType


class ReflexStats(BaseSchema):
    """Reflex execution statistics."""

    total_reflexes: int
    active_reflexes: int
    total_triggers: int
    failed_reflexes: int
    success_rate: float
