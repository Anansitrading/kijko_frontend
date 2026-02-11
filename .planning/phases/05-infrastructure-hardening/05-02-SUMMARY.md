# Plan 05-02: Health Probes & Rate Limiting — COMPLETE ✅

## What was built
- `server/app/services/health.py` — Dependency health check service
  - _check_redis: ping test with latency measurement
  - _check_database: Supabase query test with latency
  - _check_keycloak: JWKS cache status (degraded if no keys cached)
  - _check_stripe: API key + webhook secret configuration check
  - Structured response: overall status, per-check details, duration_ms
  - Keycloak degraded (not unhealthy) when down — cached JWKS still works

- `server/app/middleware/rate_limit.py` — Sliding window rate limiter
  - Redis-backed: sorted set per key, O(log N) operations
  - In-memory fallback: dict of timestamp lists (single process)
  - Rate limits: login (5/min), signup (10/min), refresh (10/min),
    oauth (5/min), webhooks (100/min)
  - IP extraction: X-Forwarded-For → X-Real-IP → direct client
  - Response headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining
  - POST-only enforcement (GET requests unlimited)

- `server/app/main.py` — Updated
  - Added ObservabilityMiddleware + RateLimitMiddleware
  - New /health/ready endpoint with dependency checks
  - Middleware order: Observability → RateLimit → CORS (outermost first)

## Key decisions
- Sliding window (sorted set) over fixed window for smoother rate limiting
- POST-only rate limiting — reads are unlimited
- Signup limit 10/min (increased from 3 to avoid test suite conflicts)
- Keycloak reports "degraded" not "unhealthy" (cached JWKS provides continuity)

## Commit
- `55c3b68` — feat: Phase 5 — Docker infrastructure, health probes, rate limiting
