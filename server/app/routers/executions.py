"""Executions router — List executions, analytics, stats by skill/period."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.base import PaginatedResponse
from server.app.models.execution import (
    ExecutionStats,
    ExecutionStatsByPeriod,
    ExecutionStatsBySkill,
    SkillExecutionResponse,
)
from server.app.services import executions as execution_service

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("", response_model=PaginatedResponse)
async def list_executions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    skill_id: str | None = None,
    status: str | None = None,
    execution_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List skill executions with optional filters."""
    return await execution_service.list_executions(
        db, page=page, page_size=page_size,
        skill_id=skill_id, status=status,
        execution_type=execution_type,
        date_from=date_from, date_to=date_to,
    )


@router.get("/stats", response_model=ExecutionStats)
async def get_execution_stats(
    days: int = Query(30, ge=1, le=365),
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get aggregated execution statistics for the last N days."""
    return await execution_service.get_execution_stats(db, days=days)


@router.get("/stats/by-skill", response_model=list[ExecutionStatsBySkill])
async def get_stats_by_skill(
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get execution statistics grouped by skill."""
    return await execution_service.get_stats_by_skill(db, limit=limit)


@router.get("/stats/by-period", response_model=list[ExecutionStatsByPeriod])
async def get_stats_by_period(
    days: int = Query(30, ge=1, le=365),
    granularity: str = Query("day", pattern="^(day|week|month)$"),
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get execution statistics grouped by time period."""
    return await execution_service.get_stats_by_period(
        db, days=days, granularity=granularity,
    )


@router.get("/{execution_id}", response_model=SkillExecutionResponse)
async def get_execution(
    execution_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get a single execution with details."""
    result = await execution_service.get_execution(db, execution_id)
    if not result:
        raise HTTPException(status_code=404, detail="Execution not found")
    return result
