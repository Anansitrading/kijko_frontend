"""Habits router — CRUD, toggle, stats, cron validation."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.base import MessageResponse, PaginatedResponse
from server.app.models.habit import (
    CronValidationRequest,
    CronValidationResponse,
    HabitCreate,
    HabitResponse,
    HabitStats,
    HabitUpdate,
    HabitWithSkill,
)
from server.app.services import habits as habit_service

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=PaginatedResponse)
async def list_habits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    skill_id: str | None = None,
    is_active: bool | None = None,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List habits for the current user."""
    return await habit_service.list_habits(
        db, page=page, page_size=page_size,
        skill_id=skill_id, is_active=is_active,
    )


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    body: HabitCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Create a new habit (scheduled skill execution)."""
    return await habit_service.create_habit(db, data=body.model_dump(), user_id=user["sub"])


@router.get("/stats", response_model=HabitStats)
async def get_global_stats(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get global habit statistics for the current user."""
    result = await habit_service.list_habits(db, page=1, page_size=1000, is_active=None)
    habits = result.get("data", [])
    active = [h for h in habits if h.get("is_active")]
    failed = [h for h in habits if h.get("consecutive_failures", 0) > 0]
    total_runs = sum(h.get("run_count", 0) for h in habits)
    return {
        "total_habits": len(habits),
        "active_habits": len(active),
        "total_runs": total_runs,
        "failed_habits": len(failed),
        "success_rate": round(1 - (len(failed) / max(len(habits), 1)), 2),
    }


@router.post("/validate-cron", response_model=CronValidationResponse)
async def validate_cron(
    body: CronValidationRequest,
    user: dict = Depends(require_auth),
):
    """Validate a cron expression and return next scheduled runs."""
    result = habit_service.validate_cron(body.expression)
    return result


@router.get("/{habit_id}", response_model=HabitWithSkill)
async def get_habit(
    habit_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get a habit with related skill info."""
    result = await habit_service.get_habit(db, habit_id)
    if not result:
        raise HTTPException(status_code=404, detail="Habit not found")
    return result


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: UUID,
    body: HabitUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Update a habit's schedule or configuration."""
    result = await habit_service.update_habit(db, habit_id, data=body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Habit not found")
    return result


@router.delete("/{habit_id}", response_model=MessageResponse)
async def delete_habit(
    habit_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Delete a habit."""
    deleted = await habit_service.delete_habit(db, habit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Habit not found")
    return MessageResponse(message="Habit deleted successfully")


@router.post("/{habit_id}/toggle", response_model=HabitResponse)
async def toggle_habit(
    habit_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Toggle a habit's active/inactive state."""
    result = await habit_service.toggle_habit(db, habit_id)
    if not result:
        raise HTTPException(status_code=404, detail="Habit not found")
    return result


@router.get("/{habit_id}/stats")
async def get_habit_stats(
    habit_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get execution stats for a specific habit."""
    result = await habit_service.get_habit_stats(db, habit_id)
    if not result:
        raise HTTPException(status_code=404, detail="Habit not found")
    return result
