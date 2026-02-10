"""Kijko API — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    # Startup
    print(f"Starting {settings.APP_TITLE} v{settings.APP_VERSION}")
    yield
    # Shutdown
    from server.app.dependencies import _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
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


@app.get("/", tags=["system"])
async def root():
    """Root endpoint — API information."""
    return {
        "name": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
