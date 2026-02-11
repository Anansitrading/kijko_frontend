"""Tests for Celery worker tasks — mock LLM calls and DB operations."""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for worker tasks."""
    client = MagicMock()

    # Mock table operations
    table_mock = MagicMock()
    table_mock.select.return_value = table_mock
    table_mock.eq.return_value = table_mock
    table_mock.single.return_value = table_mock
    table_mock.delete.return_value = table_mock
    table_mock.update.return_value = table_mock
    table_mock.lt.return_value = table_mock
    table_mock.execute.return_value = MagicMock(data=[], count=0)

    client.table.return_value = table_mock
    return client


@pytest.fixture
def mock_llm_result():
    """Standard mock LLM result."""
    return {
        "output": "Generated response text",
        "tokens_used": 250,
        "prompt_tokens": 100,
        "completion_tokens": 150,
        "duration_ms": 1500,
    }


@pytest.fixture
def sample_skill():
    """Sample skill configuration."""
    return {
        "id": "skill-001",
        "name": "Test Skill",
        "prompt_template": "Generate a summary of {{topic}}",
        "model": "claude-3-5-sonnet-20241022",
        "parameters": {"temperature": 0.7, "max_tokens": 2048},
        "is_active": True,
    }


@pytest.fixture
def sample_habit():
    """Sample habit configuration."""
    return {
        "id": "habit-001",
        "skill_id": "skill-001",
        "user_id": "user-001",
        "schedule_cron": "0 9 * * 1-5",
        "timezone": "UTC",
        "is_active": True,
        "config": {"topic": "daily news"},
        "run_count": 5,
        "consecutive_failures": 0,
        "skills": {
            "id": "skill-001",
            "name": "Test Skill",
            "prompt_template": "Generate a summary of {{topic}}",
            "model": "claude-3-5-sonnet-20241022",
            "parameters": {"temperature": 0.7, "max_tokens": 2048},
        },
    }


@pytest.fixture
def sample_reflex():
    """Sample reflex configuration."""
    return {
        "id": "reflex-001",
        "skill_id": "skill-001",
        "user_id": "user-001",
        "trigger_type": "webhook",
        "trigger_config": {"secret": "test-secret"},
        "conditions": {"event_type": "push"},
        "is_active": True,
        "trigger_count": 10,
        "consecutive_failures": 0,
    }


# =============================================================================
# Test execute_skill_task
# =============================================================================

class TestExecuteSkillTask:
    """Tests for the skill execution task."""

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.workers.tasks._call_llm", new_callable=AsyncMock)
    @patch("server.app.services.database.system_get_skill", new_callable=AsyncMock)
    @patch("server.app.services.database.system_record_execution", new_callable=AsyncMock)
    def test_successful_execution(
        self, mock_record, mock_get_skill, mock_llm, mock_client,
        mock_supabase, sample_skill, mock_llm_result,
    ):
        """Test successful skill execution end-to-end."""
        mock_client.return_value = mock_supabase
        mock_get_skill.return_value = sample_skill
        mock_llm.return_value = mock_llm_result
        mock_record.return_value = "exec-id-001"

        from server.app.workers.tasks import execute_skill_task

        result = execute_skill_task(
            "skill-001", "user-001",
            input_data={"topic": "AI trends"},
            execution_type="manual",
        )

        assert result["status"] == "completed"
        assert result["execution_id"] == "exec-id-001"
        mock_get_skill.assert_called_once()
        mock_llm.assert_called_once()
        mock_record.assert_called_once()

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.services.database.system_get_skill", new_callable=AsyncMock)
    @patch("server.app.services.database.system_record_execution", new_callable=AsyncMock)
    def test_skill_not_found(
        self, mock_record, mock_get_skill, mock_client, mock_supabase,
    ):
        """Test handling when skill doesn't exist."""
        mock_client.return_value = mock_supabase
        mock_get_skill.return_value = None

        from server.app.workers.tasks import execute_skill_task

        result = execute_skill_task("nonexistent", "user-001")

        assert result["status"] == "failed"
        assert "not found" in result["error"]
        mock_record.assert_called_once()
        # Verify failure was recorded
        call_kwargs = mock_record.call_args
        assert call_kwargs[1].get("status") == "failed" or \
               (len(call_kwargs[0]) > 0 and "failed" in str(call_kwargs))


class TestProcessHabitTask:
    """Tests for the habit execution task."""

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.workers.tasks._call_llm", new_callable=AsyncMock)
    @patch("server.app.services.database.system_get_skill", new_callable=AsyncMock)
    @patch("server.app.services.database.system_record_execution", new_callable=AsyncMock)
    @patch("server.app.services.database.system_update_habit_run", new_callable=AsyncMock)
    def test_successful_habit_execution(
        self, mock_update, mock_record, mock_get_skill, mock_llm, mock_client,
        mock_supabase, sample_habit, mock_llm_result,
    ):
        """Test successful habit processing."""
        mock_client.return_value = mock_supabase

        # Mock the habits table query
        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.single.return_value = table_mock
        table_mock.execute.return_value = MagicMock(data=sample_habit)
        mock_supabase.table.return_value = table_mock

        mock_llm.return_value = mock_llm_result
        mock_record.return_value = "exec-id-002"

        from server.app.workers.tasks import process_habit_task

        result = process_habit_task("habit-001")

        assert result["status"] == "completed"
        assert "next_run_at" in result
        mock_llm.assert_called_once()
        mock_record.assert_called_once()
        mock_update.assert_called_once()

    @patch("server.app.workers.tasks._get_supabase_client")
    def test_inactive_habit_skipped(self, mock_client, mock_supabase):
        """Test that inactive habits are skipped."""
        mock_client.return_value = mock_supabase

        inactive_habit = {
            "id": "habit-001",
            "skill_id": "skill-001",
            "user_id": "user-001",
            "is_active": False,
        }

        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.single.return_value = table_mock
        table_mock.execute.return_value = MagicMock(data=inactive_habit)
        mock_supabase.table.return_value = table_mock

        from server.app.workers.tasks import process_habit_task

        result = process_habit_task("habit-001")

        assert result["status"] == "skipped"
        assert result["reason"] == "inactive"


class TestProcessReflexTask:
    """Tests for the reflex execution task."""

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.workers.tasks._call_llm", new_callable=AsyncMock)
    @patch("server.app.services.database.system_get_skill", new_callable=AsyncMock)
    @patch("server.app.services.database.system_record_execution", new_callable=AsyncMock)
    def test_successful_reflex_trigger(
        self, mock_record, mock_get_skill, mock_llm, mock_client,
        mock_supabase, sample_reflex, sample_skill, mock_llm_result,
    ):
        """Test successful reflex processing with matching conditions."""
        mock_client.return_value = mock_supabase

        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.single.return_value = table_mock
        table_mock.update.return_value = table_mock
        table_mock.execute.return_value = MagicMock(data=sample_reflex)
        mock_supabase.table.return_value = table_mock

        mock_get_skill.return_value = sample_skill
        mock_llm.return_value = mock_llm_result

        from server.app.workers.tasks import process_reflex_task

        trigger_data = {"event_type": "push", "repo": "test-repo"}
        result = process_reflex_task("reflex-001", trigger_data)

        assert result["status"] == "completed"
        mock_llm.assert_called_once()
        mock_record.assert_called_once()

    @patch("server.app.workers.tasks._get_supabase_client")
    def test_conditions_not_met(self, mock_client, mock_supabase, sample_reflex):
        """Test reflex skipped when conditions don't match."""
        mock_client.return_value = mock_supabase

        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.single.return_value = table_mock
        table_mock.update.return_value = table_mock
        table_mock.execute.return_value = MagicMock(data=sample_reflex)
        mock_supabase.table.return_value = table_mock

        from server.app.workers.tasks import process_reflex_task

        trigger_data = {"event_type": "pull_request"}  # Doesn't match "push"
        result = process_reflex_task("reflex-001", trigger_data)

        assert result["status"] == "skipped"
        assert result["reason"] == "conditions_not_met"

    @patch("server.app.workers.tasks._get_supabase_client")
    def test_inactive_reflex_skipped(self, mock_client, mock_supabase):
        """Test that inactive reflexes are skipped."""
        mock_client.return_value = mock_supabase

        inactive_reflex = {
            "id": "reflex-001",
            "skill_id": "skill-001",
            "user_id": "user-001",
            "is_active": False,
        }

        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.single.return_value = table_mock
        table_mock.execute.return_value = MagicMock(data=inactive_reflex)
        mock_supabase.table.return_value = table_mock

        from server.app.workers.tasks import process_reflex_task

        result = process_reflex_task("reflex-001", {"event": "test"})

        assert result["status"] == "skipped"


class TestCleanupTask:
    """Tests for the cleanup task."""

    @patch("server.app.workers.tasks._get_supabase_client")
    def test_cleanup_executions(self, mock_client, mock_supabase):
        """Test old execution cleanup."""
        mock_client.return_value = mock_supabase

        # Mock 5 deleted records
        table_mock = MagicMock()
        table_mock.delete.return_value = table_mock
        table_mock.lt.return_value = table_mock
        table_mock.execute.return_value = MagicMock(
            data=[{"id": f"exec-{i}"} for i in range(5)],
        )
        mock_supabase.table.return_value = table_mock

        from server.app.workers.tasks import cleanup_old_executions_task

        result = cleanup_old_executions_task(days=90)

        assert result["deleted"] == 5
        assert "cutoff" in result


class TestCheckDueHabitsTask:
    """Tests for the periodic habit checker."""

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.services.database.system_get_due_habits", new_callable=AsyncMock)
    @patch("server.app.workers.tasks.process_habit_task")
    def test_dispatches_due_habits(
        self, mock_process, mock_due, mock_client, mock_supabase,
    ):
        """Test that due habits are dispatched for execution."""
        mock_client.return_value = mock_supabase
        mock_due.return_value = [
            {"id": "habit-001"},
            {"id": "habit-002"},
            {"id": "habit-003"},
        ]

        from server.app.workers.tasks import check_due_habits_task

        result = check_due_habits_task()

        assert result["dispatched"] == 3
        assert mock_process.delay.call_count == 3

    @patch("server.app.workers.tasks._get_supabase_client")
    @patch("server.app.services.database.system_get_due_habits", new_callable=AsyncMock)
    def test_no_due_habits(self, mock_due, mock_client, mock_supabase):
        """Test when no habits are due."""
        mock_client.return_value = mock_supabase
        mock_due.return_value = []

        from server.app.workers.tasks import check_due_habits_task

        result = check_due_habits_task()

        assert result["dispatched"] == 0


class TestHelpers:
    """Tests for helper functions."""

    def test_calculate_next_run_with_croniter(self):
        """Test cron next-run calculation."""
        from server.app.workers.tasks import _calculate_next_run

        result = _calculate_next_run("0 9 * * 1-5")
        # Should return an ISO timestamp
        assert "T" in result
        # Should be parseable
        dt = datetime.fromisoformat(result)
        assert dt > datetime.now(timezone.utc)

    def test_calculate_next_run_fallback(self):
        """Test fallback when cron expression is invalid."""
        from server.app.workers.tasks import _calculate_next_run

        result = _calculate_next_run("invalid")
        # Should still return an ISO timestamp (1 hour from now)
        assert "T" in result
