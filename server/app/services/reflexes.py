"""Reflexes service — Supabase CRUD operations for reflexes."""

import secrets
from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

from server.app.services.database import build_filtered_query


async def list_reflexes(
    client: SupabaseClient,
    page: int = 1,
    page_size: int = 20,
    skill_id: str | None = None,
    trigger_type: str | None = None,
    is_active: bool | None = None,
) -> dict[str, Any]:
    """List reflexes (RLS-scoped to current user)."""
    filters = {}
    if skill_id:
        filters["skill_id"] = skill_id
    if trigger_type:
        filters["trigger_type"] = trigger_type
    if is_active is not None:
        filters["is_active"] = is_active

    query = build_filtered_query(
        client, "reflexes",
        select="*, skills(name, category, is_active)",
        filters=filters, page=page, page_size=page_size,
    )
    result = query.execute()
    total = result.count or 0
    return {
        "data": result.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


async def get_reflex(client: SupabaseClient, reflex_id: str | UUID) -> dict | None:
    """Get a single reflex with related skill info."""
    result = (
        client.table("reflexes")
        .select("*, skills(name, category, is_active)")
        .eq("id", str(reflex_id))
        .single()
        .execute()
    )
    return result.data


async def create_reflex(
    client: SupabaseClient,
    data: dict[str, Any],
    user_id: str | UUID,
) -> dict:
    """Create a new reflex (event-triggered skill execution)."""
    insert_data = {
        "skill_id": str(data["skill_id"]),
        "user_id": str(user_id),
        "trigger_type": data["trigger_type"],
        "trigger_config": data.get("trigger_config", {}),
        "conditions": data.get("conditions"),
        "is_active": data.get("is_active", True),
    }
    result = client.table("reflexes").insert(insert_data).execute()
    return result.data[0] if result.data else {}


async def update_reflex(
    client: SupabaseClient,
    reflex_id: str | UUID,
    data: dict[str, Any],
) -> dict | None:
    """Update a reflex."""
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_reflex(client, reflex_id)
    result = (
        client.table("reflexes")
        .update(update_data)
        .eq("id", str(reflex_id))
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_reflex(client: SupabaseClient, reflex_id: str | UUID) -> bool:
    """Delete a reflex."""
    result = client.table("reflexes").delete().eq("id", str(reflex_id)).execute()
    return len(result.data) > 0


async def toggle_reflex(client: SupabaseClient, reflex_id: str | UUID) -> dict | None:
    """Toggle a reflex's active state."""
    reflex = await get_reflex(client, reflex_id)
    if not reflex:
        return None
    new_state = not reflex.get("is_active", True)
    result = (
        client.table("reflexes")
        .update({"is_active": new_state})
        .eq("id", str(reflex_id))
        .execute()
    )
    return result.data[0] if result.data else None


async def test_reflex(
    client: SupabaseClient,
    reflex_id: str | UUID,
    event_data: dict[str, Any],
) -> dict[str, Any]:
    """Test a reflex with mock event data (dry run).

    Evaluates conditions against the event without actually triggering the skill.
    """
    reflex = await get_reflex(client, reflex_id)
    if not reflex:
        return {"matched": False, "error": "Reflex not found"}

    conditions = reflex.get("conditions") or {}
    # Simple condition evaluation: check if all required keys are present
    matched = all(
        key in event_data and event_data[key] == value
        for key, value in conditions.items()
    ) if conditions else True

    return {
        "matched": matched,
        "reflex_id": str(reflex_id),
        "trigger_type": reflex.get("trigger_type"),
        "would_execute_skill": reflex.get("skill_id"),
        "event_data": event_data,
        "conditions_evaluated": conditions,
    }


async def get_webhook_info(
    client: SupabaseClient,
    reflex_id: str | UUID,
) -> dict | None:
    """Get webhook endpoint information for a webhook-type reflex."""
    reflex = await get_reflex(client, reflex_id)
    if not reflex:
        return None
    if reflex.get("trigger_type") != "webhook":
        return None

    webhook_secret = reflex.get("trigger_config", {}).get("secret")
    if not webhook_secret:
        # Generate and store a webhook secret
        webhook_secret = secrets.token_urlsafe(32)
        await update_reflex(client, reflex_id, {
            "trigger_config": {**reflex.get("trigger_config", {}), "secret": webhook_secret},
        })

    return {
        "reflex_id": str(reflex_id),
        "webhook_url": f"/api/v1/webhooks/reflexes/{reflex_id}",
        "webhook_secret": webhook_secret,
        "trigger_type": "webhook",
    }


async def get_reflex_stats(client: SupabaseClient) -> dict[str, Any]:
    """Get aggregated reflex statistics for the current user."""
    result = client.table("reflexes").select("*", count="exact").execute()
    reflexes = result.data or []
    active = [r for r in reflexes if r.get("is_active")]
    failed = [r for r in reflexes if r.get("consecutive_failures", 0) > 0]
    total_triggers = sum(r.get("trigger_count", 0) for r in reflexes)

    return {
        "total_reflexes": len(reflexes),
        "active_reflexes": len(active),
        "total_triggers": total_triggers,
        "failed_reflexes": len(failed),
        "success_rate": round(1 - (len(failed) / max(len(reflexes), 1)), 2),
    }
