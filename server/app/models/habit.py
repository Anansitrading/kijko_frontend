"""Habit domain Pydantic models matching SQL schema and TypeScript interfaces."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from server.app.models.base import BaseSchema, TimestampMixin


class HabitCreate(BaseSchema):
    """Request body for creating a habit."""

    skill_id: UUID
    schedule_cron: str = Field(min_length=9)
    schedule_description: str | None = Field(None, max_length=255)
    timezone: str = "UTC"
    config: dict[str, Any] = {}


class HabitUpdate(BaseSchema):
    """Request body for updating a habit."""

    schedule_cron: str | None = Field(None, min_length=9)
    schedule_description: str | None = Field(None, max_length=255)
    timezone: str | None = None
    config: dict[str, Any] | None = None
    is_active: bool | None = None


class HabitResponse(BaseSchema, TimestampMixin):
    """Full habit entity returned in responses."""

    id: UUID
    skill_id: UUID
    user_id: UUID
    schedule_cron: str
    schedule_description: str | None
    timezone: str
    last_run_at: datetime | None
    next_run_at: datetime | None
    run_count: int
    is_active: bool
    config: dict[str, Any]
    consecutive_failures: int
    last_error_message: str | None


class HabitWithSkill(HabitResponse):
    """Habit with related skill details."""

    skill_name: str | None = None
    skill_category: str | None = None
    skill_is_active: bool | None = None


class HabitStats(BaseSchema):
    """Habit execution statistics."""

    total_habits: int
    active_habits: int
    total_runs: int
    failed_habits: int
    success_rate: float


class CronValidationRequest(BaseSchema):
    """Request body for cron expression validation."""

    expression: str


class CronValidationResponse(BaseSchema):
    """Response for cron expression validation."""

    valid: bool
    expression: str
    description: str | None = None
    next_runs: list[datetime] = []
    message: str | None = None
