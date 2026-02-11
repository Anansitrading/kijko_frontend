"""Reflexes router — CRUD, toggle, test, webhook info, stats."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.base import MessageResponse, PaginatedResponse
from server.app.models.reflex import (
    ReflexCreate,
    ReflexResponse,
    ReflexStats,
    ReflexTestRequest,
    ReflexUpdate,
    ReflexWebhookInfo,
    ReflexWithSkill,
)
from server.app.services import reflexes as reflex_service

router = APIRouter(prefix="/reflexes", tags=["reflexes"])


@router.get("", response_model=PaginatedResponse)
async def list_reflexes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    skill_id: str | None = None,
    trigger_type: str | None = None,
    is_active: bool | None = None,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List reflexes for the current user."""
    return await reflex_service.list_reflexes(
        db, page=page, page_size=page_size,
        skill_id=skill_id, trigger_type=trigger_type, is_active=is_active,
    )


@router.post("", response_model=ReflexResponse, status_code=status.HTTP_201_CREATED)
async def create_reflex(
    body: ReflexCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Create a new reflex (event-triggered skill execution)."""
    return await reflex_service.create_reflex(db, data=body.model_dump(), user_id=user["sub"])


@router.get("/stats", response_model=ReflexStats)
async def get_reflex_stats(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get aggregated reflex statistics for the current user."""
    return await reflex_service.get_reflex_stats(db)


@router.get("/{reflex_id}", response_model=ReflexWithSkill)
async def get_reflex(
    reflex_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get a reflex with related skill info."""
    result = await reflex_service.get_reflex(db, reflex_id)
    if not result:
        raise HTTPException(status_code=404, detail="Reflex not found")
    return result


@router.patch("/{reflex_id}", response_model=ReflexResponse)
async def update_reflex(
    reflex_id: UUID,
    body: ReflexUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Update a reflex's trigger configuration or conditions."""
    result = await reflex_service.update_reflex(db, reflex_id, data=body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Reflex not found")
    return result


@router.delete("/{reflex_id}", response_model=MessageResponse)
async def delete_reflex(
    reflex_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Delete a reflex."""
    deleted = await reflex_service.delete_reflex(db, reflex_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reflex not found")
    return MessageResponse(message="Reflex deleted successfully")


@router.post("/{reflex_id}/toggle", response_model=ReflexResponse)
async def toggle_reflex(
    reflex_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Toggle a reflex's active/inactive state."""
    result = await reflex_service.toggle_reflex(db, reflex_id)
    if not result:
        raise HTTPException(status_code=404, detail="Reflex not found")
    return result


@router.post("/{reflex_id}/test")
async def test_reflex(
    reflex_id: UUID,
    body: ReflexTestRequest,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Test a reflex with mock event data (dry run)."""
    result = await reflex_service.test_reflex(db, reflex_id, event_data=body.event_data)
    return result


@router.get("/{reflex_id}/webhook", response_model=ReflexWebhookInfo)
async def get_webhook_info(
    reflex_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get webhook endpoint information for a webhook-type reflex."""
    result = await reflex_service.get_webhook_info(db, reflex_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Reflex not found or not a webhook trigger type",
        )
    return result
