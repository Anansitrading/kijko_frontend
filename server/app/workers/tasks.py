"""Celery tasks for skill execution, habit scheduling, and reflex triggering.

All tasks use SECURITY DEFINER database functions to bypass RLS,
since background workers don't have a user session context.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


def _get_supabase_client():
    """Get a fresh Supabase client for worker context.

    Workers use service_role key (full access), not user-scoped tokens.
    """
    from supabase import create_client
    from server.app.config import settings

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def _call_llm(skill_config: dict, input_data: dict) -> dict:
    """Call the LLM API (Gemini/Claude) with skill configuration.

    Args:
        skill_config: Skill with prompt_template, model, parameters
        input_data: User-provided input variables

    Returns:
        Dict with output, tokens_used, prompt_tokens, completion_tokens, duration_ms
    """
    import httpx

    model = skill_config.get("model", "claude-3-5-sonnet-20241022")
    prompt_template = skill_config.get("prompt_template", "")
    parameters = skill_config.get("parameters", {})

    # Render prompt template with input variables
    prompt = prompt_template
    for key, value in (input_data or {}).items():
        prompt = prompt.replace(f"{{{{{key}}}}}", str(value))

    start = time.monotonic()

    # Route to appropriate LLM API based on model name
    if model.startswith("gemini"):
        result = await _call_gemini(model, prompt, parameters)
    else:
        result = await _call_anthropic(model, prompt, parameters)

    result["duration_ms"] = int((time.monotonic() - start) * 1000)
    return result


async def _call_anthropic(model: str, prompt: str, parameters: dict) -> dict:
    """Call Anthropic Claude API."""
    import httpx
    import os

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": parameters.get("max_tokens", 4096),
                "temperature": parameters.get("temperature", 1),
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()

        output_text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                output_text += block.get("text", "")

        usage = data.get("usage", {})
        return {
            "output": output_text,
            "tokens_used": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
        }


async def _call_gemini(model: str, prompt: str, parameters: dict) -> dict:
    """Call Google Gemini API."""
    import httpx
    import os

    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": api_key},
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": parameters.get("temperature", 1),
                    "maxOutputTokens": parameters.get("max_tokens", 4096),
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()

        candidates = data.get("candidates", [])
        output_text = ""
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            output_text = "".join(p.get("text", "") for p in parts)

        usage = data.get("usageMetadata", {})
        prompt_tokens = usage.get("promptTokenCount", 0)
        completion_tokens = usage.get("candidatesTokenCount", 0)
        return {
            "output": output_text,
            "tokens_used": prompt_tokens + completion_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }


# =============================================================================
# Celery Tasks
# =============================================================================

@shared_task(
    bind=True,
    name="server.app.workers.tasks.execute_skill_task",
    max_retries=2,
    default_retry_delay=30,
)
def execute_skill_task(
    self,
    skill_id: str,
    user_id: str,
    input_data: dict | None = None,
    execution_type: str = "manual",
    reference_id: str | None = None,
):
    """Execute a skill asynchronously.

    Fetches skill config via SECURITY DEFINER function,
    calls LLM, and records the result.
    """
    async def _run():
        from server.app.services.database import (
            system_get_skill,
            system_record_execution,
        )

        client = _get_supabase_client()

        # 1. Fetch skill config (bypasses RLS)
        skill = await system_get_skill(client, skill_id)
        if not skill:
            logger.error("Skill %s not found or inactive", skill_id)
            await system_record_execution(
                client, skill_id=skill_id, user_id=user_id,
                execution_type=execution_type, reference_id=reference_id,
                status="failed", error_message="Skill not found or inactive",
                error_code="SKILL_NOT_FOUND",
            )
            return {"status": "failed", "error": "Skill not found"}

        # 2. Execute via LLM
        try:
            result = await _call_llm(skill, input_data or {})
        except Exception as exc:
            logger.exception("LLM call failed for skill %s", skill_id)
            # Record failure
            await system_record_execution(
                client, skill_id=skill_id, user_id=user_id,
                execution_type=execution_type, reference_id=reference_id,
                status="failed", error_message=str(exc),
                error_code="LLM_ERROR",
            )
            # Retry on transient errors
            raise self.retry(exc=exc)

        # 3. Record success
        execution_id = await system_record_execution(
            client,
            skill_id=skill_id,
            user_id=user_id,
            execution_type=execution_type,
            reference_id=reference_id,
            input_data=input_data,
            output=result.get("output"),
            tokens_used=result.get("tokens_used"),
            prompt_tokens=result.get("prompt_tokens"),
            completion_tokens=result.get("completion_tokens"),
            duration_ms=result.get("duration_ms"),
            status="completed",
        )

        logger.info(
            "Skill %s executed successfully. Execution: %s, Tokens: %s",
            skill_id, execution_id, result.get("tokens_used"),
        )

        return {
            "status": "completed",
            "execution_id": execution_id,
            "tokens_used": result.get("tokens_used"),
            "duration_ms": result.get("duration_ms"),
        }

    return asyncio.run(_run())


@shared_task(
    bind=True,
    name="server.app.workers.tasks.process_habit_task",
    max_retries=2,
    default_retry_delay=60,
)
def process_habit_task(self, habit_id: str):
    """Process a scheduled habit execution.

    Fetches habit config, executes the linked skill,
    and updates habit run metadata.
    """
    async def _run():
        from server.app.services.database import (
            system_get_skill,
            system_update_habit_run,
        )

        client = _get_supabase_client()

        # 1. Get habit details
        result = client.table("habits").select(
            "*, skills(id, name, prompt_template, model, parameters)",
        ).eq("id", habit_id).single().execute()
        habit = result.data

        if not habit:
            logger.error("Habit %s not found", habit_id)
            return {"status": "failed", "error": "Habit not found"}

        if not habit.get("is_active"):
            logger.info("Habit %s is inactive, skipping", habit_id)
            return {"status": "skipped", "reason": "inactive"}

        skill_id = habit.get("skill_id")
        user_id = habit.get("user_id")
        skill_config = habit.get("skills") or {}

        if not skill_config:
            # Fallback: fetch via SECURITY DEFINER
            skill_config = await system_get_skill(client, skill_id) or {}

        # 2. Execute the linked skill
        try:
            llm_result = await _call_llm(skill_config, habit.get("config", {}))
        except Exception as exc:
            logger.exception("Habit %s skill execution failed", habit_id)
            # Calculate next run and record failure
            next_run = _calculate_next_run(
                habit.get("schedule_cron", ""),
                habit.get("timezone", "UTC"),
            )
            await system_update_habit_run(
                client, habit_id, next_run_at=next_run, error_message=str(exc),
            )
            raise self.retry(exc=exc)

        # 3. Record execution via SECURITY DEFINER
        from server.app.services.database import system_record_execution

        await system_record_execution(
            client,
            skill_id=skill_id,
            user_id=user_id,
            execution_type="habit",
            reference_id=habit_id,
            input_data=habit.get("config"),
            output=llm_result.get("output"),
            tokens_used=llm_result.get("tokens_used"),
            prompt_tokens=llm_result.get("prompt_tokens"),
            completion_tokens=llm_result.get("completion_tokens"),
            duration_ms=llm_result.get("duration_ms"),
            status="completed",
        )

        # 4. Update habit metadata (next_run_at, run_count, clear errors)
        next_run = _calculate_next_run(
            habit.get("schedule_cron", ""),
            habit.get("timezone", "UTC"),
        )
        await system_update_habit_run(
            client, habit_id, next_run_at=next_run, error_message=None,
        )

        logger.info("Habit %s executed successfully. Next run: %s", habit_id, next_run)
        return {"status": "completed", "next_run_at": next_run}

    return asyncio.run(_run())


@shared_task(
    bind=True,
    name="server.app.workers.tasks.process_reflex_task",
    max_retries=1,
    default_retry_delay=30,
)
def process_reflex_task(self, reflex_id: str, trigger_data: dict):
    """Process a triggered reflex.

    Evaluates conditions against trigger data and executes
    the linked skill if conditions are met.
    """
    async def _run():
        from server.app.services.database import system_get_skill, system_record_execution

        client = _get_supabase_client()

        # 1. Get reflex details
        result = client.table("reflexes").select("*").eq("id", reflex_id).single().execute()
        reflex = result.data

        if not reflex:
            logger.error("Reflex %s not found", reflex_id)
            return {"status": "failed", "error": "Reflex not found"}

        if not reflex.get("is_active"):
            logger.info("Reflex %s is inactive, skipping", reflex_id)
            return {"status": "skipped", "reason": "inactive"}

        # 2. Evaluate conditions
        conditions = reflex.get("conditions") or {}
        if conditions:
            for key, expected in conditions.items():
                actual = trigger_data.get(key)
                if actual != expected:
                    logger.info(
                        "Reflex %s conditions not met: %s=%s (expected %s)",
                        reflex_id, key, actual, expected,
                    )
                    # Update trigger count but don't execute
                    client.table("reflexes").update({
                        "trigger_count": (reflex.get("trigger_count", 0) + 1),
                    }).eq("id", reflex_id).execute()
                    return {"status": "skipped", "reason": "conditions_not_met"}

        skill_id = reflex.get("skill_id")
        user_id = reflex.get("user_id")

        # 3. Fetch skill and execute
        skill_config = await system_get_skill(client, skill_id)
        if not skill_config:
            logger.error("Reflex %s: linked skill %s not found", reflex_id, skill_id)
            return {"status": "failed", "error": "Linked skill not found"}

        try:
            llm_result = await _call_llm(skill_config, trigger_data)
        except Exception as exc:
            logger.exception("Reflex %s execution failed", reflex_id)
            # Record failure on reflex
            client.table("reflexes").update({
                "trigger_count": (reflex.get("trigger_count", 0) + 1),
                "consecutive_failures": (reflex.get("consecutive_failures", 0) + 1),
                "last_error_message": str(exc)[:500],
                "last_triggered_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", reflex_id).execute()
            raise self.retry(exc=exc)

        # 4. Record execution
        await system_record_execution(
            client,
            skill_id=skill_id,
            user_id=user_id,
            execution_type="reflex",
            reference_id=reflex_id,
            input_data=trigger_data,
            output=llm_result.get("output"),
            tokens_used=llm_result.get("tokens_used"),
            prompt_tokens=llm_result.get("prompt_tokens"),
            completion_tokens=llm_result.get("completion_tokens"),
            duration_ms=llm_result.get("duration_ms"),
            status="completed",
        )

        # 5. Update reflex metadata
        client.table("reflexes").update({
            "trigger_count": (reflex.get("trigger_count", 0) + 1),
            "consecutive_failures": 0,
            "last_triggered_at": datetime.now(timezone.utc).isoformat(),
            "last_error_message": None,
        }).eq("id", reflex_id).execute()

        logger.info("Reflex %s triggered and executed successfully", reflex_id)
        return {"status": "completed", "tokens_used": llm_result.get("tokens_used")}

    return asyncio.run(_run())


@shared_task(name="server.app.workers.tasks.check_due_habits_task")
def check_due_habits_task():
    """Check for habits due for execution and dispatch them.

    Runs periodically via Celery Beat (every 5 minutes).
    Uses SECURITY DEFINER function to find due habits.
    """
    async def _run():
        from server.app.services.database import system_get_due_habits

        client = _get_supabase_client()
        due_habits = await system_get_due_habits(client)

        if not due_habits:
            logger.debug("No habits due for execution")
            return {"dispatched": 0}

        dispatched = 0
        for habit in due_habits:
            habit_id = habit.get("id")
            if habit_id:
                process_habit_task.delay(str(habit_id))
                dispatched += 1

        logger.info("Dispatched %d habit(s) for execution", dispatched)
        return {"dispatched": dispatched}

    return asyncio.run(_run())


@shared_task(name="server.app.workers.tasks.cleanup_old_executions_task")
def cleanup_old_executions_task(days: int = 90):
    """Clean up execution records older than N days.

    Runs daily via Celery Beat. Keeps the execution table from growing unbounded.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    client = _get_supabase_client()
    result = client.table("skill_executions").delete().lt("executed_at", cutoff).execute()
    deleted_count = len(result.data) if result.data else 0

    logger.info("Cleaned up %d execution(s) older than %d days", deleted_count, days)
    return {"deleted": deleted_count, "cutoff": cutoff}


# =============================================================================
# Helpers
# =============================================================================

def _calculate_next_run(cron_expression: str, tz: str = "UTC") -> str:
    """Calculate the next run time from a cron expression.

    Returns ISO 8601 string.
    """
    try:
        from croniter import croniter
        cron = croniter(cron_expression, datetime.now(timezone.utc))
        next_dt = cron.get_next(datetime)
        return next_dt.isoformat()
    except Exception:
        # Fallback: next run in 1 hour if croniter fails
        return (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
