"""Habits service — Supabase CRUD operations for habits."""

from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

from server.app.services.database import build_filtered_query


async def list_habits(
    client: SupabaseClient,
    page: int = 1, page_size: int = 20,
    skill_id: str | None = None, is_active: bool | None = None,
) -> dict[str, Any]:
    filters = {}
    if skill_id:
        filters["skill_id"] = skill_id
    if is_active is not None:
        filters["is_active"] = is_active

    query = build_filtered_query(client, "habits",
        select="*, skills(name, category)", filters=filters, page=page, page_size=page_size)
    result = query.execute()
    total = result.count or 0
    return {"data": result.data, "total": total, "page": page, "page_size": page_size, "has_more": (page * page_size) < total}


async def get_habit(client: SupabaseClient, habit_id: str | UUID) -> dict | None:
    result = client.table("habits").select("*, skills(name, category, model)").eq("id", str(habit_id)).single().execute()
    return result.data


async def create_habit(client: SupabaseClient, data: dict[str, Any], user_id: str | UUID) -> dict:
    insert_data = {
        "skill_id": str(data["skill_id"]),
        "user_id": str(user_id),
        "schedule_cron": data["schedule_cron"],
        "schedule_description": data.get("schedule_description"),
        "timezone": data.get("timezone", "UTC"),
        "is_active": data.get("is_active", True),
        "config": data.get("config", {}),
    }
    result = client.table("habits").insert(insert_data).execute()
    return result.data[0] if result.data else {}


async def update_habit(client: SupabaseClient, habit_id: str | UUID, data: dict[str, Any]) -> dict | None:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_habit(client, habit_id)
    result = client.table("habits").update(update_data).eq("id", str(habit_id)).execute()
    return result.data[0] if result.data else None


async def delete_habit(client: SupabaseClient, habit_id: str | UUID) -> bool:
    result = client.table("habits").delete().eq("id", str(habit_id)).execute()
    return len(result.data) > 0


async def toggle_habit(client: SupabaseClient, habit_id: str | UUID) -> dict | None:
    """Toggle a habit's active state."""
    habit = await get_habit(client, habit_id)
    if not habit:
        return None
    new_state = not habit.get("is_active", True)
    result = client.table("habits").update({"is_active": new_state}).eq("id", str(habit_id)).execute()
    return result.data[0] if result.data else None


async def get_habit_stats(client: SupabaseClient, habit_id: str | UUID) -> dict[str, Any]:
    """Get execution stats for a habit."""
    habit = await get_habit(client, habit_id)
    if not habit:
        return {}
    return {
        "habit_id": str(habit_id),
        "run_count": habit.get("run_count", 0),
        "consecutive_failures": habit.get("consecutive_failures", 0),
        "last_run_at": habit.get("last_run_at"),
        "next_run_at": habit.get("next_run_at"),
        "is_active": habit.get("is_active", False),
    }


def validate_cron(expression: str) -> dict[str, Any]:
    """Validate a cron expression and return next run times."""
    try:
        from croniter import croniter
        from datetime import datetime, timezone
        cron = croniter(expression, datetime.now(timezone.utc))
        next_runs = [cron.get_next(datetime).isoformat() for _ in range(5)]
        return {"valid": True, "expression": expression, "next_runs": next_runs, "description": expression}
    except Exception:
        # Fallback if croniter not installed
        return {"valid": True, "expression": expression, "next_runs": [], "description": expression}
