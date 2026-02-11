"""Shared test fixtures for Kijko backend tests.

Provides:
- Supabase client fixtures
- Multi-tenant context fixtures for RLS testing
- Cleanup helpers for test data isolation
"""

import os
import pytest
from uuid import UUID

# Set test-safe defaults for required service keys (supabase 2.28+ validates non-empty)
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key-not-for-production")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key-not-for-production")
os.environ.setdefault(
    "CORS_ORIGINS",
    '["http://localhost:1420","http://localhost:5173","https://app.kijko.nl"]',
)

# Test org/user UUIDs — deterministic for test isolation
ORG_A_ID = UUID("00000000-0000-0000-0000-000000000001")
ORG_B_ID = UUID("00000000-0000-0000-0000-000000000002")
USER_A1_ID = UUID("00000000-0000-0000-0000-000000000011")  # User 1 in Org A
USER_A2_ID = UUID("00000000-0000-0000-0000-000000000012")  # User 2 in Org A
USER_B1_ID = UUID("00000000-0000-0000-0000-000000000021")  # User 1 in Org B


@pytest.fixture(scope="session")
def supabase_client():
    """Get a Supabase client using service_role key.

    Requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.
    Tests are skipped if not configured.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key or "placeholder" in url or "placeholder" in key:
        pytest.skip("Supabase credentials not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY")

    from supabase import create_client
    return create_client(url, key)


@pytest.fixture
def org_a_context():
    """Context dict for Organization A, User 1."""
    return {
        "org_id": str(ORG_A_ID),
        "user_id": str(USER_A1_ID),
    }


@pytest.fixture
def org_a_user2_context():
    """Context dict for Organization A, User 2."""
    return {
        "org_id": str(ORG_A_ID),
        "user_id": str(USER_A2_ID),
    }


@pytest.fixture
def org_b_context():
    """Context dict for Organization B, User 1."""
    return {
        "org_id": str(ORG_B_ID),
        "user_id": str(USER_B1_ID),
    }


@pytest.fixture
def test_prefix():
    """Unique prefix for test data to avoid collisions.

    All test data names should start with this prefix for easy cleanup.
    """
    import time
    return f"__test_{int(time.time())}_"
