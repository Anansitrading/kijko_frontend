"""Tests for infrastructure: health endpoints, rate limiting, Docker config."""

import time
import uuid
import pytest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from server.app.main import app

# Test credentials
TEST_SECRET = "test-secret-key-for-jwt-signing-do-not-use-in-production"


@pytest.fixture
def client():
    return TestClient(app)


# =============================================================================
# Health Endpoint Tests
# =============================================================================

class TestHealth:
    """Tests for health/readiness endpoints."""

    def test_basic_health(self, client):
        """Test liveness probe returns 200."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_readiness_endpoint_exists(self, client):
        """Test readiness probe endpoint exists."""
        resp = client.get("/health/ready")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "checks" in data
        assert "version" in data
        assert "duration_ms" in data

    def test_readiness_has_dependency_checks(self, client):
        """Test readiness probe includes dependency status."""
        resp = client.get("/health/ready")
        data = resp.json()
        checks = data.get("checks", {})

        # Should have checks for all dependencies
        assert "redis" in checks
        assert "database" in checks
        assert "keycloak" in checks
        assert "stripe" in checks

    def test_stripe_check_reports_unconfigured(self, client):
        """Test stripe check shows unconfigured with placeholder key."""
        resp = client.get("/health/ready")
        data = resp.json()
        stripe_check = data["checks"]["stripe"]
        # With placeholder keys, should show unconfigured
        assert stripe_check["status"] in ("healthy", "unconfigured")


# =============================================================================
# Rate Limiting Tests
# =============================================================================

class TestRateLimiting:
    """Tests for rate limiting middleware."""

    def test_rate_limit_config_exists(self):
        """Test rate limit configuration is defined."""
        from server.app.middleware.rate_limit import RATE_LIMITS

        assert "/api/v1/auth/login" in RATE_LIMITS
        assert "/api/v1/auth/signup" in RATE_LIMITS

        # Login should be limited to 5 per minute
        max_req, window = RATE_LIMITS["/api/v1/auth/login"]
        assert max_req == 5
        assert window == 60

    def test_get_client_ip_from_forwarded_header(self):
        """Test IP extraction from X-Forwarded-For."""
        from server.app.middleware.rate_limit import RateLimitMiddleware
        from unittest.mock import MagicMock

        request = MagicMock()
        request.headers = {"X-Forwarded-For": "1.2.3.4, 5.6.7.8"}
        assert RateLimitMiddleware._get_client_ip(request) == "1.2.3.4"

    def test_get_client_ip_from_real_ip(self):
        """Test IP extraction from X-Real-IP."""
        from server.app.middleware.rate_limit import RateLimitMiddleware
        from unittest.mock import MagicMock

        request = MagicMock()
        request.headers = {"X-Real-IP": "10.0.0.1"}
        assert RateLimitMiddleware._get_client_ip(request) == "10.0.0.1"

    def test_memory_rate_limiter(self):
        """Test in-memory fallback rate limiter."""
        from server.app.middleware.rate_limit import RateLimitMiddleware

        limiter = RateLimitMiddleware(None)

        # Should allow first 5 requests
        for i in range(5):
            assert limiter._check_memory("test:key", 5, 60) is True

        # 6th should be rejected
        assert limiter._check_memory("test:key", 5, 60) is False


# =============================================================================
# Docker Configuration Tests
# =============================================================================

class TestDockerConfig:
    """Tests for Docker Compose configuration."""

    def test_dockerfile_exists(self):
        """Test Dockerfile exists."""
        import os
        assert os.path.exists("/home/devuser/Kijko-MVP/server/Dockerfile")

    def test_docker_compose_exists(self):
        """Test docker-compose.yml exists."""
        import os
        assert os.path.exists("/home/devuser/Kijko-MVP/server/docker-compose.yml")

    def test_docker_compose_services(self):
        """Test docker-compose has required services."""
        import yaml

        with open("/home/devuser/Kijko-MVP/server/docker-compose.yml") as f:
            compose = yaml.safe_load(f)

        services = compose.get("services", {})
        assert "api" in services
        assert "redis" in services
        assert "worker" in services
        assert "beat" in services


# =============================================================================
# CORS Configuration Tests
# =============================================================================

class TestCORS:
    """Tests for CORS configuration."""

    def test_cors_headers_on_preflight(self, client):
        """Test CORS preflight returns correct headers."""
        resp = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:1420",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.status_code == 200
        assert "access-control-allow-origin" in resp.headers

    def test_cors_allows_localhost(self, client):
        """Test CORS allows configured origins."""
        resp = client.get(
            "/health",
            headers={"Origin": "http://localhost:1420"},
        )
        assert resp.headers.get("access-control-allow-origin") in (
            "http://localhost:1420", "*",
        )


# =============================================================================
# Route Coverage Tests
# =============================================================================

class TestRouteCoverage:
    """Tests verifying all expected routes exist."""

    def test_total_route_count(self, client):
        """Test minimum number of routes."""
        from server.app.main import app

        routes = [r for r in app.routes if hasattr(r, 'methods')]
        # Should have 80+ HTTP routes
        assert len(routes) >= 80

    def test_all_routers_mounted(self, client):
        """Test all domain routers are mounted."""
        from server.app.main import app

        route_paths = {r.path for r in app.routes if hasattr(r, 'path')}

        # Each domain should have at least one route
        assert any("/auth/" in p for p in route_paths)
        assert any("/projects" in p for p in route_paths)
        assert any("/skills" in p for p in route_paths)
        assert any("/habits" in p for p in route_paths)
        assert any("/reflexes" in p for p in route_paths)
        assert any("/executions" in p for p in route_paths)
        assert any("/billing" in p for p in route_paths)
        assert any("/webhooks" in p for p in route_paths)
        assert any("/gdpr" in p for p in route_paths)
