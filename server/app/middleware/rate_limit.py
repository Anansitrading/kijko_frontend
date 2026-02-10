"""Rate limiting middleware — protect auth endpoints from brute force.

Uses Redis for distributed rate limiting with sliding window.
Configurable per-endpoint limits.
"""

import time
from typing import Callable

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


# Rate limit configuration: path_prefix → (max_requests, window_seconds)
RATE_LIMITS = {
    "/api/v1/auth/login": (5, 60),       # 5 attempts per minute
    "/api/v1/auth/signup": (10, 60),      # 10 signups per minute
    "/api/v1/auth/refresh": (10, 60),     # 10 refreshes per minute
    "/api/v1/auth/oauth": (5, 60),        # 5 OAuth attempts per minute
    "/api/v1/webhooks/stripe": (100, 60), # 100 webhook calls per minute
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis-backed rate limiting middleware.

    Uses sliding window counter pattern.
    Falls back to in-memory tracking if Redis unavailable.
    """

    def __init__(self, app):
        super().__init__(app)
        self._memory_store: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        # Check if this path has rate limits
        for path_prefix, (max_requests, window_seconds) in RATE_LIMITS.items():
            if request.url.path.startswith(path_prefix) and request.method == "POST":
                client_ip = self._get_client_ip(request)
                key = f"rate:{path_prefix}:{client_ip}"

                allowed = await self._check_rate_limit(
                    key, max_requests, window_seconds,
                )

                if not allowed:
                    raise HTTPException(
                        status_code=429,
                        detail="Too many requests. Please try again later.",
                        headers={
                            "Retry-After": str(window_seconds),
                            "X-RateLimit-Limit": str(max_requests),
                            "X-RateLimit-Remaining": "0",
                        },
                    )
                break

        return await call_next(request)

    async def _check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int,
    ) -> bool:
        """Check if request is within rate limit.

        Tries Redis first, falls back to in-memory.
        """
        try:
            return await self._check_redis(key, max_requests, window_seconds)
        except Exception:
            return self._check_memory(key, max_requests, window_seconds)

    async def _check_redis(
        self, key: str, max_requests: int, window_seconds: int,
    ) -> bool:
        """Redis-backed sliding window rate limit."""
        from server.app.dependencies import get_redis

        redis = await get_redis()
        now = time.time()

        # Use sorted set for sliding window
        pipeline = redis.pipeline()
        pipeline.zremrangebyscore(key, 0, now - window_seconds)
        pipeline.zadd(key, {str(now): now})
        pipeline.zcard(key)
        pipeline.expire(key, window_seconds + 1)
        results = await pipeline.execute()

        current_count = results[2]
        return current_count <= max_requests

    def _check_memory(
        self, key: str, max_requests: int, window_seconds: int,
    ) -> bool:
        """In-memory fallback rate limit (single process only)."""
        now = time.time()
        cutoff = now - window_seconds

        if key not in self._memory_store:
            self._memory_store[key] = []

        # Clean old entries
        self._memory_store[key] = [
            ts for ts in self._memory_store[key] if ts > cutoff
        ]

        # Check limit
        if len(self._memory_store[key]) >= max_requests:
            return False

        self._memory_store[key].append(now)
        return True

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Extract client IP from request, considering proxy headers."""
        # Check X-Forwarded-For (reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Check X-Real-IP (nginx)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fall back to direct client
        return request.client.host if request.client else "unknown"
