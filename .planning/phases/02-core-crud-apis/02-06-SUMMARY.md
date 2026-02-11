# Plan 02-06 Summary: Celery Background Workers

## Status: COMPLETE

## What was built
- `server/app/workers/celery_app.py` — Celery instance:
  - Redis broker/backend from settings
  - Task routing: skills, habits, reflexes, maintenance queues
  - Beat schedule: check_due_habits (5min), cleanup (daily 3AM UTC)
  - Safety: 5min hard limit, 4min soft limit, late ack, prefetch=1

- `server/app/workers/tasks.py` — 5 background tasks:
  - `execute_skill_task`: Fetches skill via SECURITY DEFINER, calls Anthropic/Gemini API, records result
  - `process_habit_task`: Loads habit+skill, executes LLM, updates next_run_at via croniter
  - `process_reflex_task`: Evaluates conditions, executes if matched, updates trigger metadata
  - `check_due_habits_task`: Periodic dispatcher using system_get_due_habits
  - `cleanup_old_executions_task`: Deletes execution records older than N days

- `server/tests/test_workers.py` — 12 tests:
  - TestExecuteSkillTask: success, skill not found
  - TestProcessHabitTask: success, inactive skip
  - TestProcessReflexTask: success, conditions not met, inactive skip
  - TestCleanupTask: cleanup verification
  - TestCheckDueHabitsTask: dispatches, empty
  - TestHelpers: cron calculation, fallback

## Key decisions
- All tasks use SECURITY DEFINER functions (no RLS user context in workers)
- Dual LLM support: Anthropic Claude + Google Gemini based on model prefix
- Async LLM calls wrapped in asyncio.run() for Celery compatibility
- Retry policy: 2 retries for skills/habits, 1 for reflexes, 30-60s delay
