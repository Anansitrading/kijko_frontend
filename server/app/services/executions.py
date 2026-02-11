"""Executions service — Supabase queries for skill executions and analytics."""

from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

from server.app.services.database import build_filtered_query


async def list_executions(
    client: SupabaseClient,
    page: int = 1,
    page_size: int = 20,
    skill_id: str | None = None,
    status: str | None = None,
    execution_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict[str, Any]:
    """List skill executions with filters (RLS-scoped to current user)."""
    filters = {}
    if skill_id:
        filters["skill_id"] = skill_id
    if status:
        filters["status"] = status
    if execution_type:
        filters["execution_type"] = execution_type

    query = build_filtered_query(
        client, "skill_executions",
        select="*, skills(name, category)",
        filters=filters, page=page, page_size=page_size,
        order_by="executed_at",
    )

    # Date range filters
    if date_from:
        query = query.gte("executed_at", date_from)
    if date_to:
        query = query.lte("executed_at", date_to)

    result = query.execute()
    total = result.count or 0
    return {
        "data": result.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


async def get_execution(client: SupabaseClient, execution_id: str | UUID) -> dict | None:
    """Get a single execution with related skill info."""
    result = (
        client.table("skill_executions")
        .select("*, skills(name, category)")
        .eq("id", str(execution_id))
        .single()
        .execute()
    )
    return result.data


async def get_execution_stats(
    client: SupabaseClient,
    days: int = 30,
) -> dict[str, Any]:
    """Get aggregated execution statistics.

    Queries all executions and computes stats in Python.
    In production, this should be a materialized view or cached aggregation.
    """
    from datetime import datetime, timedelta, timezone

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = (
        client.table("skill_executions")
        .select("status, tokens_used, cost_cents, duration_ms", count="exact")
        .gte("executed_at", cutoff)
        .execute()
    )

    executions = result.data or []
    total = len(executions)
    successful = sum(1 for e in executions if e.get("status") == "completed")
    failed = sum(1 for e in executions if e.get("status") == "failed")
    cancelled = sum(1 for e in executions if e.get("status") == "cancelled")
    total_tokens = sum(e.get("tokens_used") or 0 for e in executions)
    total_cost = sum(e.get("cost_cents") or 0 for e in executions)
    durations = [e.get("duration_ms") for e in executions if e.get("duration_ms") is not None]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else None

    return {
        "total_executions": total,
        "successful": successful,
        "failed": failed,
        "cancelled": cancelled,
        "total_tokens": total_tokens,
        "total_cost_cents": total_cost,
        "avg_duration_ms": avg_duration,
        "success_rate": round(successful / max(total, 1), 3),
    }


async def get_stats_by_skill(
    client: SupabaseClient,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Get execution statistics grouped by skill.

    Returns top skills by execution count.
    """
    result = (
        client.table("skill_executions")
        .select("skill_id, status, tokens_used, cost_cents, duration_ms, skills(name)")
        .execute()
    )

    executions = result.data or []

    # Group by skill_id
    by_skill: dict[str, dict[str, Any]] = {}
    for e in executions:
        sid = e.get("skill_id")
        if not sid:
            continue
        if sid not in by_skill:
            skill_info = e.get("skills") or {}
            by_skill[sid] = {
                "skill_id": sid,
                "skill_name": skill_info.get("name", "Unknown"),
                "total_executions": 0,
                "successful": 0,
                "failed": 0,
                "avg_duration_ms": None,
                "total_tokens": 0,
                "total_cost_cents": 0,
                "_durations": [],
            }
        entry = by_skill[sid]
        entry["total_executions"] += 1
        if e.get("status") == "completed":
            entry["successful"] += 1
        elif e.get("status") == "failed":
            entry["failed"] += 1
        entry["total_tokens"] += e.get("tokens_used") or 0
        entry["total_cost_cents"] += e.get("cost_cents") or 0
        if e.get("duration_ms") is not None:
            entry["_durations"].append(e["duration_ms"])

    # Compute averages and sort
    stats = []
    for entry in by_skill.values():
        durations = entry.pop("_durations")
        entry["avg_duration_ms"] = round(sum(durations) / len(durations), 1) if durations else None
        stats.append(entry)

    stats.sort(key=lambda x: x["total_executions"], reverse=True)
    return stats[:limit]


async def get_stats_by_period(
    client: SupabaseClient,
    days: int = 30,
    granularity: str = "day",
) -> list[dict[str, Any]]:
    """Get execution statistics grouped by time period.

    Args:
        client: Supabase client
        days: Number of days to look back
        granularity: 'day', 'week', or 'month'
    """
    from datetime import datetime, timedelta, timezone

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = (
        client.table("skill_executions")
        .select("executed_at, status, tokens_used, cost_cents")
        .gte("executed_at", cutoff)
        .order("executed_at", desc=False)
        .execute()
    )

    executions = result.data or []

    # Group by period
    by_period: dict[str, dict[str, Any]] = {}
    for e in executions:
        executed_at = e.get("executed_at", "")
        if not executed_at:
            continue

        # Parse and truncate to period
        try:
            dt = datetime.fromisoformat(executed_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            continue

        if granularity == "week":
            # ISO week start (Monday)
            start = dt - timedelta(days=dt.weekday())
            period_key = start.strftime("%Y-W%W")
        elif granularity == "month":
            period_key = dt.strftime("%Y-%m")
        else:  # day
            period_key = dt.strftime("%Y-%m-%d")

        if period_key not in by_period:
            by_period[period_key] = {
                "period": period_key,
                "total_executions": 0,
                "successful": 0,
                "failed": 0,
                "total_tokens": 0,
                "total_cost_cents": 0,
            }

        entry = by_period[period_key]
        entry["total_executions"] += 1
        if e.get("status") == "completed":
            entry["successful"] += 1
        elif e.get("status") == "failed":
            entry["failed"] += 1
        entry["total_tokens"] += e.get("tokens_used") or 0
        entry["total_cost_cents"] += e.get("cost_cents") or 0

    return sorted(by_period.values(), key=lambda x: x["period"])
