"""Health check service — dependency status for readiness/liveness probes.

Checks: Redis, Supabase (DB), Supabase Auth, Stripe.
Returns structured status for monitoring.
"""

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


async def check_health() -> dict[str, Any]:
    """Check all external dependency connections.

    Returns a dict with overall status and per-dependency details.
    Suitable for Kubernetes readiness probes.
    """
    checks = {}
    overall_healthy = True
    start = time.monotonic()

    # 1. Redis
    checks["redis"] = await _check_redis()
    if checks["redis"]["status"] != "healthy":
        overall_healthy = False

    # 2. Supabase (DB)
    checks["database"] = await _check_database()
    if checks["database"]["status"] != "healthy":
        overall_healthy = False

    # 3. Supabase Auth
    checks["auth"] = await _check_supabase_auth()
    # Auth being degraded is acceptable (cached tokens still work)
    if checks["auth"]["status"] == "error":
        checks["auth"]["status"] = "degraded"

    # 4. Stripe
    checks["stripe"] = _check_stripe()

    total_ms = int((time.monotonic() - start) * 1000)

    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "checks": checks,
        "duration_ms": total_ms,
    }


async def _check_redis() -> dict[str, Any]:
    """Check Redis connectivity."""
    try:
        from server.app.dependencies import get_redis

        redis = await get_redis()
        start = time.monotonic()
        await redis.ping()
        latency_ms = int((time.monotonic() - start) * 1000)

        return {
            "status": "healthy",
            "latency_ms": latency_ms,
        }
    except Exception as e:
        logger.warning("Redis health check failed: %s", e)
        return {
            "status": "unhealthy",
            "error": str(e),
        }


async def _check_database() -> dict[str, Any]:
    """Check Supabase/PostgreSQL connectivity."""
    try:
        from server.app.dependencies import get_supabase

        client = get_supabase()
        start = time.monotonic()
        # Simple query to verify connection
        result = client.table("skills").select("id", count="exact").limit(1).execute()
        latency_ms = int((time.monotonic() - start) * 1000)

        return {
            "status": "healthy",
            "latency_ms": latency_ms,
        }
    except Exception as e:
        logger.warning("Database health check failed: %s", e)
        return {
            "status": "unhealthy",
            "error": str(e),
        }


async def _check_supabase_auth() -> dict[str, Any]:
    """Check Supabase Auth service."""
    try:
        from server.app.config import settings

        has_secret = bool(settings.SUPABASE_JWT_SECRET)
        has_service_key = bool(settings.SUPABASE_SERVICE_KEY)

        if not has_secret or not has_service_key:
            return {
                "status": "degraded",
                "jwt_secret_configured": has_secret,
                "service_key_configured": has_service_key,
            }

        return {
            "status": "healthy",
            "jwt_secret_configured": has_secret,
            "service_key_configured": has_service_key,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


def _check_stripe() -> dict[str, Any]:
    """Check Stripe API key configuration."""
    from server.app.config import settings

    has_key = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY != "sk_test_placeholder")
    has_webhook = bool(settings.STRIPE_WEBHOOK_SECRET and settings.STRIPE_WEBHOOK_SECRET != "whsec_placeholder")

    return {
        "status": "healthy" if has_key else "unconfigured",
        "api_key_configured": has_key,
        "webhook_secret_configured": has_webhook,
    }
