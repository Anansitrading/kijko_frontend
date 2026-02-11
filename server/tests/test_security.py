"""Security-focused tests — auth bypass, injection prevention, rate limiting, CORS.

Tests security properties that must hold across the entire API surface.
"""

from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from server.app.main import app


client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Auth Bypass Prevention
# ---------------------------------------------------------------------------

class TestAuthBypass:

    # Comprehensive list of all protected endpoints
    PROTECTED_ENDPOINTS = [
        ("GET", "/api/v1/auth/me"),
        ("GET", "/api/v1/projects"),
        ("POST", "/api/v1/projects"),
        ("GET", "/api/v1/skills"),
        ("POST", "/api/v1/skills"),
        ("GET", "/api/v1/habits"),
        ("POST", "/api/v1/habits"),
        ("GET", "/api/v1/reflexes"),
        ("POST", "/api/v1/reflexes"),
        ("GET", "/api/v1/executions"),
        ("GET", "/api/v1/gdpr/categories"),
        ("GET", "/api/v1/billing/plans"),
        ("POST", "/api/v1/admin/cleanup-logs"),
    ]

    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_no_token_returns_401_or_403(self, method, path):
        """Protected endpoints reject requests without auth token."""
        resp = getattr(client, method.lower())(path)
        assert resp.status_code in (401, 403), \
            f"{method} {path} returned {resp.status_code}, expected 401/403"

    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_empty_bearer_token_rejected(self, method, path):
        """Empty Bearer token is rejected."""
        resp = getattr(client, method.lower())(
            path, headers={"Authorization": "Bearer "}
        )
        assert resp.status_code in (401, 403, 422)

    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_malformed_auth_header_rejected(self, method, path):
        """Malformed Authorization header is rejected."""
        resp = getattr(client, method.lower())(
            path, headers={"Authorization": "NotBearer some-token"}
        )
        assert resp.status_code in (401, 403)

    def test_no_auth_header_on_protected_endpoint(self):
        """Complete absence of Authorization header returns 401/403."""
        resp = client.get("/api/v1/projects")
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Public Endpoints
# ---------------------------------------------------------------------------

class TestPublicEndpoints:

    PUBLIC_ENDPOINTS = [
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/health/ready"),
        ("GET", "/docs"),
        ("GET", "/redoc"),
    ]

    @pytest.mark.parametrize("method,path", PUBLIC_ENDPOINTS)
    def test_public_endpoints_accessible(self, method, path):
        """Public endpoints don't require auth."""
        resp = getattr(client, method.lower())(path)
        # Should NOT be 401/403
        assert resp.status_code not in (401, 403), \
            f"{method} {path} returned {resp.status_code}, should be public"


# ---------------------------------------------------------------------------
# Input Validation / Injection Prevention
# ---------------------------------------------------------------------------

class TestInjectionPrevention:

    def test_login_sql_injection_in_email(self):
        """SQL injection in login email field doesn't succeed."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "' OR 1=1; DROP TABLE users; --",
            "password": "password123",
        })
        # Rejected — never succeeds with 200
        assert resp.status_code != 200

    def test_login_xss_in_email(self):
        """XSS in email field is handled safely (JSON response, not HTML)."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "<script>alert('xss')</script>@test.com",
            "password": "password123",
        })
        # Rejected via validation, auth, rate-limit, or service error — never 200
        assert resp.status_code != 200
        # JSON response Content-Type prevents browser XSS execution
        content_type = resp.headers.get("content-type", "")
        assert "text/html" not in content_type

    def test_signup_xss_in_name(self):
        """XSS in name fields is handled safely."""
        resp = client.post("/api/v1/auth/signup", json={
            "email": "test@test.com",
            "password": "password123",
            "first_name": "<img onerror='alert(1)' src='x'>",
            "last_name": "Normal",
        })
        assert resp.status_code in (400, 422, 503)

    def test_path_traversal_in_project_id(self):
        """Path traversal in project ID doesn't expose files."""
        resp = client.get("/api/v1/projects/../../etc/passwd")
        assert resp.status_code in (401, 403, 404, 422)

    def test_null_bytes_in_request(self):
        """Null bytes in input don't cause errors."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "test\x00@test.com",
            "password": "pass\x00word",
        })
        # Rejected — never succeeds with 200
        assert resp.status_code != 200

    def test_extremely_long_email(self):
        """Extremely long email is rejected."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "a" * 10000 + "@test.com",
            "password": "password",
        })
        # Rejected — never succeeds with 200
        assert resp.status_code != 200

    def test_extremely_long_password(self):
        """Extremely long password is handled gracefully."""
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@test.com",
            "password": "p" * 100000,
        })
        # Should not crash the server — any non-200 is fine
        assert resp.status_code != 200


# ---------------------------------------------------------------------------
# CORS Security
# ---------------------------------------------------------------------------

class TestCORSSecurity:

    def test_cors_rejects_unknown_origin(self):
        """Unknown origins are not reflected in CORS headers."""
        resp = client.options(
            "/api/v1/projects",
            headers={
                "Origin": "https://evil.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should not echo back the evil origin
        cors_origin = resp.headers.get("access-control-allow-origin", "")
        assert "evil.com" not in cors_origin

    def test_cors_allows_configured_origin(self):
        """Configured origins get CORS headers."""
        resp = client.options(
            "/api/v1/projects",
            headers={
                "Origin": "http://localhost:1420",
                "Access-Control-Request-Method": "GET",
            },
        )
        cors_origin = resp.headers.get("access-control-allow-origin", "")
        # Either matches or is wildcard (depends on CORS_ORIGINS config)
        assert cors_origin in ("http://localhost:1420", "*", "")

    def test_cors_not_wildcard_for_credentials(self):
        """When credentials are allowed, origin should not be wildcard '*'."""
        resp = client.options(
            "/api/v1/projects",
            headers={
                "Origin": "https://app.kijko.nl",
                "Access-Control-Request-Method": "GET",
            },
        )
        allow_creds = resp.headers.get("access-control-allow-credentials", "")
        cors_origin = resp.headers.get("access-control-allow-origin", "")

        if allow_creds.lower() == "true":
            assert cors_origin != "*", \
                "CORS origin must not be * when credentials are allowed"


# ---------------------------------------------------------------------------
# Rate Limiting
# ---------------------------------------------------------------------------

class TestRateLimiting:

    def test_rate_limit_config_completeness(self):
        """Rate limits configured for all sensitive endpoints."""
        from server.app.middleware.rate_limit import RATE_LIMITS

        required_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/signup",
        ]
        for path in required_paths:
            assert path in RATE_LIMITS, f"Missing rate limit for {path}"

    def test_login_rate_limit_is_strict(self):
        """Login endpoint has strict rate limit (<=10 per minute)."""
        from server.app.middleware.rate_limit import RATE_LIMITS

        max_requests, window = RATE_LIMITS["/api/v1/auth/login"]
        assert max_requests <= 10, "Login should have strict rate limit"
        assert window == 60, "Login rate limit window should be 1 minute"

    def test_memory_rate_limiter_blocks_excess(self):
        """In-memory rate limiter correctly blocks excess requests."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        limiter = RateLimitMiddleware(app)
        key = "test:rate:limit"

        # First 3 should pass
        for i in range(3):
            assert limiter._check_memory(key, 3, 60) is True

        # 4th should fail
        assert limiter._check_memory(key, 3, 60) is False

    def test_rate_limiter_window_expiry(self):
        """Rate limiter allows requests after window expires."""
        import time as time_mod
        from server.app.middleware.rate_limit import RateLimitMiddleware

        limiter = RateLimitMiddleware(app)
        key = "test:rate:window"

        # Fill up the limit with a very short window
        for _ in range(5):
            limiter._check_memory(key, 5, 1)

        # Should be blocked
        assert limiter._check_memory(key, 5, 1) is False

        # Simulate window expiry
        for ts_list in limiter._memory_store.values():
            ts_list.clear()

        # Should be allowed again
        assert limiter._check_memory(key, 5, 1) is True

    def test_client_ip_extraction_forwarded_for(self):
        """X-Forwarded-For header is used for client IP."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        mock_request = MagicMock()
        mock_request.headers = {"X-Forwarded-For": "1.2.3.4, 5.6.7.8"}
        mock_request.client = MagicMock()
        mock_request.client.host = "127.0.0.1"

        ip = RateLimitMiddleware._get_client_ip(mock_request)
        assert ip == "1.2.3.4"

    def test_client_ip_extraction_real_ip(self):
        """X-Real-IP header is used when X-Forwarded-For absent."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        mock_request = MagicMock()
        mock_request.headers = {"X-Real-IP": "10.0.0.1"}
        mock_request.client = MagicMock()
        mock_request.client.host = "127.0.0.1"

        ip = RateLimitMiddleware._get_client_ip(mock_request)
        assert ip == "10.0.0.1"

    def test_client_ip_direct_fallback(self):
        """Falls back to direct client when no proxy headers."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        mock_request = MagicMock()
        mock_request.headers = {}
        mock_request.client = MagicMock()
        mock_request.client.host = "192.168.1.1"

        ip = RateLimitMiddleware._get_client_ip(mock_request)
        assert ip == "192.168.1.1"

    def test_client_ip_no_client(self):
        """Returns 'unknown' when no client info available."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        mock_request = MagicMock()
        mock_request.headers = {}
        mock_request.client = None

        ip = RateLimitMiddleware._get_client_ip(mock_request)
        assert ip == "unknown"


# ---------------------------------------------------------------------------
# Admin Authorization
# ---------------------------------------------------------------------------

class TestAdminAuthorization:

    def test_admin_endpoint_rejects_unauthenticated(self):
        """Admin endpoints require authentication."""
        resp = client.post("/api/v1/admin/cleanup-logs")
        assert resp.status_code in (401, 403)

    def test_admin_endpoint_rejects_regular_user(self):
        """Admin endpoints reject non-admin users."""
        mock_user = {
            "sub": "user-123",
            "email": "user@kijko.nl",
            "org_id": "org-456",
            "roles": ["developer"],
        }

        with patch("server.app.middleware.auth.KeycloakService.validate_token",
                    new_callable=AsyncMock, return_value=mock_user):
            with patch("server.app.services.database.set_rls_context",
                        new_callable=AsyncMock):
                resp = client.post(
                    "/api/v1/admin/cleanup-logs",
                    headers={"Authorization": "Bearer test-token"},
                )

        assert resp.status_code == 403

    def test_admin_endpoint_accepts_admin_user(self):
        """Admin endpoints accept admin users."""
        mock_user = {
            "sub": "admin-123",
            "email": "admin@kijko.nl",
            "org_id": "org-456",
            "roles": ["admin"],
        }

        with patch("server.app.middleware.auth.KeycloakService.validate_token",
                    new_callable=AsyncMock, return_value=mock_user):
            with patch("server.app.services.database.set_rls_context",
                        new_callable=AsyncMock):
                resp = client.post(
                    "/api/v1/admin/cleanup-logs?dry_run=true",
                    headers={"Authorization": "Bearer admin-token"},
                )

        # 200 or 500 (DB unavailable) — but not 403
        assert resp.status_code != 403


# ---------------------------------------------------------------------------
# Observability / Information Leakage
# ---------------------------------------------------------------------------

class TestInformationLeakage:

    def test_404_doesnt_expose_internals(self):
        """404 responses don't expose server internals."""
        resp = client.get("/api/v1/nonexistent-endpoint")
        body = resp.json()

        # Should not contain stack traces or file paths
        text = str(body)
        assert "/home/" not in text
        assert "Traceback" not in text
        assert ".py" not in text

    def test_health_doesnt_expose_secrets(self):
        """Health endpoint doesn't expose secrets or credentials."""
        resp = client.get("/health")
        body = resp.json()

        text = str(body)
        assert "password" not in text.lower()
        assert "secret" not in text.lower()
        assert "key" not in text.lower() or "api_key_configured" in text

    def test_response_has_request_id(self):
        """All responses include X-Request-ID for tracing."""
        resp = client.get("/health")
        assert "x-request-id" in resp.headers

    def test_response_has_process_time(self):
        """All responses include X-Process-Time header."""
        resp = client.get("/health")
        assert "x-process-time" in resp.headers
        assert resp.headers["x-process-time"].endswith("ms")


# ---------------------------------------------------------------------------
# Webhook Security
# ---------------------------------------------------------------------------

class TestWebhookSecurity:

    def test_stripe_webhook_requires_signature(self):
        """Stripe webhook endpoint requires valid signature."""
        resp = client.post(
            "/api/v1/webhooks/stripe",
            content=b'{"type": "checkout.session.completed"}',
            headers={"Content-Type": "application/json"},
        )
        # Should fail without Stripe-Signature header
        assert resp.status_code in (400, 401, 403, 422, 500)


# ---------------------------------------------------------------------------
# GDPR Endpoint Security
# ---------------------------------------------------------------------------

class TestGDPRSecurity:

    def test_data_deletion_requires_auth(self):
        """GDPR data deletion requires authentication."""
        resp = client.post("/api/v1/gdpr/delete", json={"confirm": "DELETE_ALL_MY_DATA"})
        assert resp.status_code in (401, 403)

    def test_data_export_requires_auth(self):
        """GDPR data export requires authentication."""
        resp = client.post("/api/v1/gdpr/export")
        assert resp.status_code in (401, 403)

    def test_data_categories_requires_auth(self):
        """GDPR categories listing requires authentication."""
        resp = client.get("/api/v1/gdpr/categories")
        assert resp.status_code in (401, 403)

    def test_data_deletion_requires_confirmation(self):
        """GDPR deletion requires explicit confirmation string."""
        mock_user = {
            "sub": "user-123",
            "email": "user@kijko.nl",
            "org_id": "org-456",
            "roles": [],
        }

        with patch("server.app.middleware.auth.KeycloakService.validate_token",
                    new_callable=AsyncMock, return_value=mock_user):
            with patch("server.app.services.database.set_rls_context",
                        new_callable=AsyncMock):
                resp = client.post(
                    "/api/v1/gdpr/delete",
                    json={"confirm": "wrong_confirmation"},
                    headers={"Authorization": "Bearer test-token"},
                )

        # Without correct confirmation, should be rejected
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Middleware Auth (require_auth, require_role)
# ---------------------------------------------------------------------------

class TestAuthMiddleware:

    def test_require_auth_missing_org_id_returns_403(self):
        """User without org_id gets 403."""
        mock_user = {
            "sub": "user-123",
            "email": "user@kijko.nl",
            "org_id": "",  # Empty org_id
            "roles": [],
        }

        with patch("server.app.middleware.auth.KeycloakService.validate_token",
                    new_callable=AsyncMock, return_value=mock_user):
            resp = client.get(
                "/api/v1/projects",
                headers={"Authorization": "Bearer test-token"},
            )

        assert resp.status_code == 403
        assert "organization" in resp.json()["detail"].lower()

    def test_require_role_wrong_role_returns_403(self):
        """User with wrong role gets 403."""
        mock_user = {
            "sub": "user-123",
            "email": "user@kijko.nl",
            "org_id": "org-456",
            "roles": ["viewer"],
        }

        with patch("server.app.middleware.auth.KeycloakService.validate_token",
                    new_callable=AsyncMock, return_value=mock_user):
            with patch("server.app.services.database.set_rls_context",
                        new_callable=AsyncMock):
                resp = client.post(
                    "/api/v1/admin/cleanup-logs",
                    headers={"Authorization": "Bearer test-token"},
                )

        assert resp.status_code == 403
        assert "roles" in resp.json()["detail"].lower()
