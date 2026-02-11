-- =============================================================================
-- Migration: 004_rls_policies
-- Description: Comprehensive RLS policies for multi-tenant data isolation
-- Purpose: Ensure Org A cannot access Org B's data. Users scoped within org.
-- Sprint: Phase 1 — Foundation & Auth
-- =============================================================================

-- =============================================================================
-- Auth Helper Functions
-- These bridge between Keycloak JWT (external) and Supabase RLS.
-- Supabase sets `request.jwt.claims` from the JWT. Keycloak puts org_id in claims.
-- We also support app.current_* session vars set by the Python backend via
-- set_rls_context() for service-to-service calls.
-- =============================================================================

-- Create auth schema if not exists (Supabase has this, but be explicit)
CREATE SCHEMA IF NOT EXISTS auth;

-- Get current user's organization ID from JWT or session variable
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    -- First: check session variable (set by Python backend)
    NULLIF(current_setting('app.current_org_id', true), '')::UUID,
    -- Second: check JWT claims (set by Supabase from Keycloak token)
    (current_setting('request.jwt.claims', true)::json->>'org_id')::UUID
  )
$$;

-- Get current user's ID from JWT or session variable
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    -- First: check session variable
    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
    -- Second: Supabase auth.uid() (uses JWT sub claim)
    auth.uid()
  )
$$;

-- =============================================================================
-- PROJECT TABLES — Organization-scoped RLS
-- Tables: projects, project_repositories, project_members,
--         ingestion_progress, project_files
-- =============================================================================

-- Drop existing commented-out/placeholder policies if any
-- (Migration 001 had RLS enabled but policies commented out)

-- ---------------------------------------------------------------------------
-- projects — org-scoped with member access
-- ---------------------------------------------------------------------------
CREATE POLICY "org_select_projects" ON projects
  FOR SELECT USING (
    organization_id = auth.current_org_id()
  );

CREATE POLICY "org_insert_projects" ON projects
  FOR INSERT WITH CHECK (
    organization_id = auth.current_org_id()
    AND user_id = auth.current_user_id()
  );

CREATE POLICY "org_update_projects" ON projects
  FOR UPDATE USING (
    organization_id = auth.current_org_id()
    AND (
      user_id = auth.current_user_id()
      OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id()
        AND role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "org_delete_projects" ON projects
  FOR DELETE USING (
    organization_id = auth.current_org_id()
    AND user_id = auth.current_user_id()
  );

-- ---------------------------------------------------------------------------
-- project_repositories — scoped through project's organization
-- ---------------------------------------------------------------------------
CREATE POLICY "org_select_project_repositories" ON project_repositories
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_insert_project_repositories" ON project_repositories
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND (user_id = auth.current_user_id() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id() AND role IN ('admin', 'manager')
      ))
    )
  );

CREATE POLICY "org_update_project_repositories" ON project_repositories
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND (user_id = auth.current_user_id() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id() AND role IN ('admin', 'manager')
      ))
    )
  );

CREATE POLICY "org_delete_project_repositories" ON project_repositories
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND user_id = auth.current_user_id()
    )
  );

-- ---------------------------------------------------------------------------
-- project_members — scoped through project's organization
-- ---------------------------------------------------------------------------
CREATE POLICY "org_select_project_members" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_insert_project_members" ON project_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND (user_id = auth.current_user_id() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id() AND role IN ('admin', 'manager')
      ))
    )
  );

CREATE POLICY "org_update_project_members" ON project_members
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
    )
    AND (
      -- Can update own membership or be an admin/manager
      user_id = auth.current_user_id()
      OR project_id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id() AND role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "org_delete_project_members" ON project_members
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND (user_id = auth.current_user_id() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.current_user_id() AND role = 'admin'
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- ingestion_progress — scoped through project's organization
-- ---------------------------------------------------------------------------
CREATE POLICY "org_select_ingestion_progress" ON ingestion_progress
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_insert_ingestion_progress" ON ingestion_progress
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_update_ingestion_progress" ON ingestion_progress
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

-- No delete policy for ingestion_progress — history should be retained

-- ---------------------------------------------------------------------------
-- project_files — scoped through project's organization
-- ---------------------------------------------------------------------------
CREATE POLICY "org_select_project_files" ON project_files
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_insert_project_files" ON project_files
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_update_project_files" ON project_files
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = auth.current_org_id()
    )
  );

CREATE POLICY "org_delete_project_files" ON project_files
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth.current_org_id()
      AND user_id = auth.current_user_id()
    )
  );


-- =============================================================================
-- SKILL TABLES — User-scoped within organization
-- Tables: skills, habits, reflexes, skill_executions
-- Note: Migration 002 already created policies using auth.uid(). We need to
-- DROP those and recreate using auth.current_user_id() which supports both
-- Keycloak JWT and session variable approaches.
-- =============================================================================

-- Drop existing policies from migration 002
DROP POLICY IF EXISTS "Users can view own skills" ON skills;
DROP POLICY IF EXISTS "Users can create own skills" ON skills;
DROP POLICY IF EXISTS "Users can update own skills" ON skills;
DROP POLICY IF EXISTS "Users can delete own skills" ON skills;

DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can create own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

DROP POLICY IF EXISTS "Users can view own reflexes" ON reflexes;
DROP POLICY IF EXISTS "Users can create own reflexes" ON reflexes;
DROP POLICY IF EXISTS "Users can update own reflexes" ON reflexes;
DROP POLICY IF EXISTS "Users can delete own reflexes" ON reflexes;

DROP POLICY IF EXISTS "Users can view own executions" ON skill_executions;
DROP POLICY IF EXISTS "Users can create own executions" ON skill_executions;

-- ---------------------------------------------------------------------------
-- skills — user-scoped
-- ---------------------------------------------------------------------------
CREATE POLICY "user_select_skills" ON skills
  FOR SELECT USING (user_id = auth.current_user_id());

CREATE POLICY "user_insert_skills" ON skills
  FOR INSERT WITH CHECK (user_id = auth.current_user_id());

CREATE POLICY "user_update_skills" ON skills
  FOR UPDATE USING (user_id = auth.current_user_id());

CREATE POLICY "user_delete_skills" ON skills
  FOR DELETE USING (user_id = auth.current_user_id());

-- ---------------------------------------------------------------------------
-- habits — user-scoped
-- ---------------------------------------------------------------------------
CREATE POLICY "user_select_habits" ON habits
  FOR SELECT USING (user_id = auth.current_user_id());

CREATE POLICY "user_insert_habits" ON habits
  FOR INSERT WITH CHECK (user_id = auth.current_user_id());

CREATE POLICY "user_update_habits" ON habits
  FOR UPDATE USING (user_id = auth.current_user_id());

CREATE POLICY "user_delete_habits" ON habits
  FOR DELETE USING (user_id = auth.current_user_id());

-- ---------------------------------------------------------------------------
-- reflexes — user-scoped
-- ---------------------------------------------------------------------------
CREATE POLICY "user_select_reflexes" ON reflexes
  FOR SELECT USING (user_id = auth.current_user_id());

CREATE POLICY "user_insert_reflexes" ON reflexes
  FOR INSERT WITH CHECK (user_id = auth.current_user_id());

CREATE POLICY "user_update_reflexes" ON reflexes
  FOR UPDATE USING (user_id = auth.current_user_id());

CREATE POLICY "user_delete_reflexes" ON reflexes
  FOR DELETE USING (user_id = auth.current_user_id());

-- ---------------------------------------------------------------------------
-- skill_executions — user-scoped (read-only after creation)
-- ---------------------------------------------------------------------------
CREATE POLICY "user_select_skill_executions" ON skill_executions
  FOR SELECT USING (user_id = auth.current_user_id());

CREATE POLICY "user_insert_skill_executions" ON skill_executions
  FOR INSERT WITH CHECK (user_id = auth.current_user_id());

-- No UPDATE or DELETE on skill_executions — immutable audit trail


-- =============================================================================
-- SECURITY DEFINER Functions
-- These bypass RLS for admin/system operations (e.g., background workers,
-- habit scheduler, analytics aggregation).
-- =============================================================================

-- Admin: List all projects across orgs (dashboard/superadmin)
CREATE OR REPLACE FUNCTION admin_list_all_projects(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  organization_id UUID,
  status project_status,
  created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.organization_id, p.status, p.created_at
  FROM projects p
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset
$$;

-- System: Execute a skill on behalf of the scheduler (habits)
-- Used by Celery worker that doesn't have a user session
CREATE OR REPLACE FUNCTION system_get_skill_for_execution(
  p_skill_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  prompt_template TEXT,
  model VARCHAR(100),
  parameters JSONB,
  input_schema JSONB,
  output_format skill_output_format
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.user_id, s.prompt_template, s.model,
         s.parameters, s.input_schema, s.output_format
  FROM skills s
  WHERE s.id = p_skill_id AND s.is_active = true
$$;

-- System: Record execution result from background worker
CREATE OR REPLACE FUNCTION system_record_execution(
  p_skill_id UUID,
  p_user_id UUID,
  p_execution_type execution_type,
  p_reference_id UUID DEFAULT NULL,
  p_input JSONB DEFAULT NULL,
  p_output TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_prompt_tokens INTEGER DEFAULT NULL,
  p_completion_tokens INTEGER DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_cost_cents INTEGER DEFAULT NULL,
  p_status execution_status DEFAULT 'completed',
  p_error_message TEXT DEFAULT NULL,
  p_error_code VARCHAR(50) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id UUID;
BEGIN
  INSERT INTO skill_executions (
    skill_id, user_id, execution_type, reference_id,
    input, output, tokens_used, prompt_tokens, completion_tokens,
    duration_ms, cost_cents, status, error_message, error_code,
    completed_at
  ) VALUES (
    p_skill_id, p_user_id, p_execution_type, p_reference_id,
    p_input, p_output, p_tokens_used, p_prompt_tokens, p_completion_tokens,
    p_duration_ms, p_cost_cents, p_status, p_error_message, p_error_code,
    CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_execution_id;

  RETURN v_execution_id;
END;
$$;

-- System: Get due habits for scheduler
CREATE OR REPLACE FUNCTION system_get_due_habits()
RETURNS TABLE (
  id UUID,
  skill_id UUID,
  user_id UUID,
  schedule_cron VARCHAR(100),
  timezone VARCHAR(50),
  config JSONB,
  next_run_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id, h.skill_id, h.user_id, h.schedule_cron,
         h.timezone, h.config, h.next_run_at
  FROM habits h
  WHERE h.is_active = true
    AND (h.next_run_at IS NULL OR h.next_run_at <= NOW())
  ORDER BY h.next_run_at NULLS FIRST
$$;

-- System: Update habit after execution
CREATE OR REPLACE FUNCTION system_update_habit_run(
  p_habit_id UUID,
  p_next_run_at TIMESTAMPTZ,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE habits
  SET
    last_run_at = NOW(),
    next_run_at = p_next_run_at,
    run_count = run_count + 1,
    consecutive_failures = CASE
      WHEN p_error_message IS NULL THEN 0
      ELSE consecutive_failures + 1
    END,
    last_error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_habit_id;
END;
$$;


-- =============================================================================
-- FORCE RLS on table owners
-- This ensures that even the table owner (usually postgres) must satisfy
-- RLS policies, unless using SECURITY DEFINER functions.
-- Note: service_role in Supabase bypasses RLS by default. FORCE makes
-- the policies apply even for the table owner.
-- =============================================================================

ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE project_repositories FORCE ROW LEVEL SECURITY;
ALTER TABLE project_members FORCE ROW LEVEL SECURITY;
ALTER TABLE ingestion_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE project_files FORCE ROW LEVEL SECURITY;
ALTER TABLE skills FORCE ROW LEVEL SECURITY;
ALTER TABLE habits FORCE ROW LEVEL SECURITY;
ALTER TABLE reflexes FORCE ROW LEVEL SECURITY;
ALTER TABLE skill_executions FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- Grants
-- =============================================================================

-- Grant execute on SECURITY DEFINER functions to authenticated role
GRANT EXECUTE ON FUNCTION admin_list_all_projects TO authenticated;
GRANT EXECUTE ON FUNCTION system_get_skill_for_execution TO service_role;
GRANT EXECUTE ON FUNCTION system_record_execution TO service_role;
GRANT EXECUTE ON FUNCTION system_get_due_habits TO service_role;
GRANT EXECUTE ON FUNCTION system_update_habit_run TO service_role;

-- Grant auth functions to all
GRANT EXECUTE ON FUNCTION auth.current_org_id TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.current_user_id TO authenticated, anon, service_role;


-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON FUNCTION auth.current_org_id IS 'Returns current org ID from session variable or JWT claims';
COMMENT ON FUNCTION auth.current_user_id IS 'Returns current user ID from session variable or JWT/auth.uid()';
COMMENT ON FUNCTION admin_list_all_projects IS 'SECURITY DEFINER: List projects across all orgs (admin only)';
COMMENT ON FUNCTION system_get_skill_for_execution IS 'SECURITY DEFINER: Get skill config for background execution';
COMMENT ON FUNCTION system_record_execution IS 'SECURITY DEFINER: Record execution from background worker';
COMMENT ON FUNCTION system_get_due_habits IS 'SECURITY DEFINER: Get habits due for scheduling';
COMMENT ON FUNCTION system_update_habit_run IS 'SECURITY DEFINER: Update habit after execution';
