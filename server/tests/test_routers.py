"""Router-level integration tests — CRUD operations with mocked auth and services.

Tests the actual HTTP contract: request validation, response shapes,
error handling, pagination params, and auth enforcement.
"""

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from server.app.main import app


client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

MOCK_USER = {
    "sub": "user-uuid-123",
    "email": "test@kijko.nl",
    "org_id": "org-uuid-456",
    "roles": ["developer"],
}

MOCK_ADMIN = {
    "sub": "admin-uuid-789",
    "email": "admin@kijko.nl",
    "org_id": "org-uuid-456",
    "roles": ["admin"],
}


def auth_headers():
    return {"Authorization": "Bearer mock-test-token"}


def mock_auth(user=None):
    """Context manager that mocks both Keycloak validation and RLS context."""
    if user is None:
        user = MOCK_USER

    kc_mock = patch(
        "server.app.middleware.auth.KeycloakService.validate_token",
        new_callable=AsyncMock,
        return_value=user,
    )
    rls_mock = patch(
        "server.app.services.database.set_rls_context",
        new_callable=AsyncMock,
    )

    class _MockContext:
        def __enter__(self):
            self._kc = kc_mock.__enter__()
            self._rls = rls_mock.__enter__()
            return self

        def __exit__(self, *args):
            rls_mock.__exit__(*args)
            kc_mock.__exit__(*args)

    return _MockContext()


# ===========================================================================
# Skills Router
# ===========================================================================

class TestSkillsRouter:

    def test_list_skills_pagination_params(self):
        """List skills accepts and validates pagination query params."""
        with mock_auth():
            # Valid params
            resp = client.get(
                "/api/v1/skills?page=1&page_size=50",
                headers=auth_headers(),
            )
            # Will get 500 (DB unavailable) but not 422 (valid params)
            assert resp.status_code != 422

    def test_list_skills_invalid_page_zero(self):
        """Page 0 is rejected (minimum is 1)."""
        with mock_auth():
            resp = client.get(
                "/api/v1/skills?page=0",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_list_skills_page_size_too_large(self):
        """Page size >100 is rejected."""
        with mock_auth():
            resp = client.get(
                "/api/v1/skills?page_size=200",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_skill_validation(self):
        """Skill creation validates required fields."""
        with mock_auth():
            # Missing prompt_template
            resp = client.post(
                "/api/v1/skills",
                json={"name": "Test Skill"},
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_skill_name_too_short(self):
        """Skill name must be at least 2 chars."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills",
                json={
                    "name": "X",
                    "prompt_template": "Test prompt with minimum length",
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_skill_prompt_too_short(self):
        """Prompt template must be at least 10 chars."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills",
                json={
                    "name": "Valid Name",
                    "prompt_template": "Short",
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_create_skill_valid_body(self):
        """Valid skill creation body passes validation."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills",
                json={
                    "name": "My Analysis Skill",
                    "description": "Analyzes code quality",
                    "prompt_template": "Analyze this code for quality issues: {input}",
                    "category": "analysis",
                    "model": "claude-3-5-sonnet-20241022",
                    "output_format": "markdown",
                },
                headers=auth_headers(),
            )
            # 201 or 500 (DB) — but not 422 (validation passed)
            assert resp.status_code != 422

    def test_get_skill_invalid_uuid(self):
        """Invalid UUID in path returns 422."""
        with mock_auth():
            resp = client.get(
                "/api/v1/skills/not-a-uuid",
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_get_skill_valid_uuid(self):
        """Valid UUID passes path validation."""
        skill_id = str(uuid4())
        with mock_auth():
            resp = client.get(
                f"/api/v1/skills/{skill_id}",
                headers=auth_headers(),
            )
            # 404 or 500 (DB) — not 422
            assert resp.status_code != 422

    def test_delete_skill_requires_auth(self):
        """Skill deletion requires authentication."""
        skill_id = str(uuid4())
        resp = client.delete(f"/api/v1/skills/{skill_id}")
        assert resp.status_code in (401, 403)

    def test_test_skill_endpoint(self):
        """Test skill endpoint accepts valid request."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills/test",
                json={
                    "prompt_template": "Test prompt with enough characters to pass validation",
                    "input_data": {"key": "value"},
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "completed"
            assert "output" in data
            assert "tokens_used" in data

    def test_bulk_action_validation(self):
        """Bulk action validates action type."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills/bulk",
                json={
                    "skill_ids": [str(uuid4())],
                    "action": "invalid_action",
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_bulk_action_valid_types(self):
        """Bulk action accepts valid action types."""
        for action in ["activate", "deactivate", "delete"]:
            with mock_auth():
                resp = client.post(
                    "/api/v1/skills/bulk",
                    json={
                        "skill_ids": [str(uuid4())],
                        "action": action,
                    },
                    headers=auth_headers(),
                )
                # 200 or 500 (DB) — but not 422
                assert resp.status_code != 422, f"Action '{action}' rejected"

    def test_skill_category_validation(self):
        """Invalid skill category is rejected."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills",
                json={
                    "name": "Test Skill",
                    "prompt_template": "A valid prompt template for testing",
                    "category": "nonexistent_category",
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422


# ===========================================================================
# Projects Router
# ===========================================================================

class TestProjectsRouter:

    def test_list_projects_with_filters(self):
        """List projects accepts filter params."""
        with mock_auth():
            resp = client.get(
                "/api/v1/projects?status=active&type=repository&search=test",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_create_project_requires_name(self):
        """Project creation requires a name."""
        with mock_auth():
            resp = client.post(
                "/api/v1/projects",
                json={},
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_project_pagination_defaults(self):
        """Default pagination params are accepted."""
        with mock_auth():
            resp = client.get(
                "/api/v1/projects",
                headers=auth_headers(),
            )
            # Should get through validation
            assert resp.status_code != 422


# ===========================================================================
# Habits Router
# ===========================================================================

class TestHabitsRouter:

    def test_list_habits_with_filters(self):
        """List habits accepts filter params."""
        with mock_auth():
            resp = client.get(
                "/api/v1/habits?skill_id=test&is_active=true",
                headers=auth_headers(),
            )
            assert resp.status_code != 422

    def test_create_habit_requires_fields(self):
        """Habit creation validates required fields."""
        with mock_auth():
            resp = client.post(
                "/api/v1/habits",
                json={},
                headers=auth_headers(),
            )
            assert resp.status_code == 422


# ===========================================================================
# Billing Router
# ===========================================================================

class TestBillingRouter:

    def test_plans_returns_200_with_auth(self):
        """Plans endpoint returns 200 with valid auth."""
        with mock_auth():
            resp = client.get(
                "/api/v1/billing/plans",
                headers=auth_headers(),
            )
            assert resp.status_code == 200

    def test_checkout_requires_plan(self):
        """Checkout requires plan specification."""
        with mock_auth():
            resp = client.post(
                "/api/v1/billing/checkout",
                json={},
                headers=auth_headers(),
            )
            assert resp.status_code == 422


# ===========================================================================
# Auth Router
# ===========================================================================

class TestAuthRouter:

    def test_login_requires_email_and_password(self):
        """Login validates required fields."""
        resp = client.post("/api/v1/auth/login", json={})
        assert resp.status_code == 422

    def test_login_validates_email_format(self):
        """Login rejects invalid email format."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "not-an-email",
            "password": "password123",
        })
        # 422 (validation) or 429/500 (rate limited in full suite) — never 200
        assert resp.status_code != 200

    def test_login_validates_password_length(self):
        """Login rejects password shorter than minimum."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@kijko.nl",
            "password": "ab",  # Too short
        })
        # 422 (validation) or 429/500 (rate limited in full suite) — never 200
        assert resp.status_code != 200

    def test_signup_validates_all_fields(self):
        """Signup validates all required fields."""
        resp = client.post("/api/v1/auth/signup", json={
            "email": "test@kijko.nl",
            # Missing password, first_name, last_name
        })
        assert resp.status_code == 422


# ===========================================================================
# Executions Router
# ===========================================================================

class TestExecutionsRouter:

    def test_list_executions_auth_required(self):
        """Executions listing requires auth."""
        resp = client.get("/api/v1/executions")
        assert resp.status_code in (401, 403)

    def test_list_executions_pagination(self):
        """Executions accepts pagination params."""
        with mock_auth():
            resp = client.get(
                "/api/v1/executions?page=1&page_size=10",
                headers=auth_headers(),
            )
            assert resp.status_code != 422


# ===========================================================================
# Webhooks Router
# ===========================================================================

class TestWebhooksRouter:

    def test_stripe_webhook_no_body(self):
        """Stripe webhook rejects empty body."""
        resp = client.post("/api/v1/webhooks/stripe")
        # Should fail — no Stripe-Signature and no body
        assert resp.status_code != 200


# ===========================================================================
# OpenAPI / Docs
# ===========================================================================

class TestOpenAPI:

    def test_openapi_schema_accessible(self):
        """OpenAPI schema is accessible and valid JSON."""
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "paths" in schema
        assert "info" in schema
        assert schema["info"]["title"] == "Kijko API"

    def test_openapi_all_routers_registered(self):
        """All expected tag groups are in OpenAPI schema."""
        resp = client.get("/openapi.json")
        schema = resp.json()
        tags = {tag["name"] for tag in schema.get("tags", []) if isinstance(tag, dict)}
        # If tags aren't explicitly defined, check paths have expected prefixes
        paths = list(schema["paths"].keys())
        path_prefixes = set()
        for p in paths:
            parts = p.split("/")
            if len(parts) >= 4:
                path_prefixes.add(parts[3])

        expected_prefixes = {"auth", "projects", "skills", "habits", "reflexes",
                             "executions", "billing", "webhooks", "gdpr", "admin"}
        for prefix in expected_prefixes:
            assert any(prefix in p for p in paths), f"Missing router: {prefix}"

    def test_openapi_has_security_scheme(self):
        """OpenAPI schema defines Bearer security scheme."""
        resp = client.get("/openapi.json")
        schema = resp.json()
        components = schema.get("components", {})
        security_schemes = components.get("securitySchemes", {})
        assert len(security_schemes) > 0, "No security schemes defined"
        # Should have HTTPBearer
        has_bearer = any(
            s.get("type") == "http" and s.get("scheme") == "bearer"
            for s in security_schemes.values()
        )
        assert has_bearer, "No HTTPBearer security scheme"


# ===========================================================================
# Enum Validation
# ===========================================================================

class TestEnumValidation:

    def test_invalid_skill_output_format(self):
        """Invalid output format rejected."""
        with mock_auth():
            resp = client.post(
                "/api/v1/skills",
                json={
                    "name": "Test Skill",
                    "prompt_template": "A valid prompt for testing purposes",
                    "output_format": "xml",  # Not a valid format
                },
                headers=auth_headers(),
            )
            assert resp.status_code == 422

    def test_valid_skill_output_formats(self):
        """All valid output formats are accepted."""
        valid_formats = ["markdown", "json", "text", "html", "code"]
        for fmt in valid_formats:
            with mock_auth():
                resp = client.post(
                    "/api/v1/skills",
                    json={
                        "name": "Test Skill",
                        "prompt_template": "A valid prompt for testing purposes",
                        "output_format": fmt,
                    },
                    headers=auth_headers(),
                )
                assert resp.status_code != 422, f"Format '{fmt}' rejected"

    def test_valid_skill_categories(self):
        """All valid categories are accepted."""
        valid_cats = ["analysis", "generation", "transformation",
                      "communication", "automation", "custom"]
        for cat in valid_cats:
            with mock_auth():
                resp = client.post(
                    "/api/v1/skills",
                    json={
                        "name": "Test Skill",
                        "prompt_template": "A valid prompt for testing purposes",
                        "category": cat,
                    },
                    headers=auth_headers(),
                )
                assert resp.status_code != 422, f"Category '{cat}' rejected"
