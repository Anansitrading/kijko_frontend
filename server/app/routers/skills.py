"""Skills router — CRUD, execute, test, bulk, export/import."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.base import MessageResponse, PaginatedResponse
from server.app.models.skill import (
    SkillBulkAction,
    SkillCreate,
    SkillExecuteRequest,
    SkillExportResponse,
    SkillResponse,
    SkillTestRequest,
    SkillUpdate,
    SkillWithRelations,
)
from server.app.services import skills as skill_service

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=PaginatedResponse)
async def list_skills(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    return await skill_service.list_skills(
        db, page=page, page_size=page_size,
        category=category, is_active=is_active, search=search,
    )


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    body: SkillCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    return await skill_service.create_skill(db, data=body.model_dump(), user_id=user["sub"])


@router.get("/{skill_id}", response_model=SkillWithRelations)
async def get_skill(
    skill_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    result = await skill_service.get_skill_with_relations(db, skill_id)
    if not result:
        raise HTTPException(status_code=404, detail="Skill not found")
    return result


@router.patch("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: UUID,
    body: SkillUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    result = await skill_service.update_skill(db, skill_id, data=body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Skill not found")
    return result


@router.delete("/{skill_id}", response_model=MessageResponse)
async def delete_skill(
    skill_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    deleted = await skill_service.delete_skill(db, skill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill not found")
    return MessageResponse(message="Skill deleted successfully")


@router.post("/{skill_id}/execute")
async def execute_skill(
    skill_id: UUID,
    body: SkillExecuteRequest,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Execute a skill (queues to Celery for async processing)."""
    skill = await skill_service.get_skill(db, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    # In production: queue to Celery. For now, return acknowledgment.
    return {
        "status": "queued",
        "skill_id": str(skill_id),
        "message": "Skill execution queued",
    }


@router.post("/test")
async def test_skill(
    body: SkillTestRequest,
    user: dict = Depends(require_auth),
):
    """Test a skill without saving (dry run)."""
    # In production: call LLM directly. For now, return test response.
    return {
        "status": "completed",
        "output": f"Test output for prompt: {body.prompt_template[:50]}...",
        "tokens_used": 150,
        "duration_ms": 1200,
    }


@router.post("/bulk")
async def bulk_action(
    body: SkillBulkAction,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    return await skill_service.bulk_action(
        db, skill_ids=[str(s) for s in body.skill_ids], action=body.action,
    )


@router.get("/{skill_id}/export", response_model=SkillExportResponse)
async def export_skill(
    skill_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    result = await skill_service.export_skill(db, skill_id)
    if not result:
        raise HTTPException(status_code=404, detail="Skill not found")
    return result


@router.post("/import", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def import_skill(
    body: SkillExportResponse,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Import a skill from an exported configuration."""
    return await skill_service.create_skill(db, data=body.model_dump(), user_id=user["sub"])
