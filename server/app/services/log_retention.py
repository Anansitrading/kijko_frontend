"""Log retention service — 30-day retention with PII exclusion.

Implements automated cleanup of old execution logs, usage events,
and activity records. PII fields are excluded from retained logs.

Usage:
    # As a Celery periodic task:
    from server.app.services.log_retention import cleanup_expired_logs
    await cleanup_expired_logs(supabase_client)

    # Manually via management endpoint:
    POST /api/v1/admin/cleanup-logs
"""

import logging
from datetime import datetime, timedelta, timezone

from supabase import Client as SupabaseClient

logger = logging.getLogger(__name__)

# Retention periods per table
RETENTION_POLICIES = {
    "skill_executions": {
        "retention_days": 30,
        "timestamp_column": "created_at",
        "pii_columns": [],  # No direct PII in executions
    },
    "usage_metrics": {
        "retention_days": 30,
        "timestamp_column": "created_at",
        "pii_columns": [],
    },
}

# Fields to strip from any log output (PII exclusion)
PII_FIELDS = frozenset({
    "email", "name", "full_name", "phone", "address",
    "ip_address", "user_agent", "password", "token",
})


def sanitize_log_record(record: dict) -> dict:
    """Strip PII fields from a log record before writing to persistent logs."""
    return {k: v for k, v in record.items() if k not in PII_FIELDS}


async def cleanup_expired_logs(
    client: SupabaseClient,
    dry_run: bool = False,
) -> dict:
    """Delete records older than their retention period.

    Returns a summary of what was (or would be) deleted per table.
    """
    results = {}

    for table, policy in RETENTION_POLICIES.items():
        cutoff = datetime.now(timezone.utc) - timedelta(days=policy["retention_days"])
        cutoff_iso = cutoff.isoformat()

        try:
            if dry_run:
                # Count records that would be deleted
                result = (
                    client.table(table)
                    .select("id", count="exact")
                    .lt(policy["timestamp_column"], cutoff_iso)
                    .execute()
                )
                count = result.count or 0
                results[table] = {
                    "would_delete": count,
                    "cutoff": cutoff_iso,
                    "dry_run": True,
                }
            else:
                result = (
                    client.table(table)
                    .delete()
                    .lt(policy["timestamp_column"], cutoff_iso)
                    .execute()
                )
                deleted = len(result.data) if result.data else 0
                results[table] = {
                    "deleted": deleted,
                    "cutoff": cutoff_iso,
                    "dry_run": False,
                }
                logger.info(
                    "Log retention: deleted %d records from %s (cutoff: %s)",
                    deleted, table, cutoff_iso,
                )
        except Exception as e:
            logger.error("Log retention failed for %s: %s", table, e)
            results[table] = {"error": str(e)}

    return results
