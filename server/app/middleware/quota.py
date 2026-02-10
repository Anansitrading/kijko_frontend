"""Quota enforcement middleware — checks plan limits before allowing requests.

Applied as a FastAPI dependency to rate-limited endpoints:
  skill executions, ingestion triggers, storage uploads, oracle queries.

Returns 429 Too Many Requests when quota exceeded with:
  - X-RateLimit-Limit header
  - X-RateLimit-Remaining header
  - X-RateLimit-Reset header (billing period end timestamp)
  - JSON body with detail, limit, and used counts
"""

from datetime import datetime, timezone
from typing import Callable

from fastapi import Depends, HTTPException, Request, Response
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.enums import PlanTier
from server.app.services.usage import check_quota, increment_usage


def _get_period_end_timestamp() -> int:
    """Get the end of current billing period as Unix timestamp."""
    now = datetime.now(timezone.utc)
    if now.month == 12:
        period_end = now.replace(year=now.year + 1, month=1, day=1,
                                 hour=0, minute=0, second=0, microsecond=0)
    else:
        period_end = now.replace(month=now.month + 1, day=1,
                                 hour=0, minute=0, second=0, microsecond=0)
    return int(period_end.timestamp())


def require_quota(category: str) -> Callable:
    """FastAPI dependency that enforces quota for a usage category.

    Usage:
        @router.post("/execute", dependencies=[Depends(require_quota("api_calls"))])
        async def execute_skill(...):
            ...

    Or in the handler:
        async def execute_skill(
            _quota=Depends(require_quota("api_calls")),
            ...
        ):
    """

    async def _check_and_increment(
        request: Request,
        response: Response,
        user: dict = Depends(require_auth),
        db: SupabaseClient = Depends(get_supabase),
    ) -> None:
        org_id = user.get("org_id", "")

        # Get org's plan from DB
        result = (
            db.table("organizations")
            .select("plan")
            .eq("id", org_id)
            .single()
            .execute()
        )
        plan = (result.data or {}).get("plan", PlanTier.FREE)

        # Check quota
        within_limit, used, limit = await check_quota(org_id, category, plan)

        # Set rate limit headers on ALL responses
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - used - 1))
        response.headers["X-RateLimit-Reset"] = str(_get_period_end_timestamp())

        if not within_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Quota exceeded for {category}",
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(_get_period_end_timestamp()),
                    "Retry-After": str((_get_period_end_timestamp() - int(
                        datetime.now(timezone.utc).timestamp()
                    ))),
                },
            )

        # Increment usage counter
        await increment_usage(org_id, category)

    return _check_and_increment
