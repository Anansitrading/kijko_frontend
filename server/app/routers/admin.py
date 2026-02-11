"""Admin router — management and maintenance endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth, require_role
from server.app.services.log_retention import cleanup_expired_logs

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/cleanup-logs", dependencies=[Depends(require_role(["admin"]))])
async def run_log_cleanup(
    dry_run: bool = True,
    db: SupabaseClient = Depends(get_supabase),
):
    """Run log retention cleanup (admin only).

    Deletes records older than 30 days per table retention policy.
    Use dry_run=true (default) to preview what would be deleted.
    """
    return await cleanup_expired_logs(db, dry_run=dry_run)
