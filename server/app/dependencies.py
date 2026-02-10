"""FastAPI dependency injection for external services."""

from functools import lru_cache
from typing import AsyncGenerator

import stripe
from supabase import create_client, Client as SupabaseClient

from server.app.config import settings


@lru_cache()
def get_supabase() -> SupabaseClient:
    """Get cached Supabase client using service_role key.

    Uses service_role for server-side operations. RLS context
    is set per-request via middleware.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_supabase_anon() -> SupabaseClient:
    """Get Supabase client with anon key for public operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


_redis_pool = None


async def get_redis():
    """Get async Redis connection from pool.

    Connection pool is initialized on first call and reused.
    """
    global _redis_pool
    if _redis_pool is None:
        import redis.asyncio as aioredis
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


def get_stripe():
    """Configure and return the stripe module.

    Sets the API key on the stripe module and returns it
    for use in route handlers.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe
