-- =============================================================================
-- Migration: 005_security_definer_helpers
-- Description: Additional SECURITY DEFINER helpers for GDPR deletion,
--              reflex processing, and usage aggregation.
-- Sprint: Phase 1 — Foundation & Auth
-- Depends on: 004_rls_policies
-- =============================================================================

-- =============================================================================
-- GDPR: Cascade delete all user data across RLS-protected tables
-- Used by /gdpr/delete endpoint — must bypass RLS to delete across all tables
-- =============================================================================

CREATE OR REPLACE FUNCTION system_delete_user_data(
  p_user_id UUID,
  p_confirm TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '{}'::JSONB;
  v_count INTEGER;
BEGIN
  -- Safety: require explicit confirmation
  IF p_confirm IS DISTINCT FROM 'DELETE_ALL_MY_DATA' THEN
    RAISE EXCEPTION 'Confirmation required: pass confirm=DELETE_ALL_MY_DATA';
  END IF;

  -- Delete in dependency order (children first)

  -- 1. skill_executions
  DELETE FROM skill_executions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('skill_executions', v_count);

  -- 2. reflexes (depends on skills)
  DELETE FROM reflexes WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('reflexes', v_count);

  -- 3. habits (depends on skills)
  DELETE FROM habits WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('habits', v_count);

  -- 4. skills
  DELETE FROM skills WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('skills', v_count);

  -- 5. project_members
  DELETE FROM project_members WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('project_members', v_count);

  -- 6. usage_metrics (if table exists)
  BEGIN
    EXECUTE 'DELETE FROM usage_metrics WHERE user_id = $1' USING p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('usage_metrics', v_count);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist yet, skip
  END;

  RETURN v_result;
END;
$$;


-- =============================================================================
-- System: Get active reflexes for event matching
-- Used by background worker to check reflex triggers without user session
-- =============================================================================

CREATE OR REPLACE FUNCTION system_get_active_reflexes(
  p_event_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  skill_id UUID,
  user_id UUID,
  trigger_event VARCHAR(100),
  conditions JSONB,
  config JSONB
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.skill_id, r.user_id, r.trigger_event,
         r.conditions, r.config
  FROM reflexes r
  WHERE r.is_active = true
    AND (p_event_type IS NULL OR r.trigger_event = p_event_type)
  ORDER BY r.created_at
$$;


-- =============================================================================
-- System: RLS context setter for service-to-service calls
-- Sets session variables that auth.current_org_id() and auth.current_user_id() read
-- =============================================================================

CREATE OR REPLACE FUNCTION set_rls_context(
  p_org_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_org_id', p_org_id::TEXT, true);
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
END;
$$;


-- =============================================================================
-- System: Clear RLS context after service call
-- =============================================================================

CREATE OR REPLACE FUNCTION clear_rls_context()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_org_id', '', true);
  PERFORM set_config('app.current_user_id', '', true);
END;
$$;


-- =============================================================================
-- Grants
-- =============================================================================

-- GDPR deletion: only service_role (backend) can call
GRANT EXECUTE ON FUNCTION system_delete_user_data TO service_role;

-- Reflex matching: only service_role (worker)
GRANT EXECUTE ON FUNCTION system_get_active_reflexes TO service_role;

-- RLS context: service_role for backend service-to-service
GRANT EXECUTE ON FUNCTION set_rls_context TO service_role;
GRANT EXECUTE ON FUNCTION clear_rls_context TO service_role;


-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON FUNCTION system_delete_user_data IS 'SECURITY DEFINER: GDPR Art. 17 cascade deletion of all user data';
COMMENT ON FUNCTION system_get_active_reflexes IS 'SECURITY DEFINER: Get active reflexes for event matching in background worker';
COMMENT ON FUNCTION set_rls_context IS 'SECURITY DEFINER: Set RLS session vars for service-to-service calls';
COMMENT ON FUNCTION clear_rls_context IS 'SECURITY DEFINER: Clear RLS session vars after service call';
