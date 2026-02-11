"""Comprehensive tests for domain services without dedicated test coverage.

Covers:
1. GDPR Service (gdpr.py) - data categories, export, deletion
2. Project Service validation (projects.py) - repository URL parsing
3. Habits Service (habits.py) - cron validation
4. Reflexes Service (reflexes.py) - test_reflex, get_reflex_stats, get_webhook_info
5. Executions Service (executions.py) - get_execution_stats, get_stats_by_skill, get_stats_by_period
6. Observability Middleware (observability.py) - request ID, timing, skipped paths
7. Pydantic Model Validation - ProjectCreate, RepositoryCreate, MemberCreate, ReflexCreate, BulkInviteRequest
"""

import logging
import re
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from server.app.services.gdpr import (
    get_data_categories,
    export_user_data,
    delete_user_data,
    USER_DATA_TABLES,
)
from server.app.services.projects import validate_repository_url
from server.app.services.habits import validate_cron
from server.app.services.reflexes import test_reflex as reflex_test_fn, get_reflex_stats, get_webhook_info
from server.app.services.executions import (
    get_execution_stats,
    get_stats_by_skill,
    get_stats_by_period,
)
from server.app.middleware.observability import ObservabilityMiddleware
from server.app.models.project import (
    ProjectCreate,
    RepositoryCreate,
    MemberCreate,
    BulkInviteRequest,
)
from server.app.models.reflex import ReflexCreate
from server.app.models.enums import (
    GitProvider,
    ProjectType,
    ProjectPrivacy,
    ChunkingStrategy,
    ReflexTriggerType,
    ProjectMemberRole,
)


# ---------------------------------------------------------------------------
# Mock helpers
# ---------------------------------------------------------------------------

def mock_supabase_query(data=None, count=None, error=None):
    """Create a mock Supabase query chain.

    Returns (mock_client, mock_query, mock_result) where:
    - mock_client.table(name) returns mock_query
    - mock_query.<chain_method>() returns mock_query (for fluent chaining)
    - mock_query.execute() returns mock_result
    """
    mock_result = MagicMock()
    mock_result.data = data or []
    mock_result.count = count

    mock_query = MagicMock()
    mock_query.execute.return_value = mock_result
    # Chain methods return self for fluent API
    for method in [
        "select", "eq", "neq", "ilike", "in_", "delete", "insert",
        "update", "single", "limit", "order", "is_", "gte", "lte",
    ]:
        getattr(mock_query, method).return_value = mock_query

    mock_client = MagicMock()
    mock_client.table.return_value = mock_query
    return mock_client, mock_query, mock_result


def mock_supabase_multi_table(table_responses: dict):
    """Create a mock Supabase client that returns different data per table.

    Args:
        table_responses: mapping of table_name -> (data, count) tuples
    """
    mock_client = MagicMock()

    def _table(name):
        data, count = table_responses.get(name, ([], None))
        mock_result = MagicMock()
        mock_result.data = data
        mock_result.count = count

        mock_query = MagicMock()
        mock_query.execute.return_value = mock_result
        for method in [
            "select", "eq", "neq", "ilike", "in_", "delete", "insert",
            "update", "single", "limit", "order", "is_", "gte", "lte",
        ]:
            getattr(mock_query, method).return_value = mock_query
        return mock_query

    mock_client.table.side_effect = _table
    return mock_client


TEST_USER_ID = "00000000-0000-0000-0000-000000000099"


# ===========================================================================
# 1. GDPR Service
# ===========================================================================


class TestGDPRService:
    """Tests for server/app/services/gdpr.py."""

    def test_user_data_tables_structure(self):
        """USER_DATA_TABLES has 5 entries, each with required keys."""
        assert len(USER_DATA_TABLES) == 5
        for entry in USER_DATA_TABLES:
            assert "table" in entry
            assert "user_column" in entry
            assert "label" in entry

    @pytest.mark.asyncio
    async def test_get_data_categories_returns_all_tables_plus_profile(self):
        """get_data_categories returns 6 categories: 1 Profile + 5 tables."""
        table_responses = {}
        for t in USER_DATA_TABLES:
            table_responses[t["table"]] = (
                [{"id": "x"}] * 3,  # 3 records
                3,
            )
        client = mock_supabase_multi_table(table_responses)

        result = await get_data_categories(client, TEST_USER_ID)

        assert len(result) == 6  # Profile + 5 tables
        assert result[0]["category"] == "Profile"
        assert result[0]["table"] == "auth_users"
        assert result[0]["record_count"] == 1
        # All other entries should have count 3
        for cat in result[1:]:
            assert cat["record_count"] == 3
            assert "description" in cat

    @pytest.mark.asyncio
    async def test_get_data_categories_handles_query_errors(self):
        """When a table query fails, count defaults to 0."""
        mock_client = MagicMock()

        def _table(name):
            mock_query = MagicMock()
            for method in ["select", "eq", "neq", "ilike", "in_", "delete",
                           "insert", "update", "single", "limit", "order",
                           "is_", "gte", "lte"]:
                getattr(mock_query, method).return_value = mock_query
            mock_query.execute.side_effect = Exception("DB down")
            return mock_query

        mock_client.table.side_effect = _table

        result = await get_data_categories(mock_client, TEST_USER_ID)

        assert len(result) == 6
        for cat in result[1:]:  # skip Profile
            assert cat["record_count"] == 0

    @pytest.mark.asyncio
    async def test_export_user_data_format(self):
        """export_user_data returns proper structure with format_version."""
        table_responses = {}
        for t in USER_DATA_TABLES:
            records = [{"id": "rec1", "value": "test"}]
            table_responses[t["table"]] = (records, 1)
        client = mock_supabase_multi_table(table_responses)

        result = await export_user_data(client, TEST_USER_ID)

        assert result["user_id"] == TEST_USER_ID
        assert result["format_version"] == "1.0"
        assert "export_date" in result
        assert "data" in result
        # Each table should appear in data
        for t in USER_DATA_TABLES:
            table_data = result["data"][t["table"]]
            assert table_data["label"] == t["label"]
            assert table_data["record_count"] == 1
            assert len(table_data["records"]) == 1

    @pytest.mark.asyncio
    async def test_export_user_data_handles_table_error(self):
        """When a table export fails, that table has error key, others succeed."""
        call_count = 0

        def _table(name):
            nonlocal call_count
            call_count += 1
            mock_query = MagicMock()
            for method in ["select", "eq", "neq", "ilike", "in_", "delete",
                           "insert", "update", "single", "limit", "order",
                           "is_", "gte", "lte"]:
                getattr(mock_query, method).return_value = mock_query

            if name == "reflexes":
                mock_query.execute.side_effect = Exception("Network error")
            else:
                mock_result = MagicMock()
                mock_result.data = [{"id": "ok"}]
                mock_query.execute.return_value = mock_result
            return mock_query

        mock_client = MagicMock()
        mock_client.table.side_effect = _table

        result = await export_user_data(mock_client, TEST_USER_ID)

        # reflexes should have error
        assert "error" in result["data"]["reflexes"]
        assert result["data"]["reflexes"]["record_count"] == 0
        # Others should have data
        assert result["data"]["skill_executions"]["record_count"] == 1

    @pytest.mark.asyncio
    async def test_delete_user_data_returns_deletion_log(self):
        """delete_user_data returns log with total_deleted."""
        table_responses = {}
        for t in USER_DATA_TABLES:
            deleted_records = [{"id": f"del_{i}"} for i in range(2)]
            table_responses[t["table"]] = (deleted_records, None)
        client = mock_supabase_multi_table(table_responses)

        result = await delete_user_data(client, TEST_USER_ID)

        assert result["user_id"] == TEST_USER_ID
        assert "deleted_at" in result
        assert result["total_deleted"] == 10  # 5 tables * 2 records each
        for t in USER_DATA_TABLES:
            table_log = result["tables"][t["table"]]
            assert table_log["deleted_count"] == 2
            assert table_log["status"] == "completed"

    @pytest.mark.asyncio
    async def test_delete_user_data_partial_failure(self):
        """When one table deletion fails, others still proceed."""
        def _table(name):
            mock_query = MagicMock()
            for method in ["select", "eq", "neq", "ilike", "in_", "delete",
                           "insert", "update", "single", "limit", "order",
                           "is_", "gte", "lte"]:
                getattr(mock_query, method).return_value = mock_query

            if name == "habits":
                mock_query.execute.side_effect = Exception("FK constraint")
            else:
                mock_result = MagicMock()
                mock_result.data = [{"id": "1"}]
                mock_query.execute.return_value = mock_result
            return mock_query

        mock_client = MagicMock()
        mock_client.table.side_effect = _table

        result = await delete_user_data(mock_client, TEST_USER_ID)

        assert result["tables"]["habits"]["status"] == "failed"
        assert result["tables"]["habits"]["deleted_count"] == 0
        assert "error" in result["tables"]["habits"]
        # Others succeeded
        assert result["tables"]["skill_executions"]["status"] == "completed"
        assert result["total_deleted"] == 4  # 4 tables * 1 record each (habits failed)


# ===========================================================================
# 2. Project Service - validate_repository_url
# ===========================================================================


class TestValidateRepositoryUrl:
    """Tests for server/app/services/projects.validate_repository_url."""

    def test_github_https(self):
        result = validate_repository_url("https://github.com/owner/repo")
        assert result["valid"] is True
        assert result["provider"] == "github"
        assert result["repository_name"] == "owner/repo"

    def test_github_ssh(self):
        result = validate_repository_url("git@github.com:owner/repo")
        assert result["valid"] is True
        assert result["provider"] == "github"
        assert result["repository_name"] == "owner/repo"

    def test_github_with_git_suffix(self):
        result = validate_repository_url("https://github.com/owner/repo.git")
        assert result["valid"] is True
        assert result["provider"] == "github"
        # The regex stops at '.', so it captures 'owner/repo'
        assert result["repository_name"] == "owner/repo"

    def test_gitlab_https(self):
        result = validate_repository_url("https://gitlab.com/group/project")
        assert result["valid"] is True
        assert result["provider"] == "gitlab"
        assert result["repository_name"] == "group/project"

    def test_bitbucket_https(self):
        result = validate_repository_url("https://bitbucket.org/team/repo")
        assert result["valid"] is True
        assert result["provider"] == "bitbucket"
        assert result["repository_name"] == "team/repo"

    def test_azure_devops(self):
        result = validate_repository_url(
            "https://dev.azure.com/org/project/_git/repo"
        )
        assert result["valid"] is True
        assert result["provider"] == "azure"
        assert result["repository_name"] == "org/project/_git/repo"

    def test_invalid_url(self):
        result = validate_repository_url("https://example.com/foo/bar")
        assert result["valid"] is False
        assert "error" in result

    def test_empty_string(self):
        result = validate_repository_url("")
        assert result["valid"] is False

    def test_random_text(self):
        result = validate_repository_url("not a url at all")
        assert result["valid"] is False


# ===========================================================================
# 3. Habits Service - validate_cron
# ===========================================================================


class TestValidateCron:
    """Tests for server/app/services/habits.validate_cron."""

    def test_valid_cron_every_minute(self):
        result = validate_cron("* * * * *")
        assert result["valid"] is True
        assert result["expression"] == "* * * * *"
        assert len(result["next_runs"]) == 5

    def test_valid_cron_daily_at_9am(self):
        result = validate_cron("0 9 * * *")
        assert result["valid"] is True
        assert len(result["next_runs"]) == 5

    def test_valid_cron_weekly(self):
        result = validate_cron("0 0 * * 1")
        assert result["valid"] is True

    def test_next_runs_are_iso_format(self):
        result = validate_cron("0 12 * * *")
        assert result["valid"] is True
        for run in result["next_runs"]:
            # Should parse as a datetime
            datetime.fromisoformat(run)

    def test_description_field_present(self):
        result = validate_cron("0 0 1 * *")
        assert "description" in result

    def test_cron_with_ranges(self):
        result = validate_cron("0 9-17 * * 1-5")
        assert result["valid"] is True

    def test_cron_with_step(self):
        result = validate_cron("*/15 * * * *")
        assert result["valid"] is True


# ===========================================================================
# 4. Reflexes Service
# ===========================================================================


class TestTestReflex:
    """Tests for server/app/services/reflexes.test_reflex."""

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Returns error when reflex does not exist."""
        client, _, _ = mock_supabase_query(data=None)
        # .single().execute() returns data=None for not-found
        mock_result = MagicMock()
        mock_result.data = None
        mock_query = client.table.return_value
        mock_query.execute.return_value = mock_result

        result = await reflex_test_fn(client, "nonexistent-id", {"event": "push"})

        assert result["matched"] is False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_conditions_match(self):
        """When all conditions match, matched=True."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "skill_id": "s1",
            "conditions": {"repo": "main", "action": "push"},
            "is_active": True,
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        event = {"repo": "main", "action": "push", "extra": "ignored"}
        result = await reflex_test_fn(client, "r1", event)

        assert result["matched"] is True
        assert result["trigger_type"] == "webhook"
        assert result["would_execute_skill"] == "s1"

    @pytest.mark.asyncio
    async def test_conditions_no_match(self):
        """When conditions don't match, matched=False."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "skill_id": "s1",
            "conditions": {"repo": "main", "action": "push"},
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        event = {"repo": "main", "action": "pull_request"}
        result = await reflex_test_fn(client, "r1", event)

        assert result["matched"] is False

    @pytest.mark.asyncio
    async def test_no_conditions_always_matches(self):
        """When conditions is None/empty, always matches."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "skill_id": "s1",
            "conditions": None,
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        result = await reflex_test_fn(client, "r1", {"anything": "here"})
        assert result["matched"] is True

    @pytest.mark.asyncio
    async def test_empty_conditions_always_matches(self):
        """Empty conditions dict always matches."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "event",
            "skill_id": "s1",
            "conditions": {},
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        result = await reflex_test_fn(client, "r1", {})
        assert result["matched"] is True

    @pytest.mark.asyncio
    async def test_condition_key_missing_from_event(self):
        """Condition key not in event_data -> no match."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "skill_id": "s1",
            "conditions": {"branch": "main"},
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        result = await reflex_test_fn(client, "r1", {"repo": "myrepo"})
        assert result["matched"] is False


class TestGetReflexStats:
    """Tests for server/app/services/reflexes.get_reflex_stats."""

    @pytest.mark.asyncio
    async def test_empty_reflexes(self):
        client, _, _ = mock_supabase_query(data=[], count=0)

        result = await get_reflex_stats(client)

        assert result["total_reflexes"] == 0
        assert result["active_reflexes"] == 0
        assert result["total_triggers"] == 0
        assert result["failed_reflexes"] == 0
        assert result["success_rate"] == 1.0  # 1 - 0/1

    @pytest.mark.asyncio
    async def test_mixed_reflexes(self):
        reflexes_data = [
            {"id": "1", "is_active": True, "consecutive_failures": 0, "trigger_count": 10},
            {"id": "2", "is_active": True, "consecutive_failures": 0, "trigger_count": 5},
            {"id": "3", "is_active": False, "consecutive_failures": 2, "trigger_count": 3},
            {"id": "4", "is_active": True, "consecutive_failures": 1, "trigger_count": 7},
        ]
        client, _, _ = mock_supabase_query(data=reflexes_data, count=4)

        result = await get_reflex_stats(client)

        assert result["total_reflexes"] == 4
        assert result["active_reflexes"] == 3
        assert result["total_triggers"] == 25
        assert result["failed_reflexes"] == 2  # id 3 and 4 have consecutive_failures > 0
        assert result["success_rate"] == round(1 - (2 / 4), 2)  # 0.5


class TestGetWebhookInfo:
    """Tests for server/app/services/reflexes.get_webhook_info."""

    @pytest.mark.asyncio
    async def test_non_webhook_reflex_returns_none(self):
        """Non-webhook trigger type returns None."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "email",
            "trigger_config": {},
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        result = await get_webhook_info(client, "r1")
        assert result is None

    @pytest.mark.asyncio
    async def test_nonexistent_reflex_returns_none(self):
        """Reflex not found returns None."""
        client, _, _ = mock_supabase_query(data=None)
        mock_result = MagicMock()
        mock_result.data = None
        client.table.return_value.execute.return_value = mock_result

        result = await get_webhook_info(client, "nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_webhook_with_existing_secret(self):
        """Returns webhook info with existing secret."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "trigger_config": {"secret": "existing-secret-abc"},
        }
        client, _, _ = mock_supabase_query(data=reflex_data)

        result = await get_webhook_info(client, "r1")

        assert result is not None
        assert result["reflex_id"] == "r1"
        assert result["webhook_url"] == "/api/v1/webhooks/reflexes/r1"
        assert result["webhook_secret"] == "existing-secret-abc"
        assert result["trigger_type"] == "webhook"

    @pytest.mark.asyncio
    async def test_webhook_generates_secret_when_missing(self):
        """Generates a new secret when trigger_config has no secret."""
        reflex_data = {
            "id": "r1",
            "trigger_type": "webhook",
            "trigger_config": {},
        }
        # get_reflex (select -> single -> execute) and update_reflex (update -> eq -> execute)
        # both go through client.table("reflexes"), so we need the mock chain to handle both.
        # The first execute call returns the reflex data (get_reflex).
        # The second execute call returns a list (update_reflex expects result.data[0]).
        mock_result_get = MagicMock()
        mock_result_get.data = reflex_data

        mock_result_update = MagicMock()
        mock_result_update.data = [reflex_data]

        mock_query = MagicMock()
        mock_query.execute.side_effect = [mock_result_get, mock_result_update]
        for method in [
            "select", "eq", "neq", "ilike", "in_", "delete", "insert",
            "update", "single", "limit", "order", "is_", "gte", "lte",
        ]:
            getattr(mock_query, method).return_value = mock_query

        mock_client = MagicMock()
        mock_client.table.return_value = mock_query

        result = await get_webhook_info(mock_client, "r1")

        assert result is not None
        assert result["webhook_secret"] is not None
        assert len(result["webhook_secret"]) > 0
        # Should have called table for the update
        mock_client.table.assert_any_call("reflexes")


# ===========================================================================
# 5. Executions Service
# ===========================================================================


class TestGetExecutionStats:
    """Tests for server/app/services/executions.get_execution_stats."""

    @pytest.mark.asyncio
    async def test_empty_executions(self):
        client, _, _ = mock_supabase_query(data=[], count=0)

        result = await get_execution_stats(client, days=30)

        assert result["total_executions"] == 0
        assert result["successful"] == 0
        assert result["failed"] == 0
        assert result["cancelled"] == 0
        assert result["total_tokens"] == 0
        assert result["total_cost_cents"] == 0
        assert result["avg_duration_ms"] is None
        assert result["success_rate"] == 0.0

    @pytest.mark.asyncio
    async def test_mixed_executions(self):
        executions = [
            {"status": "completed", "tokens_used": 100, "cost_cents": 5, "duration_ms": 200},
            {"status": "completed", "tokens_used": 200, "cost_cents": 10, "duration_ms": 300},
            {"status": "failed", "tokens_used": 50, "cost_cents": 2, "duration_ms": 100},
            {"status": "cancelled", "tokens_used": 0, "cost_cents": 0, "duration_ms": None},
        ]
        client, _, _ = mock_supabase_query(data=executions, count=4)

        result = await get_execution_stats(client)

        assert result["total_executions"] == 4
        assert result["successful"] == 2
        assert result["failed"] == 1
        assert result["cancelled"] == 1
        assert result["total_tokens"] == 350
        assert result["total_cost_cents"] == 17
        assert result["avg_duration_ms"] == 200.0  # (200+300+100)/3
        assert result["success_rate"] == 0.5  # 2/4

    @pytest.mark.asyncio
    async def test_all_none_durations(self):
        executions = [
            {"status": "completed", "tokens_used": 100, "cost_cents": 5, "duration_ms": None},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_execution_stats(client)
        assert result["avg_duration_ms"] is None


class TestGetStatsBySkill:
    """Tests for server/app/services/executions.get_stats_by_skill."""

    @pytest.mark.asyncio
    async def test_empty_data(self):
        client, _, _ = mock_supabase_query(data=[])

        result = await get_stats_by_skill(client)
        assert result == []

    @pytest.mark.asyncio
    async def test_groups_by_skill(self):
        executions = [
            {"skill_id": "s1", "status": "completed", "tokens_used": 100,
             "cost_cents": 5, "duration_ms": 200, "skills": {"name": "Summarize"}},
            {"skill_id": "s1", "status": "failed", "tokens_used": 50,
             "cost_cents": 2, "duration_ms": 100, "skills": {"name": "Summarize"}},
            {"skill_id": "s2", "status": "completed", "tokens_used": 300,
             "cost_cents": 15, "duration_ms": 500, "skills": {"name": "Translate"}},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_skill(client)

        assert len(result) == 2
        # Sorted by total_executions desc -> s1 first (2 executions)
        assert result[0]["skill_id"] == "s1"
        assert result[0]["total_executions"] == 2
        assert result[0]["successful"] == 1
        assert result[0]["failed"] == 1
        assert result[0]["skill_name"] == "Summarize"
        assert result[0]["total_tokens"] == 150
        assert result[0]["avg_duration_ms"] == 150.0

        assert result[1]["skill_id"] == "s2"
        assert result[1]["total_executions"] == 1
        assert result[1]["skill_name"] == "Translate"

    @pytest.mark.asyncio
    async def test_respects_limit(self):
        # Create executions for 3 skills
        executions = [
            {"skill_id": f"s{i}", "status": "completed", "tokens_used": 10,
             "cost_cents": 1, "duration_ms": 100, "skills": {"name": f"Skill{i}"}}
            for i in range(3)
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_skill(client, limit=2)
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_skips_entries_without_skill_id(self):
        executions = [
            {"skill_id": None, "status": "completed", "tokens_used": 10,
             "cost_cents": 1, "duration_ms": 100, "skills": None},
            {"skill_id": "s1", "status": "completed", "tokens_used": 50,
             "cost_cents": 3, "duration_ms": 200, "skills": {"name": "Valid"}},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_skill(client)
        assert len(result) == 1
        assert result[0]["skill_id"] == "s1"


class TestGetStatsByPeriod:
    """Tests for server/app/services/executions.get_stats_by_period."""

    @pytest.mark.asyncio
    async def test_empty_data(self):
        client, _, _ = mock_supabase_query(data=[])

        result = await get_stats_by_period(client)
        assert result == []

    @pytest.mark.asyncio
    async def test_groups_by_day(self):
        executions = [
            {"executed_at": "2025-01-15T10:00:00+00:00", "status": "completed",
             "tokens_used": 100, "cost_cents": 5},
            {"executed_at": "2025-01-15T14:00:00+00:00", "status": "failed",
             "tokens_used": 50, "cost_cents": 2},
            {"executed_at": "2025-01-16T08:00:00+00:00", "status": "completed",
             "tokens_used": 200, "cost_cents": 10},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_period(client, granularity="day")

        assert len(result) == 2
        # Sorted by period
        assert result[0]["period"] == "2025-01-15"
        assert result[0]["total_executions"] == 2
        assert result[0]["successful"] == 1
        assert result[0]["failed"] == 1
        assert result[1]["period"] == "2025-01-16"
        assert result[1]["total_executions"] == 1

    @pytest.mark.asyncio
    async def test_groups_by_month(self):
        executions = [
            {"executed_at": "2025-01-05T10:00:00Z", "status": "completed",
             "tokens_used": 100, "cost_cents": 5},
            {"executed_at": "2025-02-10T10:00:00Z", "status": "completed",
             "tokens_used": 200, "cost_cents": 10},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_period(client, granularity="month")

        assert len(result) == 2
        assert result[0]["period"] == "2025-01"
        assert result[1]["period"] == "2025-02"

    @pytest.mark.asyncio
    async def test_groups_by_week(self):
        # Two dates in the same ISO week
        executions = [
            {"executed_at": "2025-01-13T10:00:00+00:00", "status": "completed",
             "tokens_used": 100, "cost_cents": 5},
            {"executed_at": "2025-01-14T10:00:00+00:00", "status": "failed",
             "tokens_used": 50, "cost_cents": 2},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_period(client, granularity="week")

        # Both should be in the same week
        assert len(result) == 1
        assert result[0]["total_executions"] == 2

    @pytest.mark.asyncio
    async def test_skips_entries_with_empty_executed_at(self):
        executions = [
            {"executed_at": "", "status": "completed",
             "tokens_used": 100, "cost_cents": 5},
            {"executed_at": "2025-01-15T10:00:00+00:00", "status": "completed",
             "tokens_used": 200, "cost_cents": 10},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_period(client, granularity="day")
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_results_sorted_by_period(self):
        executions = [
            {"executed_at": "2025-01-20T10:00:00+00:00", "status": "completed",
             "tokens_used": 50, "cost_cents": 2},
            {"executed_at": "2025-01-10T10:00:00+00:00", "status": "completed",
             "tokens_used": 100, "cost_cents": 5},
        ]
        client, _, _ = mock_supabase_query(data=executions)

        result = await get_stats_by_period(client, granularity="day")

        assert result[0]["period"] < result[1]["period"]


# ===========================================================================
# 6. Observability Middleware
# ===========================================================================


class TestObservabilityMiddleware:
    """Integration tests for the observability middleware using FastAPI TestClient."""

    @pytest.fixture
    def app(self):
        """Create a minimal FastAPI app with the middleware."""
        app = FastAPI()
        app.add_middleware(ObservabilityMiddleware)

        @app.get("/test")
        async def test_endpoint():
            return {"status": "ok"}

        @app.get("/health")
        async def health_endpoint():
            return {"status": "healthy"}

        @app.get("/docs")
        async def docs_endpoint():
            return {"docs": True}

        return app

    @pytest.fixture
    def client(self, app):
        return TestClient(app)

    def test_request_id_added_to_response(self, client):
        """X-Request-ID header is present in response."""
        response = client.get("/test")
        assert "X-Request-ID" in response.headers
        assert len(response.headers["X-Request-ID"]) > 0

    def test_custom_request_id_echoed_back(self, client):
        """Custom X-Request-ID from request is echoed in response."""
        custom_id = "my-trace-id-123"
        response = client.get("/test", headers={"X-Request-ID": custom_id})
        assert response.headers["X-Request-ID"] == custom_id

    def test_process_time_header_format(self, client):
        """X-Process-Time header matches 'Xms' format."""
        response = client.get("/test")
        process_time = response.headers.get("X-Process-Time", "")
        assert re.match(r"^\d+ms$", process_time), f"Expected format 'Xms', got '{process_time}'"

    def test_health_path_not_logged(self, client, caplog):
        """Health path requests should not produce INFO/WARNING logs."""
        with caplog.at_level(logging.INFO, logger="kijko.http"):
            response = client.get("/health")

        assert response.status_code == 200
        # No log records should be emitted for /health
        http_logs = [r for r in caplog.records if r.name == "kijko.http"]
        assert len(http_logs) == 0

    def test_docs_path_not_logged(self, client, caplog):
        """Docs path requests should not produce logs."""
        with caplog.at_level(logging.INFO, logger="kijko.http"):
            response = client.get("/docs")

        assert response.status_code == 200
        http_logs = [r for r in caplog.records if r.name == "kijko.http"]
        assert len(http_logs) == 0

    def test_normal_path_is_logged(self, client, caplog):
        """Normal endpoints produce log entries."""
        with caplog.at_level(logging.INFO, logger="kijko.http"):
            response = client.get("/test")

        assert response.status_code == 200
        http_logs = [r for r in caplog.records if r.name == "kijko.http"]
        assert len(http_logs) >= 1
        assert "/test" in http_logs[0].message


# ===========================================================================
# 7. Pydantic Model Validation
# ===========================================================================


class TestProjectCreateValidation:
    """Tests for ProjectCreate Pydantic model."""

    def test_valid_project(self):
        p = ProjectCreate(name="My Project")
        assert p.name == "My Project"
        assert p.type == ProjectType.REPOSITORY  # default
        assert p.privacy == ProjectPrivacy.PRIVATE  # default
        assert p.chunking_strategy == ChunkingStrategy.SEMANTIC  # default
        assert p.include_metadata is True
        assert p.anonymize_secrets is True

    def test_name_min_length(self):
        with pytest.raises(ValidationError) as exc_info:
            ProjectCreate(name="ab")
        errors = exc_info.value.errors()
        assert any("min_length" in str(e) or "too_short" in str(e) or "string_too_short" in str(e)
                    for e in errors)

    def test_name_max_length(self):
        with pytest.raises(ValidationError) as exc_info:
            ProjectCreate(name="x" * 51)
        errors = exc_info.value.errors()
        assert any("max_length" in str(e) or "too_long" in str(e) or "string_too_long" in str(e)
                    for e in errors)

    def test_name_exact_min_boundary(self):
        p = ProjectCreate(name="abc")  # exactly 3 chars
        assert p.name == "abc"

    def test_name_exact_max_boundary(self):
        p = ProjectCreate(name="x" * 50)  # exactly 50 chars
        assert p.name == "x" * 50

    def test_custom_type(self):
        p = ProjectCreate(name="My Files", type=ProjectType.FILES)
        assert p.type == ProjectType.FILES

    def test_invalid_type(self):
        with pytest.raises(ValidationError):
            ProjectCreate(name="Bad Type", type="nonexistent")

    def test_custom_settings_optional(self):
        p = ProjectCreate(name="With Settings", custom_settings={"key": "val"})
        assert p.custom_settings == {"key": "val"}


class TestRepositoryCreateValidation:
    """Tests for RepositoryCreate Pydantic model."""

    def test_valid_repository(self):
        r = RepositoryCreate(
            provider=GitProvider.GITHUB,
            repository_url="https://github.com/owner/repo",
            repository_name="owner/repo",
        )
        assert r.provider == GitProvider.GITHUB
        assert r.branch == "main"  # default

    def test_url_must_start_with_http(self):
        with pytest.raises(ValidationError) as exc_info:
            RepositoryCreate(
                provider=GitProvider.GITHUB,
                repository_url="ftp://github.com/owner/repo",
                repository_name="owner/repo",
            )
        errors = exc_info.value.errors()
        assert any("pattern" in str(e) or "string_pattern_mismatch" in str(e)
                    for e in errors)

    def test_url_accepts_http(self):
        r = RepositoryCreate(
            provider=GitProvider.GITLAB,
            repository_url="http://gitlab.com/owner/repo",
            repository_name="owner/repo",
        )
        assert r.repository_url.startswith("http://")

    def test_invalid_provider(self):
        with pytest.raises(ValidationError):
            RepositoryCreate(
                provider="svn",
                repository_url="https://svnhost.com/repo",
                repository_name="repo",
            )

    def test_all_providers_accepted(self):
        for provider in GitProvider:
            r = RepositoryCreate(
                provider=provider,
                repository_url="https://example.com/owner/repo",
                repository_name="owner/repo",
            )
            assert r.provider == provider


class TestMemberCreateValidation:
    """Tests for MemberCreate Pydantic model."""

    def test_valid_member(self):
        m = MemberCreate(email="user@example.com")
        assert m.email == "user@example.com"
        assert m.role == ProjectMemberRole.VIEWER  # default

    def test_valid_member_with_role(self):
        m = MemberCreate(email="admin@example.com", role=ProjectMemberRole.ADMIN)
        assert m.role == ProjectMemberRole.ADMIN

    def test_invalid_email_no_at(self):
        with pytest.raises(ValidationError):
            MemberCreate(email="invalid-email")

    def test_invalid_email_no_domain(self):
        with pytest.raises(ValidationError):
            MemberCreate(email="user@")

    def test_invalid_email_no_tld(self):
        with pytest.raises(ValidationError):
            MemberCreate(email="user@domain")

    def test_email_with_subdomain(self):
        m = MemberCreate(email="user@sub.domain.com")
        assert m.email == "user@sub.domain.com"


class TestReflexCreateValidation:
    """Tests for ReflexCreate Pydantic model."""

    def test_valid_reflex(self):
        r = ReflexCreate(
            skill_id=uuid4(),
            trigger_type=ReflexTriggerType.WEBHOOK,
            trigger_config={"url": "/hook"},
        )
        assert r.trigger_type == ReflexTriggerType.WEBHOOK

    def test_all_trigger_types(self):
        for tt in ReflexTriggerType:
            r = ReflexCreate(
                skill_id=uuid4(),
                trigger_type=tt,
                trigger_config={},
            )
            assert r.trigger_type == tt

    def test_invalid_trigger_type(self):
        with pytest.raises(ValidationError):
            ReflexCreate(
                skill_id=uuid4(),
                trigger_type="invalid_trigger",
                trigger_config={},
            )

    def test_conditions_optional(self):
        r = ReflexCreate(
            skill_id=uuid4(),
            trigger_type=ReflexTriggerType.EVENT,
            trigger_config={},
        )
        assert r.conditions is None

    def test_conditions_dict(self):
        r = ReflexCreate(
            skill_id=uuid4(),
            trigger_type=ReflexTriggerType.EVENT,
            trigger_config={},
            conditions={"branch": "main"},
        )
        assert r.conditions == {"branch": "main"}


class TestBulkInviteRequestValidation:
    """Tests for BulkInviteRequest Pydantic model."""

    def test_valid_single_email(self):
        b = BulkInviteRequest(emails=["user@example.com"])
        assert len(b.emails) == 1

    def test_valid_multiple_emails(self):
        b = BulkInviteRequest(emails=["a@b.com", "c@d.com", "e@f.com"])
        assert len(b.emails) == 3

    def test_empty_emails_list_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            BulkInviteRequest(emails=[])
        errors = exc_info.value.errors()
        assert any("min_length" in str(e) or "too_short" in str(e) for e in errors)

    def test_default_role(self):
        b = BulkInviteRequest(emails=["a@b.com"])
        assert b.role == ProjectMemberRole.VIEWER

    def test_custom_role(self):
        b = BulkInviteRequest(emails=["a@b.com"], role=ProjectMemberRole.ADMIN)
        assert b.role == ProjectMemberRole.ADMIN
