"""Project service — Supabase CRUD operations for projects and related entities.

Handles: projects, repositories, members, ingestion progress, project files.
All queries go through the shared Supabase client with RLS context set by middleware.
"""

import logging
from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

from server.app.services.database import build_filtered_query, build_pagination_query

logger = logging.getLogger(__name__)


# =============================================================================
# Projects
# =============================================================================

async def list_projects(
    client: SupabaseClient,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    project_type: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    """List projects (RLS-scoped to current org)."""
    filters = {}
    if status:
        filters["status"] = status
    if project_type:
        filters["type"] = project_type

    query = build_filtered_query(
        client, "projects",
        select="*, project_repositories(count), project_members(count)",
        filters=filters,
        page=page, page_size=page_size,
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


async def get_project(
    client: SupabaseClient,
    project_id: str | UUID,
) -> dict | None:
    """Get a single project by ID."""
    result = client.table("projects") \
        .select("*") \
        .eq("id", str(project_id)) \
        .single() \
        .execute()
    return result.data


async def get_project_with_relations(
    client: SupabaseClient,
    project_id: str | UUID,
) -> dict | None:
    """Get a project with repositories, members, and ingestion progress."""
    result = client.table("projects") \
        .select("*, project_repositories(*), project_members(*), ingestion_progress(*)") \
        .eq("id", str(project_id)) \
        .single() \
        .execute()
    return result.data


async def create_project(
    client: SupabaseClient,
    data: dict[str, Any],
    user_id: str | UUID,
    org_id: str | UUID,
) -> dict:
    """Create a new project."""
    insert_data = {
        "user_id": str(user_id),
        "organization_id": str(org_id),
        "name": data["name"],
        "description": data.get("description"),
        "type": data.get("type", "repository"),
        "privacy": data.get("privacy", "private"),
        "chunking_strategy": data.get("chunking_strategy", "semantic"),
        "include_metadata": data.get("include_metadata", True),
        "anonymize_secrets": data.get("anonymize_secrets", True),
        "custom_settings": data.get("custom_settings"),
    }

    result = client.table("projects") \
        .insert(insert_data) \
        .execute()
    return result.data[0] if result.data else {}


async def update_project(
    client: SupabaseClient,
    project_id: str | UUID,
    data: dict[str, Any],
) -> dict | None:
    """Update a project."""
    # Remove None values — only update provided fields
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_project(client, project_id)

    result = client.table("projects") \
        .update(update_data) \
        .eq("id", str(project_id)) \
        .execute()
    return result.data[0] if result.data else None


async def delete_project(
    client: SupabaseClient,
    project_id: str | UUID,
) -> bool:
    """Delete a project (cascades to repos, members, files)."""
    result = client.table("projects") \
        .delete() \
        .eq("id", str(project_id)) \
        .execute()
    return len(result.data) > 0


async def validate_project_name(
    client: SupabaseClient,
    name: str,
    exclude_id: str | UUID | None = None,
) -> dict[str, Any]:
    """Check if a project name is unique within the org."""
    query = client.table("projects") \
        .select("id") \
        .ilike("name", name)

    if exclude_id:
        query = query.neq("id", str(exclude_id))

    result = query.execute()
    is_available = len(result.data) == 0

    return {
        "valid": is_available,
        "error": None if is_available else "A project with this name already exists",
    }


# =============================================================================
# Repositories
# =============================================================================

async def list_repositories(
    client: SupabaseClient,
    project_id: str | UUID,
) -> list[dict]:
    """List repositories for a project."""
    result = client.table("project_repositories") \
        .select("*") \
        .eq("project_id", str(project_id)) \
        .order("created_at", desc=True) \
        .execute()
    return result.data


async def add_repository(
    client: SupabaseClient,
    project_id: str | UUID,
    data: dict[str, Any],
) -> dict:
    """Add a repository to a project."""
    insert_data = {
        "project_id": str(project_id),
        "provider": data["provider"],
        "repository_url": data["repository_url"],
        "repository_name": data["repository_name"],
        "branch": data.get("branch", "main"),
        "include_paths": data.get("include_paths", []),
        "exclude_paths": data.get("exclude_paths", []),
    }

    result = client.table("project_repositories") \
        .insert(insert_data) \
        .execute()
    return result.data[0] if result.data else {}


async def remove_repository(
    client: SupabaseClient,
    project_id: str | UUID,
    repo_id: str | UUID,
) -> bool:
    """Remove a repository from a project."""
    result = client.table("project_repositories") \
        .delete() \
        .eq("id", str(repo_id)) \
        .eq("project_id", str(project_id)) \
        .execute()
    return len(result.data) > 0


# =============================================================================
# Members
# =============================================================================

async def list_members(
    client: SupabaseClient,
    project_id: str | UUID,
) -> list[dict]:
    """List members of a project."""
    result = client.table("project_members") \
        .select("*") \
        .eq("project_id", str(project_id)) \
        .order("created_at", desc=False) \
        .execute()
    return result.data


async def add_member(
    client: SupabaseClient,
    project_id: str | UUID,
    data: dict[str, Any],
) -> dict:
    """Add a member to a project."""
    insert_data = {
        "project_id": str(project_id),
        "user_id": data.get("user_id", "00000000-0000-0000-0000-000000000000"),
        "email": data["email"],
        "name": data.get("name"),
        "role": data.get("role", "viewer"),
        "notify_on_ingestion": data.get("notify_on_ingestion", True),
        "notify_on_error": data.get("notify_on_error", True),
        "notify_on_team_changes": data.get("notify_on_team_changes", True),
    }

    result = client.table("project_members") \
        .insert(insert_data) \
        .execute()
    return result.data[0] if result.data else {}


async def update_member(
    client: SupabaseClient,
    project_id: str | UUID,
    member_id: str | UUID,
    data: dict[str, Any],
) -> dict | None:
    """Update a member's role/settings."""
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return None

    result = client.table("project_members") \
        .update(update_data) \
        .eq("id", str(member_id)) \
        .eq("project_id", str(project_id)) \
        .execute()
    return result.data[0] if result.data else None


async def remove_member(
    client: SupabaseClient,
    project_id: str | UUID,
    member_id: str | UUID,
) -> bool:
    """Remove a member from a project."""
    result = client.table("project_members") \
        .delete() \
        .eq("id", str(member_id)) \
        .eq("project_id", str(project_id)) \
        .execute()
    return len(result.data) > 0


async def bulk_invite_members(
    client: SupabaseClient,
    project_id: str | UUID,
    invitations: list[dict[str, Any]],
) -> dict[str, Any]:
    """Bulk invite members to a project."""
    results = []
    total_sent = 0
    total_failed = 0

    for invite in invitations:
        try:
            member = await add_member(client, project_id, invite)
            results.append({
                "email": invite["email"],
                "status": "sent",
                "member_id": member.get("id"),
            })
            total_sent += 1
        except Exception as e:
            results.append({
                "email": invite["email"],
                "status": "failed",
                "error": str(e),
            })
            total_failed += 1

    return {
        "results": results,
        "total_sent": total_sent,
        "total_failed": total_failed,
    }


# =============================================================================
# Ingestion Progress
# =============================================================================

async def get_ingestion_progress(
    client: SupabaseClient,
    project_id: str | UUID,
) -> dict | None:
    """Get current ingestion progress for a project."""
    result = client.table("ingestion_progress") \
        .select("*") \
        .eq("project_id", str(project_id)) \
        .is_("completed_at", "null") \
        .order("started_at", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0] if result.data else None


# =============================================================================
# Project Files
# =============================================================================

async def list_project_files(
    client: SupabaseClient,
    project_id: str | UUID,
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    """List files for a project."""
    query = build_pagination_query(
        client, "project_files",
        page=page, page_size=page_size,
    )
    query = query.eq("project_id", str(project_id))

    result = query.execute()
    total = result.count or 0

    return {
        "data": result.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


# =============================================================================
# Validation Helpers
# =============================================================================

def validate_repository_url(url: str) -> dict[str, Any]:
    """Validate a repository URL and extract provider + name."""
    import re

    patterns = {
        "github": r"github\.com[/:]([^/]+/[^/.]+)",
        "gitlab": r"gitlab\.com[/:]([^/]+/[^/.]+)",
        "bitbucket": r"bitbucket\.org[/:]([^/]+/[^/.]+)",
        "azure": r"dev\.azure\.com[/:]([^/]+/[^/]+/_git/[^/.]+)",
    }

    for provider, pattern in patterns.items():
        match = re.search(pattern, url)
        if match:
            return {
                "valid": True,
                "provider": provider,
                "repository_name": match.group(1),
            }

    return {
        "valid": False,
        "error": "Invalid repository URL. Supported: GitHub, GitLab, Bitbucket, Azure DevOps",
    }
