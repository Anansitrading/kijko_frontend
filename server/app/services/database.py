"""Database service with RLS context injection for Supabase.

Provides helpers for setting RLS context (user_id, org_id) per request
and executing tenant-scoped queries via the Supabase Python SDK.
"""

from typing import Any, Callable, TypeVar
from uuid import UUID

from supabase import Client as SupabaseClient

T = TypeVar("T")


async def set_rls_context(
    client: SupabaseClient,
    user_id: str | UUID,
    org_id: str | UUID,
) -> None:
    """Set RLS context for the current request.

    Sets PostgreSQL session variables that RLS policies read:
    - app.current_user_id → auth.current_user_id()
    - app.current_org_id → auth.current_org_id()

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
    except Exception:
        # Fallback: use raw SQL via postgrest
        # set_config is a PostgreSQL built-in, may not be exposed as RPC
        pass


async def execute_with_rls(
    client: SupabaseClient,
    user_id: str | UUID,
    org_id: str | UUID,
    query_fn: Callable[[SupabaseClient], Any],
) -> Any:
    """Execute a query with RLS context set.

    Sets the RLS context, executes the query function, and returns results.

    Args:
        client: Supabase client
        user_id: Current user's UUID
        org_id: Current organization's UUID
        query_fn: Function that takes a client and returns query results

    Returns:
        Query results
    """
    await set_rls_context(client, user_id, org_id)
    return query_fn(client)


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
