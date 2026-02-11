"""Observability middleware — request logging, timing, and request ID tracking.

Adds X-Request-ID header to all responses for tracing.
Logs request/response with timing information.
Warns on slow requests (>1s).
"""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("kijko.http")


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging and tracing.

    Adds:
    - X-Request-ID header (generated if not provided)
    - X-Process-Time header (request duration in ms)
    - Structured logging for each request
    - Slow request warnings
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate or extract request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])

        # Time the request
        start = time.monotonic()

        # Process request
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.error(
                "request_id=%s method=%s path=%s status=500 duration_ms=%d error=%s",
                request_id, request.method, request.url.path, duration_ms, str(exc),
            )
            raise

        duration_ms = int((time.monotonic() - start) * 1000)

        # Add tracing headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms}ms"

        # Log request (skip health checks to reduce noise)
        if request.url.path not in ("/health", "/", "/docs", "/openapi.json"):
            log_level = logging.WARNING if duration_ms > 1000 else logging.INFO
            logger.log(
                log_level,
                "request_id=%s method=%s path=%s status=%d duration_ms=%d",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

            if duration_ms > 1000:
                logger.warning(
                    "SLOW REQUEST: %s %s took %dms (request_id=%s)",
                    request.method, request.url.path, duration_ms, request_id,
                )

        return response
