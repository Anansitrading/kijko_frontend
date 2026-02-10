"""Kijko API — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.config import settings
from server.app.routers.auth import router as auth_router
from server.app.routers.billing import router as billing_router
from server.app.routers.executions import router as executions_router
from server.app.routers.habits import router as habits_router
from server.app.routers.projects import router as projects_router
from server.app.routers.reflexes import router as reflexes_router
from server.app.routers.skills import router as skills_router
from server.app.routers.webhooks import router as webhooks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    # Startup
    print(f"Starting {settings.APP_TITLE} v{settings.APP_VERSION}")

    # Initialize Keycloak OIDC discovery (non-blocking, best-effort)
    try:
        from server.app.services.keycloak import get_keycloak
        keycloak = get_keycloak()
        await keycloak.discover_oidc()
    except Exception as e:
        print(f"Warning: OIDC discovery failed (will retry on first auth): {e}")

    yield

    # Shutdown
    from server.app.dependencies import _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()

    # Close Keycloak HTTP client
    try:
        from server.app.services.keycloak import get_keycloak
        keycloak = get_keycloak()
        await keycloak.close()
    except Exception:
        pass

    print("Shutdown complete")


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="Production API for Kijko AI Developer Tools platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health Endpoint ---
@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint — returns server status."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


# --- Routers ---
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(projects_router, prefix=settings.API_PREFIX)
app.include_router(skills_router, prefix=settings.API_PREFIX)
app.include_router(habits_router, prefix=settings.API_PREFIX)
app.include_router(reflexes_router, prefix=settings.API_PREFIX)
app.include_router(executions_router, prefix=settings.API_PREFIX)
app.include_router(billing_router, prefix=settings.API_PREFIX)
app.include_router(webhooks_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["system"])
async def root():
    """Root endpoint — API information."""
    return {
        "name": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
