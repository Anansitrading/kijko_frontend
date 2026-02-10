"""GDPR data subject request service — export and deletion.

Handles data export (all user data as JSON) and cascade deletion
across all user-related tables.
"""

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from supabase import Client as SupabaseClient

logger = logging.getLogger(__name__)

# Tables containing user-specific data, in deletion order
USER_DATA_TABLES = [
    {"table": "skill_executions", "user_column": "user_id", "label": "Skill Executions"},
    {"table": "reflexes", "user_column": "user_id", "label": "Reflexes"},
    {"table": "habits", "user_column": "user_id", "label": "Habits"},
    {"table": "skills", "user_column": "user_id", "label": "Skills"},
    {"table": "project_members", "user_column": "user_id", "label": "Project Memberships"},
]


async def get_data_categories(
    client: SupabaseClient,
    user_id: str | UUID,
) -> list[dict[str, Any]]:
    """List data categories stored for a user with record counts.

    Returns a list of categories, each with name, count, and description.
    """
    categories = []
    uid = str(user_id)

    for table_info in USER_DATA_TABLES:
        try:
            result = (
                client.table(table_info["table"])
                .select("id", count="exact")
                .eq(table_info["user_column"], uid)
                .execute()
            )
            count = result.count or 0
        except Exception:
            count = 0

        categories.append({
            "category": table_info["label"],
            "table": table_info["table"],
            "record_count": count,
            "description": f"Your {table_info['label'].lower()} data",
        })

    # Add profile data (always 1)
    categories.insert(0, {
        "category": "Profile",
        "table": "auth_users",
        "record_count": 1,
        "description": "Your account profile and authentication data",
    })

    return categories


async def export_user_data(
    client: SupabaseClient,
    user_id: str | UUID,
) -> dict[str, Any]:
    """Export all user data as a structured JSON archive.

    Returns a dict with all data categories and their records.
    GDPR Article 20 — Right to data portability.
    """
    uid = str(user_id)
    export = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "user_id": uid,
        "format_version": "1.0",
        "data": {},
    }

    for table_info in USER_DATA_TABLES:
        try:
            result = (
                client.table(table_info["table"])
                .select("*")
                .eq(table_info["user_column"], uid)
                .execute()
            )
            export["data"][table_info["table"]] = {
                "label": table_info["label"],
                "record_count": len(result.data or []),
                "records": result.data or [],
            }
        except Exception as e:
            logger.warning("Failed to export %s: %s", table_info["table"], e)
            export["data"][table_info["table"]] = {
                "label": table_info["label"],
                "record_count": 0,
                "records": [],
                "error": str(e),
            }

    return export


async def delete_user_data(
    client: SupabaseClient,
    user_id: str | UUID,
) -> dict[str, Any]:
    """Delete all user data across all tables.

    GDPR Article 17 — Right to erasure.

    Processes tables in dependency order (executions first, skills last).
    Returns a summary of what was deleted.

    NOTE: This does NOT delete the auth account (handled by Keycloak).
    """
    uid = str(user_id)
    deletion_log = {
        "user_id": uid,
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "tables": {},
    }

    for table_info in USER_DATA_TABLES:
        try:
            result = (
                client.table(table_info["table"])
                .delete()
                .eq(table_info["user_column"], uid)
                .execute()
            )
            deleted_count = len(result.data) if result.data else 0
            deletion_log["tables"][table_info["table"]] = {
                "label": table_info["label"],
                "deleted_count": deleted_count,
                "status": "completed",
            }
            logger.info(
                "GDPR deletion: %s — deleted %d records for user %s",
                table_info["table"], deleted_count, uid,
            )
        except Exception as e:
            logger.error(
                "GDPR deletion failed for %s: %s",
                table_info["table"], e,
            )
            deletion_log["tables"][table_info["table"]] = {
                "label": table_info["label"],
                "deleted_count": 0,
                "status": "failed",
                "error": str(e),
            }

    total_deleted = sum(
        t.get("deleted_count", 0)
        for t in deletion_log["tables"].values()
    )
    deletion_log["total_deleted"] = total_deleted

    return deletion_log
