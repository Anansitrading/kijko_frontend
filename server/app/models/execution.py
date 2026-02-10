"""Execution domain Pydantic models matching SQL schema and TypeScript interfaces."""

from datetime import datetime
from typing import Any
from uuid import UUID

from server.app.models.base import BaseSchema
from server.app.models.enums import ExecutionStatus, ExecutionType


class SkillExecutionResponse(BaseSchema):
    """Full skill execution entity returned in responses."""

    id: UUID
    skill_id: UUID | None
    user_id: UUID
    execution_type: ExecutionType
    reference_id: UUID | None
    input: dict[str, Any] | None
    output: str | None
    tokens_used: int | None
    prompt_tokens: int | None
    completion_tokens: int | None
    duration_ms: int | None
    cost_cents: int | None
    status: ExecutionStatus
    error_message: str | None
    error_code: str | None
    executed_at: datetime
    completed_at: datetime | None


class ExecutionListFilter(BaseSchema):
    """Filters for listing executions."""

    skill_id: UUID | None = None
    status: ExecutionStatus | None = None
    execution_type: ExecutionType | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


class ExecutionStats(BaseSchema):
    """Aggregated execution statistics."""

    total_executions: int
    successful: int
    failed: int
    cancelled: int
    total_tokens: int
    total_cost_cents: int
    avg_duration_ms: float | None
    success_rate: float


class ExecutionStatsBySkill(BaseSchema):
    """Execution statistics grouped by skill."""

    skill_id: UUID
    skill_name: str
    total_executions: int
    successful: int
    failed: int
    avg_duration_ms: float | None
    total_tokens: int
    total_cost_cents: int


class ExecutionStatsByPeriod(BaseSchema):
    """Execution statistics grouped by time period."""

    period: str
    total_executions: int
    successful: int
    failed: int
    total_tokens: int
    total_cost_cents: int
