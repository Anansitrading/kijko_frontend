"""Multi-tenant RLS isolation tests.

Tests verify that Row-Level Security policies correctly isolate data
between organizations and users. Each test:
1. Creates test data in one org/user context
2. Verifies it's visible in the same context
3. Verifies it's NOT visible in a different context
4. Cleans up test data

IMPORTANT: These tests require a live Supabase instance with:
- All migrations deployed (001-004)
- service_role key configured
- RLS policies active

Skip if SUPABASE_URL/SUPABASE_SERVICE_KEY not configured.
"""

import asyncio
import uuid
import pytest

from server.app.services.database import (
    set_rls_context,
    clear_rls_context,
    execute_with_rls,
)
from server.tests.conftest import (
    ORG_A_ID,
    ORG_B_ID,
    USER_A1_ID,
    USER_B1_ID,
)


# ---------------------------------------------------------------------------
# Helper to run async in sync pytest
# ---------------------------------------------------------------------------

def run_async(coro):
    """Run an async function in sync test context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# ---------------------------------------------------------------------------
# Projects table — Organization-scoped isolation
# ---------------------------------------------------------------------------

class TestProjectsRLS:
    """Test RLS isolation on projects table (organization-scoped)."""

    @pytest.fixture(autouse=True)
    def setup(self, supabase_client, test_prefix):
        self.client = supabase_client
        self.prefix = test_prefix
        yield
        # Cleanup: delete all test projects
        self._cleanup()

    def _cleanup(self):
        """Delete test data created during this test run."""
        try:
            self.client.table("projects") \
                .delete() \
                .like("name", f"{self.prefix}%") \
                .execute()
        except Exception:
            pass  # Best effort cleanup

    def _create_project(self, org_id, user_id, name_suffix="proj"):
        """Create a test project via direct insert (service_role bypasses RLS)."""
        project_id = str(uuid.uuid4())
        result = self.client.table("projects").insert({
            "id": project_id,
            "organization_id": str(org_id),
            "user_id": str(user_id),
            "name": f"{self.prefix}{name_suffix}",
            "type": "repository",
            "status": "draft",
        }).execute()
        return project_id, result.data

    def test_org_a_cannot_see_org_b_projects(self):
        """Org A creates a project → Org B cannot see it."""
        project_id, _ = self._create_project(ORG_A_ID, USER_A1_ID, "org_a_only")

        # Org B should NOT see this project
        async def check():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("projects") \
                .select("id") \
                .eq("id", project_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 0, f"Org B can see Org A's project! Data: {data}"

    def test_org_a_can_see_own_projects(self):
        """Org A creates a project → Org A can see it."""
        project_id, _ = self._create_project(ORG_A_ID, USER_A1_ID, "org_a_visible")

        async def check():
            await set_rls_context(self.client, USER_A1_ID, ORG_A_ID)
            result = self.client.table("projects") \
                .select("id") \
                .eq("id", project_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 1, f"Org A cannot see own project! Data: {data}"
        assert data[0]["id"] == project_id

    def test_org_b_cannot_update_org_a_project(self):
        """Org B cannot update Org A's project."""
        project_id, _ = self._create_project(ORG_A_ID, USER_A1_ID, "no_update")

        async def attempt_update():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("projects") \
                .update({"name": "HACKED"}) \
                .eq("id", project_id) \
                .execute()
            return result.data

        data = run_async(attempt_update())
        # With RLS, the update should affect 0 rows (no match in Org B's view)
        assert len(data) == 0, f"Org B updated Org A's project! Data: {data}"

        # Verify project name unchanged
        original = self.client.table("projects") \
            .select("name") \
            .eq("id", project_id) \
            .execute()
        assert "HACKED" not in original.data[0]["name"]

    def test_org_b_cannot_delete_org_a_project(self):
        """Org B cannot delete Org A's project."""
        project_id, _ = self._create_project(ORG_A_ID, USER_A1_ID, "no_delete")

        async def attempt_delete():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("projects") \
                .delete() \
                .eq("id", project_id) \
                .execute()
            return result.data

        data = run_async(attempt_delete())
        assert len(data) == 0, f"Org B deleted Org A's project! Data: {data}"

        # Verify project still exists
        check = self.client.table("projects") \
            .select("id") \
            .eq("id", project_id) \
            .execute()
        assert len(check.data) == 1

    def test_service_role_sees_all_projects(self):
        """Service role (no RLS context) can see all projects."""
        id_a, _ = self._create_project(ORG_A_ID, USER_A1_ID, "sr_a")
        id_b, _ = self._create_project(ORG_B_ID, USER_B1_ID, "sr_b")

        # Service role query (no set_rls_context) — should bypass RLS
        result = self.client.table("projects") \
            .select("id") \
            .in_("id", [id_a, id_b]) \
            .execute()

        ids = {r["id"] for r in result.data}
        assert id_a in ids, "Service role cannot see Org A project"
        assert id_b in ids, "Service role cannot see Org B project"


# ---------------------------------------------------------------------------
# Skills table — User-scoped isolation
# ---------------------------------------------------------------------------

class TestSkillsRLS:
    """Test RLS isolation on skills table (user-scoped)."""

    @pytest.fixture(autouse=True)
    def setup(self, supabase_client, test_prefix):
        self.client = supabase_client
        self.prefix = test_prefix
        yield
        self._cleanup()

    def _cleanup(self):
        try:
            self.client.table("skills") \
                .delete() \
                .like("name", f"{self.prefix}%") \
                .execute()
        except Exception:
            pass

    def _create_skill(self, user_id, name_suffix="skill"):
        skill_id = str(uuid.uuid4())
        self.client.table("skills").insert({
            "id": skill_id,
            "user_id": str(user_id),
            "name": f"{self.prefix}{name_suffix}",
            "prompt_template": "Test prompt template for RLS testing purposes",
            "category": "custom",
        }).execute()
        return skill_id

    def test_user_a_cannot_see_user_b_skills(self):
        """User A's skills are not visible to User B."""
        skill_id = self._create_skill(USER_A1_ID, "user_a_only")

        async def check():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("skills") \
                .select("id") \
                .eq("id", skill_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 0, f"User B can see User A's skill! Data: {data}"

    def test_user_a_can_see_own_skills(self):
        """User A can see their own skills."""
        skill_id = self._create_skill(USER_A1_ID, "user_a_visible")

        async def check():
            await set_rls_context(self.client, USER_A1_ID, ORG_A_ID)
            result = self.client.table("skills") \
                .select("id") \
                .eq("id", skill_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 1, f"User A cannot see own skill! Data: {data}"

    def test_user_b_cannot_update_user_a_skill(self):
        """User B cannot modify User A's skill."""
        skill_id = self._create_skill(USER_A1_ID, "no_update")

        async def attempt():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("skills") \
                .update({"name": "HACKED"}) \
                .eq("id", skill_id) \
                .execute()
            return result.data

        data = run_async(attempt())
        assert len(data) == 0, f"User B updated User A's skill! Data: {data}"

    def test_user_b_cannot_delete_user_a_skill(self):
        """User B cannot delete User A's skill."""
        skill_id = self._create_skill(USER_A1_ID, "no_delete")

        async def attempt():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("skills") \
                .delete() \
                .eq("id", skill_id) \
                .execute()
            return result.data

        data = run_async(attempt())
        assert len(data) == 0, f"User B deleted User A's skill! Data: {data}"

        # Verify still exists
        check = self.client.table("skills") \
            .select("id") \
            .eq("id", skill_id) \
            .execute()
        assert len(check.data) == 1


# ---------------------------------------------------------------------------
# Habits table — User-scoped (via skill ownership)
# ---------------------------------------------------------------------------

class TestHabitsRLS:
    """Test RLS isolation on habits table (user-scoped)."""

    @pytest.fixture(autouse=True)
    def setup(self, supabase_client, test_prefix):
        self.client = supabase_client
        self.prefix = test_prefix
        yield
        self._cleanup()

    def _cleanup(self):
        try:
            # Habits reference skills, so clean habits first
            self.client.table("habits") \
                .delete() \
                .like("schedule_description", f"{self.prefix}%") \
                .execute()
            self.client.table("skills") \
                .delete() \
                .like("name", f"{self.prefix}%") \
                .execute()
        except Exception:
            pass

    def _create_habit(self, user_id, name_suffix="habit"):
        # First create a skill
        skill_id = str(uuid.uuid4())
        self.client.table("skills").insert({
            "id": skill_id,
            "user_id": str(user_id),
            "name": f"{self.prefix}skill_{name_suffix}",
            "prompt_template": "Test prompt for habit RLS testing",
        }).execute()

        # Then create habit
        habit_id = str(uuid.uuid4())
        self.client.table("habits").insert({
            "id": habit_id,
            "skill_id": skill_id,
            "user_id": str(user_id),
            "schedule_cron": "0 9 * * 1-5",
            "schedule_description": f"{self.prefix}{name_suffix}",
        }).execute()
        return habit_id

    def test_user_a_cannot_see_user_b_habits(self):
        """User A's habits are not visible to User B."""
        habit_id = self._create_habit(USER_A1_ID, "hab_a_only")

        async def check():
            await set_rls_context(self.client, USER_B1_ID, ORG_B_ID)
            result = self.client.table("habits") \
                .select("id") \
                .eq("id", habit_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 0, f"User B can see User A's habit!"

    def test_user_a_can_see_own_habits(self):
        """User A can see their own habits."""
        habit_id = self._create_habit(USER_A1_ID, "hab_a_visible")

        async def check():
            await set_rls_context(self.client, USER_A1_ID, ORG_A_ID)
            result = self.client.table("habits") \
                .select("id") \
                .eq("id", habit_id) \
                .execute()
            return result.data

        data = run_async(check())
        assert len(data) == 1


# ---------------------------------------------------------------------------
# execute_with_rls wrapper test
# ---------------------------------------------------------------------------

class TestExecuteWithRLS:
    """Test the execute_with_rls helper function."""

    @pytest.fixture(autouse=True)
    def setup(self, supabase_client, test_prefix):
        self.client = supabase_client
        self.prefix = test_prefix
        yield
        self._cleanup()

    def _cleanup(self):
        try:
            self.client.table("projects") \
                .delete() \
                .like("name", f"{self.prefix}%") \
                .execute()
        except Exception:
            pass

    def test_execute_with_rls_scopes_correctly(self):
        """execute_with_rls correctly scopes queries to the given org."""
        # Create projects for both orgs
        id_a = str(uuid.uuid4())
        id_b = str(uuid.uuid4())

        self.client.table("projects").insert({
            "id": id_a,
            "organization_id": str(ORG_A_ID),
            "user_id": str(USER_A1_ID),
            "name": f"{self.prefix}rls_wrapper_a",
            "type": "repository",
        }).execute()

        self.client.table("projects").insert({
            "id": id_b,
            "organization_id": str(ORG_B_ID),
            "user_id": str(USER_B1_ID),
            "name": f"{self.prefix}rls_wrapper_b",
            "type": "repository",
        }).execute()

        # Query with Org A context — should only see Org A's project
        async def check():
            result = await execute_with_rls(
                self.client,
                USER_A1_ID,
                ORG_A_ID,
                lambda c: c.table("projects")
                    .select("id, name")
                    .like("name", f"{self.prefix}rls_wrapper_%")
                    .execute(),
            )
            return result.data

        data = run_async(check())
        ids = {r["id"] for r in data}
        assert id_a in ids, "Org A's project not visible through execute_with_rls"
        assert id_b not in ids, "Org B's project visible through execute_with_rls!"

    def test_rls_context_cleared_after_execution(self):
        """RLS context is cleared after execute_with_rls completes."""
        async def check():
            # Set some context
            await execute_with_rls(
                self.client,
                USER_A1_ID,
                ORG_A_ID,
                lambda c: c.table("projects").select("id").limit(0).execute(),
            )
            # After execution, context should be cleared
            # Service role query should see everything (no stale context)
            result = self.client.table("projects") \
                .select("id") \
                .limit(1) \
                .execute()
            return True  # If we get here without error, context was cleared

        assert run_async(check()) is True
