"""Database service with RLS context injection for Supabase.

Provides helpers for setting RLS context (user_id, org_id) per request,
executing tenant-scoped queries via the Supabase Python SDK, and calling
SECURITY DEFINER functions that bypass RLS for system operations.

Architecture:
  - Every HTTP request must call set_rls_context() before any queries
  - RLS policies in 004_rls_policies.sql read from app.current_user_id / app.current_org_id
  - Background workers use SECURITY DEFINER functions (no user context)
"""

import logging
from typing import Any, Callable, TypeVar
from uuid import UUID

from supabase import Client as SupabaseClient

logger = logging.getLogger(__name__)

T = TypeVar("T")


# =============================================================================
# RLS Context Management
# =============================================================================

async def set_rls_context(
    client: SupabaseClient,
    user_id: str | UUID,
    org_id: str | UUID,
) -> None:
    """Set RLS context for the current request.

    Sets PostgreSQL session variables that RLS policies read:
    - app.current_user_id → auth.current_user_id()
    - app.current_org_id → auth.current_org_id()

    This MUST be called before any data query in an authenticated request.

    Args:
        client: Supabase client (service_role)
        user_id: Current user's UUID
        org_id: Current organization's UUID
    """
    await _execute_rpc(client, "set_config", {
        "setting": "app.current_user_id",
        "value": str(user_id),
    })
    await _execute_rpc(client, "set_config", {
        "setting": "app.current_org_id",
        "value": str(org_id),
    })


async def clear_rls_context(client: SupabaseClient) -> None:
    """Clear RLS context after request completes.

    Should be called in request teardown to prevent context leaking
    between requests on the same connection (e.g., connection pooling).
    """
    await _execute_rpc(client, "set_config", {
        "setting": "app.current_user_id",
        "value": "",
    })
    await _execute_rpc(client, "set_config", {
        "setting": "app.current_org_id",
        "value": "",
    })


async def _execute_rpc(
    client: SupabaseClient,
    function_name: str,
    params: dict[str, Any],
) -> Any:
    """Execute a Supabase RPC call.

    Wraps the synchronous Supabase client in a way compatible
    with our async FastAPI handlers.
    """
    try:
        result = client.rpc(function_name, params).execute()
        return result.data
    except Exception as e:
        logger.warning(
            "RPC call %s failed: %s. "
            "This may be expected if set_config is not exposed as RPC.",
            function_name,
            str(e),
        )
        return None


# =============================================================================
# RLS-Scoped Query Execution
# =============================================================================

async def execute_with_rls(
    client: SupabaseClient,
    user_id: str | UUID,
    org_id: str | UUID,
    query_fn: Callable[[SupabaseClient], Any],
) -> Any:
    """Execute a query with RLS context set.

    Sets the RLS context, executes the query function, returns results,
    then clears context to prevent leaking.

    Args:
        client: Supabase client
        user_id: Current user's UUID
        org_id: Current organization's UUID
        query_fn: Function that takes a client and returns query results

    Returns:
        Query results
    """
    try:
        await set_rls_context(client, user_id, org_id)
        return query_fn(client)
    finally:
        await clear_rls_context(client)


# =============================================================================
# SECURITY DEFINER Function Wrappers
# These bypass RLS for admin/system operations.
# =============================================================================

async def admin_list_projects(
    client: SupabaseClient,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """List all projects across all organizations (admin only).

    Calls the SECURITY DEFINER function that bypasses RLS.

    Returns:
        List of project dicts with id, name, organization_id, status, created_at
    """
    result = await _execute_rpc(client, "admin_list_all_projects", {
        "p_limit": limit,
        "p_offset": offset,
    })
    return result or []


async def system_get_skill(
    client: SupabaseClient,
    skill_id: str | UUID,
) -> dict | None:
    """Get skill config for background execution (bypasses RLS).

    Used by Celery workers that don't have a user session.

    Returns:
        Skill dict or None if not found/inactive
    """
    result = await _execute_rpc(client, "system_get_skill_for_execution", {
        "p_skill_id": str(skill_id),
    })
    if result and len(result) > 0:
        return result[0]
    return None


async def system_record_execution(
    client: SupabaseClient,
    skill_id: str | UUID,
    user_id: str | UUID,
    execution_type: str,
    reference_id: str | UUID | None = None,
    input_data: dict | None = None,
    output: str | None = None,
    tokens_used: int | None = None,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    duration_ms: int | None = None,
    cost_cents: int | None = None,
    status: str = "completed",
    error_message: str | None = None,
    error_code: str | None = None,
) -> str | None:
    """Record a skill execution from a background worker (bypasses RLS).

    Returns:
        UUID of the created execution record, or None on failure
    """
    params = {
        "p_skill_id": str(skill_id),
        "p_user_id": str(user_id),
        "p_execution_type": execution_type,
        "p_reference_id": str(reference_id) if reference_id else None,
        "p_input": input_data,
        "p_output": output,
        "p_tokens_used": tokens_used,
        "p_prompt_tokens": prompt_tokens,
        "p_completion_tokens": completion_tokens,
        "p_duration_ms": duration_ms,
        "p_cost_cents": cost_cents,
        "p_status": status,
        "p_error_message": error_message,
        "p_error_code": error_code,
    }
    result = await _execute_rpc(client, "system_record_execution", params)
    return result


async def system_get_due_habits(client: SupabaseClient) -> list[dict]:
    """Get habits due for scheduled execution (bypasses RLS).

    Returns:
        List of habit dicts ready for execution
    """
    result = await _execute_rpc(client, "system_get_due_habits", {})
    return result or []


async def system_update_habit_run(
    client: SupabaseClient,
    habit_id: str | UUID,
    next_run_at: str,
    error_message: str | None = None,
) -> None:
    """Update a habit after execution (bypasses RLS).

    Args:
        habit_id: The habit UUID
        next_run_at: ISO 8601 timestamp for next scheduled run
        error_message: Error message if execution failed, None if success
    """
    await _execute_rpc(client, "system_update_habit_run", {
        "p_habit_id": str(habit_id),
        "p_next_run_at": next_run_at,
        "p_error_message": error_message,
    })


# =============================================================================
# Query Building Helpers
# =============================================================================

def build_pagination_query(
    client: SupabaseClient,
    table: str,
    page: int = 1,
    page_size: int = 50,
    select: str = "*",
    order_by: str = "created_at",
    ascending: bool = False,
) -> Any:
    """Build a paginated query.

    Args:
        client: Supabase client
        table: Table name
        page: Page number (1-indexed)
        page_size: Items per page (max 100)
        select: Select clause
        order_by: Column to order by
        ascending: Sort direction

    Returns:
        Query builder ready to execute
    """
    page_size = min(page_size, 100)  # Cap at 100
    offset = (page - 1) * page_size

    query = (
        client.table(table)
        .select(select, count="exact")
        .order(order_by, desc=not ascending)
        .range(offset, offset + page_size - 1)
    )

    return query


def build_filtered_query(
    client: SupabaseClient,
    table: str,
    select: str = "*",
    filters: dict[str, Any] | None = None,
    order_by: str = "created_at",
    ascending: bool = False,
    page: int = 1,
    page_size: int = 50,
) -> Any:
    """Build a filtered and paginated query.

    Args:
        client: Supabase client
        table: Table name
        select: Select clause
        filters: Dict of column -> value filters (exact match)
        order_by: Column to order by
        ascending: Sort direction
        page: Page number (1-indexed)
        page_size: Items per page (max 100)

    Returns:
        Query builder ready to execute
    """
    page_size = min(page_size, 100)
    offset = (page - 1) * page_size

    query = client.table(table).select(select, count="exact")

    if filters:
        for column, value in filters.items():
            if value is not None:
                query = query.eq(column, str(value) if isinstance(value, UUID) else value)

    query = query.order(order_by, desc=not ascending)
    query = query.range(offset, offset + page_size - 1)

    return query
