"""GDPR router — Data subject request endpoints (export, delete, categories)."""

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.services import gdpr as gdpr_service

router = APIRouter(prefix="/gdpr", tags=["gdpr"])


@router.get("/categories")
async def get_data_categories(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List stored data categories for the current user.

    Returns what types of data are stored and how many records exist.
    """
    return await gdpr_service.get_data_categories(db, user["sub"])


@router.post("/export")
async def export_data(
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Export all user data as a JSON archive.

    GDPR Article 20 — Right to data portability.
    Returns a structured JSON document containing all user data.
    """
    return await gdpr_service.export_user_data(db, user["sub"])


@router.post("/delete")
async def delete_data(
    body: dict,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Request deletion of all user data.

    GDPR Article 17 — Right to erasure.

    Requires confirmation: {"confirm": "DELETE_ALL_MY_DATA"}
    This is irreversible. Auth account deletion is handled separately by Keycloak.
    """
    confirmation = body.get("confirm", "")
    if confirmation != "DELETE_ALL_MY_DATA":
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Send {\"confirm\": \"DELETE_ALL_MY_DATA\"}",
        )

    result = await gdpr_service.delete_user_data(db, user["sub"])
    return result
