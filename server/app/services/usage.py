"""Usage metering service — Track and enforce plan tier quotas.

Usage is tracked in Redis (fast, per-period) with fallback to Supabase.
Each metric is keyed by: usage:{org_id}:{category}:{period}
"""

import logging
from datetime import datetime, timezone
from typing import Any

from server.app.models.enums import PlanTier
from supabase import Client as SupabaseClient

logger = logging.getLogger(__name__)


# =============================================================================
# Plan Limits Configuration
# =============================================================================

PLAN_LIMITS: dict[str, dict[str, int]] = {
    PlanTier.FREE: {
        "api_calls": 100,
        "ingestions": 2,
        "storage_gb": 1,
        "seats": 1,
        "oracle_queries": 10,
    },
    PlanTier.PRO: {
        "api_calls": 1000,
        "ingestions": 10,
        "storage_gb": 10,
        "seats": 3,
        "oracle_queries": 100,
    },
    PlanTier.TEAMS: {
        "api_calls": 10000,
        "ingestions": 50,
        "storage_gb": 100,
        "seats": 10,
        "oracle_queries": 1000,
    },
    PlanTier.ENTERPRISE: {
        "api_calls": 100000,
        "ingestions": 500,
        "storage_gb": 1000,
        "seats": 100,
        "oracle_queries": 10000,
    },
}


def _get_billing_period() -> str:
    """Get current billing period key (YYYY-MM)."""
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _get_limits_for_plan(plan: str) -> dict[str, int]:
    """Get limits for a plan tier, defaulting to free."""
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[PlanTier.FREE])


# =============================================================================
# Redis-backed Usage Tracking
# =============================================================================

async def increment_usage(
    org_id: str,
    category: str,
    amount: int = 1,
    redis_client=None,
) -> int:
    """Increment usage counter for an org/category.

    Returns the new total for the current billing period.
    """
    if redis_client is None:
        from server.app.dependencies import get_redis
        redis_client = await get_redis()

    period = _get_billing_period()
    key = f"usage:{org_id}:{category}:{period}"

    new_total = await redis_client.incrby(key, amount)

    # Set TTL on first increment (45 days — covers billing period + buffer)
    if new_total == amount:
        await redis_client.expire(key, 45 * 86400)

    return new_total


async def get_usage(
    org_id: str,
    category: str,
    redis_client=None,
) -> int:
    """Get current usage for an org/category in the current billing period."""
    if redis_client is None:
        from server.app.dependencies import get_redis
        redis_client = await get_redis()

    period = _get_billing_period()
    key = f"usage:{org_id}:{category}:{period}"

    value = await redis_client.get(key)
    return int(value) if value else 0


async def check_quota(
    org_id: str,
    category: str,
    plan: str = PlanTier.FREE,
    redis_client=None,
) -> tuple[bool, int, int]:
    """Check if an org is within quota for a category.

    Returns: (within_limit, used, limit)
    """
    limits = _get_limits_for_plan(plan)
    limit = limits.get(category, 0)

    if limit <= 0:
        return False, 0, 0

    used = await get_usage(org_id, category, redis_client)
    return used < limit, used, limit


async def get_all_usage(
    org_id: str,
    plan: str = PlanTier.FREE,
    redis_client=None,
) -> list[dict[str, Any]]:
    """Get all usage metrics for an organization.

    Returns a list of UsageMetric-compatible dicts.
    """
    limits = _get_limits_for_plan(plan)
    metrics = []

    category_units = {
        "api_calls": "calls",
        "ingestions": "ingestions",
        "storage_gb": "GB",
        "seats": "seats",
        "oracle_queries": "queries",
    }

    for category, limit in limits.items():
        used = await get_usage(org_id, category, redis_client)
        percentage = round((used / max(limit, 1)) * 100, 1)
        metrics.append({
            "category": category,
            "used": used,
            "limit": limit,
            "percentage": min(percentage, 100.0),
            "unit": category_units.get(category, "units"),
        })

    return metrics


async def get_usage_overview(
    client: SupabaseClient,
    org_id: str,
) -> dict[str, Any]:
    """Get complete usage overview for the billing page.

    Fetches plan from DB, then computes usage from Redis.
    """
    # Get org plan from DB
    result = (
        client.table("organizations")
        .select("plan")
        .eq("id", org_id)
        .single()
        .execute()
    )
    plan = (result.data or {}).get("plan", PlanTier.FREE)

    # Get all usage metrics
    metrics = await get_all_usage(org_id, plan)

    # Billing period dates
    now = datetime.now(timezone.utc)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        period_end = period_start.replace(year=now.year + 1, month=1)
    else:
        period_end = period_start.replace(month=now.month + 1)

    return {
        "plan": plan,
        "metrics": metrics,
        "billing_period_start": period_start.isoformat(),
        "billing_period_end": period_end.isoformat(),
    }


async def reset_usage(
    org_id: str,
    redis_client=None,
) -> None:
    """Reset all usage counters for an organization.

    Called at billing period start or subscription change.
    """
    if redis_client is None:
        from server.app.dependencies import get_redis
        redis_client = await get_redis()

    period = _get_billing_period()
    categories = list(PLAN_LIMITS[PlanTier.FREE].keys())

    for category in categories:
        key = f"usage:{org_id}:{category}:{period}"
        await redis_client.delete(key)

    logger.info("Reset usage counters for org %s", org_id)
