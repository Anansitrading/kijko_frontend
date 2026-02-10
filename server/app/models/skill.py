"""Skill domain Pydantic models matching SQL schema and TypeScript interfaces."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from server.app.models.base import BaseSchema, TimestampMixin
from server.app.models.enums import SkillCategory, SkillOutputFormat


class SkillCreate(BaseSchema):
    """Request body for creating a skill."""

    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    category: SkillCategory = SkillCategory.CUSTOM
    prompt_template: str = Field(min_length=10)
    model: str = "claude-3-5-sonnet-20241022"
    parameters: dict[str, Any] = Field(
        default={"temperature": 1, "max_tokens": 4096}
    )
    input_schema: dict[str, Any] | None = None
    output_format: SkillOutputFormat = SkillOutputFormat.MARKDOWN


class SkillUpdate(BaseSchema):
    """Request body for updating a skill."""

    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    category: SkillCategory | None = None
    prompt_template: str | None = Field(None, min_length=10)
    model: str | None = None
    parameters: dict[str, Any] | None = None
    input_schema: dict[str, Any] | None = None
    output_format: SkillOutputFormat | None = None
    is_active: bool | None = None


class SkillResponse(BaseSchema, TimestampMixin):
    """Full skill entity returned in responses."""

    id: UUID
    user_id: UUID
    name: str
    description: str | None
    category: SkillCategory
    prompt_template: str
    model: str
    parameters: dict[str, Any]
    input_schema: dict[str, Any] | None
    output_format: SkillOutputFormat
    is_active: bool
    execution_count: int
    last_executed_at: datetime | None


class SkillWithRelations(SkillResponse):
    """Skill with related execution data."""

    recent_executions: list["SkillExecutionResponse"] = []
    habit_count: int = 0
    reflex_count: int = 0


class SkillTestRequest(BaseSchema):
    """Request body for testing a skill."""

    prompt_template: str = Field(min_length=10)
    model: str = "claude-3-5-sonnet-20241022"
    parameters: dict[str, Any] = Field(
        default={"temperature": 1, "max_tokens": 4096}
    )
    input_data: dict[str, Any] = {}


class SkillExecuteRequest(BaseSchema):
    """Request body for executing a skill."""

    input_data: dict[str, Any] = {}


class SkillBulkAction(BaseSchema):
    """Request body for bulk skill operations."""

    skill_ids: list[UUID]
    action: str = Field(pattern=r"^(activate|deactivate|delete)$")


class SkillExportResponse(BaseSchema):
    """Skill configuration for export."""

    name: str
    description: str | None
    category: SkillCategory
    prompt_template: str
    model: str
    parameters: dict[str, Any]
    input_schema: dict[str, Any] | None
    output_format: SkillOutputFormat


# Forward reference resolved at import time via __init__.py
# SkillWithRelations uses string annotation "SkillExecutionResponse"
# which is resolved when the models package is fully loaded
