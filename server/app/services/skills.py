"""Skills service — Supabase CRUD operations for skills."""

from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

from server.app.services.database import build_filtered_query


async def list_skills(
    client: SupabaseClient,
    page: int = 1,
    page_size: int = 20,
    category: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    """List skills (RLS-scoped to current user)."""
    filters = {}
    if category:
        filters["category"] = category
    if is_active is not None:
        filters["is_active"] = is_active

    query = build_filtered_query(
        client, "skills", filters=filters, page=page, page_size=page_size,
    )
    if search:
        query = query.ilike("name", f"%{search}%")

    result = query.execute()
    total = result.count or 0
    return {
        "data": result.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


async def get_skill(client: SupabaseClient, skill_id: str | UUID) -> dict | None:
    result = client.table("skills").select("*").eq("id", str(skill_id)).single().execute()
    return result.data


async def get_skill_with_relations(client: SupabaseClient, skill_id: str | UUID) -> dict | None:
    result = client.table("skills") \
        .select("*, habits(count), reflexes(count), skill_executions(id, status, executed_at, duration_ms)") \
        .eq("id", str(skill_id)).single().execute()
    return result.data


async def create_skill(client: SupabaseClient, data: dict[str, Any], user_id: str | UUID) -> dict:
    insert_data = {
        "user_id": str(user_id),
        "name": data["name"],
        "description": data.get("description"),
        "category": data.get("category", "custom"),
        "prompt_template": data["prompt_template"],
        "model": data.get("model", "claude-3-5-sonnet-20241022"),
        "parameters": data.get("parameters", {"temperature": 1, "max_tokens": 4096}),
        "input_schema": data.get("input_schema"),
        "output_format": data.get("output_format", "markdown"),
    }
    result = client.table("skills").insert(insert_data).execute()
    return result.data[0] if result.data else {}


async def update_skill(client: SupabaseClient, skill_id: str | UUID, data: dict[str, Any]) -> dict | None:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_skill(client, skill_id)
    result = client.table("skills").update(update_data).eq("id", str(skill_id)).execute()
    return result.data[0] if result.data else None


async def delete_skill(client: SupabaseClient, skill_id: str | UUID) -> bool:
    result = client.table("skills").delete().eq("id", str(skill_id)).execute()
    return len(result.data) > 0


async def bulk_action(client: SupabaseClient, skill_ids: list[str], action: str) -> dict:
    """Perform bulk action on skills."""
    if action == "delete":
        result = client.table("skills").delete().in_("id", skill_ids).execute()
        return {"affected": len(result.data), "action": action}
    elif action in ("activate", "deactivate"):
        is_active = action == "activate"
        result = client.table("skills").update({"is_active": is_active}).in_("id", skill_ids).execute()
        return {"affected": len(result.data), "action": action}
    return {"affected": 0, "action": action}


async def export_skill(client: SupabaseClient, skill_id: str | UUID) -> dict | None:
    """Export skill configuration (without user-specific data)."""
    result = client.table("skills") \
        .select("name, description, category, prompt_template, model, parameters, input_schema, output_format") \
        .eq("id", str(skill_id)).single().execute()
    return result.data
