# Plan 01-03 Summary: RLS Policies & Multi-Tenant Isolation

## Status: COMPLETE (policies + tests) / DEPLOYMENT DEFERRED

## What Was Done

### Task 1: RLS Policies Migration — COMPLETE (file ready, deploy deferred)

**Created `database/004_rls_policies.sql`** — comprehensive RLS migration:

| Component | Count | Details |
|-----------|-------|---------|
| Auth helper functions | 2 | `auth.current_org_id()`, `auth.current_user_id()` — dual source: session var + JWT claims |
| Project table policies | 17 | SELECT/INSERT/UPDATE/DELETE on projects, repos, members, ingestion, files |
| Skill table policies | 14 | SELECT/INSERT/UPDATE/DELETE on skills, habits, reflexes, executions |
| SECURITY DEFINER funcs | 5 | admin_list_all_projects, system_get_skill_for_execution, system_record_execution, system_get_due_habits, system_update_habit_run |
| FORCE RLS statements | 9 | All tables forced — even table owner must satisfy policies |
| Policy drops | 14 | Replace auth.uid()-based policies from migration 002 |

**Key design decisions:**
1. **Dual auth context** — Supports both Keycloak JWT (`request.jwt.claims`) AND Python session vars (`app.current_*`). The FastAPI backend sets session vars; direct PostgREST uses JWT.
2. **Org-scoped vs user-scoped** — Project tables use `organization_id`, skill tables use `user_id`. This matches the domain model exactly.
3. **SECURITY DEFINER for background workers** — Celery workers don't have user sessions. They call DB functions that bypass RLS with explicit `SET search_path = public`.
4. **FORCE ROW LEVEL SECURITY** — Even the table owner (postgres role) must satisfy RLS. Only SECURITY DEFINER functions bypass it.
5. **Immutable execution history** — No UPDATE or DELETE policies on `skill_executions` — audit trail integrity.

### Task 2: Database Service + Test Suite — COMPLETE

**Enhanced `server/app/services/database.py`:**
- `clear_rls_context()` — clears session vars after request (connection pool safety)
- Python wrappers for all 5 SECURITY DEFINER functions
- `build_filtered_query()` — adds filter dict support for dynamic queries

**Created `server/tests/test_rls.py` (13 tests):**
- `TestProjectsRLS` (5 tests): org isolation, visibility, update/delete protection, service role bypass
- `TestSkillsRLS` (4 tests): user isolation, visibility, update/delete protection
- `TestHabitsRLS` (2 tests): user isolation via skill ownership
- `TestExecuteWithRLS` (2 tests): wrapper scoping correctness, context cleanup

Tests auto-skip when `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` not configured.

## Deviations
1. **SQL deployment deferred** — Supabase credentials still unavailable. Migration file ready.
2. **Replaced migration 002 policies** — Had to DROP+CREATE because 002 used `auth.uid()` (Supabase-only), replaced with `auth.current_user_id()` (Keycloak-compatible).
3. **Added `build_filtered_query()`** — Not in plan but useful for CRUD endpoints.

## Commit
`f205eab` — feat(01-03): add RLS policies, SECURITY DEFINER functions, and isolation tests
