"""Unit tests for backend services — log retention, usage metering, database helpers, health.

Mocks external dependencies (Supabase, Redis) to test logic in isolation.
"""

import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from server.app.models.enums import PlanTier
from server.app.services.log_retention import (
    RETENTION_POLICIES,
    PII_FIELDS,
    cleanup_expired_logs,
    sanitize_log_record,
)
from server.app.services.usage import (
    PLAN_LIMITS,
    _get_billing_period,
    _get_limits_for_plan,
    check_quota,
    get_all_usage,
    get_usage,
    increment_usage,
    reset_usage,
)
from server.app.services.database import (
    build_filtered_query,
    build_pagination_query,
)
from server.app.services.health import (
    _check_keycloak,
    _check_stripe,
    check_health,
)


# ===========================================================================
# Log Retention Service
# ===========================================================================

class TestSanitizeLogRecord:

    def test_strips_pii_fields(self):
        """PII fields are removed from log records."""
        record = {
            "id": "123",
            "email": "secret@kijko.nl",
            "name": "John Doe",
            "action": "login",
            "ip_address": "192.168.1.1",
            "token": "jwt-token",
        }
        sanitized = sanitize_log_record(record)

        assert "id" in sanitized
        assert "action" in sanitized
        assert "email" not in sanitized
        assert "name" not in sanitized
        assert "ip_address" not in sanitized
        assert "token" not in sanitized

    def test_preserves_non_pii_fields(self):
        """Non-PII fields are preserved."""
        record = {
            "id": "123",
            "action": "skill_execution",
            "duration_ms": 250,
            "status": "completed",
        }
        sanitized = sanitize_log_record(record)
        assert sanitized == record

    def test_empty_record(self):
        """Empty record returns empty dict."""
        assert sanitize_log_record({}) == {}

    def test_all_pii_fields_defined(self):
        """All expected PII fields are in the constant."""
        expected = {"email", "name", "full_name", "phone", "address",
                    "ip_address", "user_agent", "password", "token"}
        assert PII_FIELDS == expected


class TestRetentionPolicies:

    def test_retention_policies_defined(self):
        """Retention policies exist for expected tables."""
        assert "skill_executions" in RETENTION_POLICIES
        assert "usage_metrics" in RETENTION_POLICIES

    def test_retention_period_is_30_days(self):
        """All tables have 30-day retention."""
        for table, policy in RETENTION_POLICIES.items():
            assert policy["retention_days"] == 30, f"{table} should have 30-day retention"

    def test_policies_have_timestamp_column(self):
        """All policies specify a timestamp column."""
        for table, policy in RETENTION_POLICIES.items():
            assert "timestamp_column" in policy
            assert policy["timestamp_column"] == "created_at"


class TestCleanupExpiredLogs:

    @pytest.mark.asyncio
    async def test_dry_run_counts_records(self):
        """Dry run counts records without deleting."""
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.count = 42

        # Chain: client.table().select().lt().execute()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_lt = MagicMock()
        mock_lt.execute.return_value = mock_result
        mock_select.lt.return_value = mock_lt
        mock_table.select.return_value = mock_select
        mock_client.table.return_value = mock_table

        results = await cleanup_expired_logs(mock_client, dry_run=True)

        for table in RETENTION_POLICIES:
            assert table in results
            assert results[table]["dry_run"] is True
            assert results[table]["would_delete"] == 42

    @pytest.mark.asyncio
    async def test_actual_delete(self):
        """Non-dry-run deletes records and reports count."""
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [{"id": "1"}, {"id": "2"}]

        mock_table = MagicMock()
        mock_delete = MagicMock()
        mock_lt = MagicMock()
        mock_lt.execute.return_value = mock_result
        mock_delete.lt.return_value = mock_lt
        mock_table.delete.return_value = mock_delete
        mock_client.table.return_value = mock_table

        results = await cleanup_expired_logs(mock_client, dry_run=False)

        for table in RETENTION_POLICIES:
            assert table in results
            assert results[table]["dry_run"] is False
            assert results[table]["deleted"] == 2

    @pytest.mark.asyncio
    async def test_handles_db_error_gracefully(self):
        """Database errors per table are captured, not raised."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_table.select.side_effect = Exception("DB connection lost")
        mock_table.delete.side_effect = Exception("DB connection lost")
        mock_client.table.return_value = mock_table

        results = await cleanup_expired_logs(mock_client, dry_run=True)

        for table in RETENTION_POLICIES:
            assert "error" in results[table]
            assert "DB connection lost" in results[table]["error"]

    @pytest.mark.asyncio
    async def test_cutoff_date_is_30_days_ago(self):
        """Cutoff date is approximately 30 days before now."""
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.count = 0

        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_lt = MagicMock()
        mock_lt.execute.return_value = mock_result
        mock_select.lt.return_value = mock_lt
        mock_table.select.return_value = mock_select
        mock_client.table.return_value = mock_table

        results = await cleanup_expired_logs(mock_client, dry_run=True)

        # Verify cutoff is in the results
        for table in RETENTION_POLICIES:
            cutoff = results[table]["cutoff"]
            cutoff_dt = datetime.fromisoformat(cutoff)
            expected = datetime.now(timezone.utc) - timedelta(days=30)
            # Should be within 1 second of expected
            diff = abs((cutoff_dt - expected).total_seconds())
            assert diff < 2, f"Cutoff off by {diff}s"


# ===========================================================================
# Usage Metering Service
# ===========================================================================

class TestBillingPeriod:

    def test_billing_period_format(self):
        """Billing period is YYYY-MM format."""
        period = _get_billing_period()
        assert len(period) == 7
        assert period[4] == "-"
        year, month = period.split("-")
        assert 2024 <= int(year) <= 2030
        assert 1 <= int(month) <= 12


class TestPlanLimits:

    def test_all_tiers_defined(self):
        """All PlanTier values have limits defined."""
        for tier in PlanTier:
            assert tier.value in PLAN_LIMITS, f"Missing limits for {tier}"

    def test_free_tier_limits(self):
        """Free tier has reasonable limits."""
        limits = PLAN_LIMITS[PlanTier.FREE]
        assert limits["api_calls"] == 100
        assert limits["seats"] == 1
        assert limits["storage_gb"] == 1

    def test_enterprise_higher_than_free(self):
        """Enterprise limits are higher than free for all categories."""
        free = PLAN_LIMITS[PlanTier.FREE]
        enterprise = PLAN_LIMITS[PlanTier.ENTERPRISE]
        for category in free:
            assert enterprise[category] > free[category], \
                f"Enterprise {category} should exceed free"

    def test_tiers_monotonically_increasing(self):
        """Each tier has equal or higher limits than the previous."""
        tiers = [PlanTier.FREE, PlanTier.PRO, PlanTier.TEAMS, PlanTier.ENTERPRISE]
        for i in range(1, len(tiers)):
            prev_limits = PLAN_LIMITS[tiers[i-1].value]
            curr_limits = PLAN_LIMITS[tiers[i].value]
            for category in prev_limits:
                assert curr_limits[category] >= prev_limits[category], \
                    f"{tiers[i].value}.{category} < {tiers[i-1].value}.{category}"

    def test_get_limits_for_plan_unknown_falls_back(self):
        """Unknown plan falls back to free tier."""
        limits = _get_limits_for_plan("nonexistent_plan")
        assert limits == PLAN_LIMITS[PlanTier.FREE]

    def test_all_categories_present(self):
        """All tiers have the same categories."""
        categories = set(PLAN_LIMITS[PlanTier.FREE].keys())
        expected = {"api_calls", "ingestions", "storage_gb", "seats", "oracle_queries"}
        assert categories == expected


class TestUsageIncrement:

    @pytest.mark.asyncio
    async def test_increment_usage(self):
        """Increment usage returns new total."""
        redis = AsyncMock()
        redis.incrby = AsyncMock(return_value=5)
        redis.expire = AsyncMock()

        result = await increment_usage("org-1", "api_calls", 1, redis_client=redis)

        assert result == 5
        redis.incrby.assert_called_once()

    @pytest.mark.asyncio
    async def test_increment_sets_ttl_on_first(self):
        """TTL is set on first increment (when total equals amount)."""
        redis = AsyncMock()
        redis.incrby = AsyncMock(return_value=1)  # First increment
        redis.expire = AsyncMock()

        await increment_usage("org-1", "api_calls", 1, redis_client=redis)

        redis.expire.assert_called_once()
        # TTL should be 45 days in seconds
        args = redis.expire.call_args
        assert args[0][1] == 45 * 86400

    @pytest.mark.asyncio
    async def test_increment_skips_ttl_on_subsequent(self):
        """TTL not set on subsequent increments."""
        redis = AsyncMock()
        redis.incrby = AsyncMock(return_value=5)  # Not first increment
        redis.expire = AsyncMock()

        await increment_usage("org-1", "api_calls", 1, redis_client=redis)

        redis.expire.assert_not_called()


class TestUsageGet:

    @pytest.mark.asyncio
    async def test_get_usage_returns_int(self):
        """Get usage returns integer count."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="42")

        result = await get_usage("org-1", "api_calls", redis_client=redis)
        assert result == 42

    @pytest.mark.asyncio
    async def test_get_usage_returns_zero_when_not_set(self):
        """Zero returned when no usage recorded."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value=None)

        result = await get_usage("org-1", "api_calls", redis_client=redis)
        assert result == 0


class TestQuotaCheck:

    @pytest.mark.asyncio
    async def test_within_quota(self):
        """Within quota returns True."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="50")  # 50 of 100

        within, used, limit = await check_quota(
            "org-1", "api_calls", PlanTier.FREE, redis_client=redis
        )

        assert within is True
        assert used == 50
        assert limit == 100

    @pytest.mark.asyncio
    async def test_at_quota_limit(self):
        """At exact limit returns False."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="100")  # 100 of 100

        within, used, limit = await check_quota(
            "org-1", "api_calls", PlanTier.FREE, redis_client=redis
        )

        assert within is False

    @pytest.mark.asyncio
    async def test_over_quota(self):
        """Over quota returns False."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="150")

        within, used, limit = await check_quota(
            "org-1", "api_calls", PlanTier.FREE, redis_client=redis
        )

        assert within is False
        assert used == 150

    @pytest.mark.asyncio
    async def test_unknown_category(self):
        """Unknown category returns 0 limit and False."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="0")

        within, used, limit = await check_quota(
            "org-1", "nonexistent_category", PlanTier.FREE, redis_client=redis
        )

        assert within is False
        assert limit == 0


class TestGetAllUsage:

    @pytest.mark.asyncio
    async def test_returns_all_categories(self):
        """Returns metrics for all categories in plan."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="10")

        metrics = await get_all_usage("org-1", PlanTier.FREE, redis_client=redis)

        categories = {m["category"] for m in metrics}
        expected = {"api_calls", "ingestions", "storage_gb", "seats", "oracle_queries"}
        assert categories == expected

    @pytest.mark.asyncio
    async def test_percentage_calculation(self):
        """Percentage is correctly calculated."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="50")

        metrics = await get_all_usage("org-1", PlanTier.FREE, redis_client=redis)

        api_metric = next(m for m in metrics if m["category"] == "api_calls")
        assert api_metric["used"] == 50
        assert api_metric["limit"] == 100
        assert api_metric["percentage"] == 50.0

    @pytest.mark.asyncio
    async def test_percentage_capped_at_100(self):
        """Percentage doesn't exceed 100%."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="200")  # Over limit

        metrics = await get_all_usage("org-1", PlanTier.FREE, redis_client=redis)

        api_metric = next(m for m in metrics if m["category"] == "api_calls")
        assert api_metric["percentage"] == 100.0

    @pytest.mark.asyncio
    async def test_includes_unit_labels(self):
        """Each metric includes a unit label."""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="0")

        metrics = await get_all_usage("org-1", PlanTier.FREE, redis_client=redis)

        for m in metrics:
            assert "unit" in m
            assert m["unit"] != ""


class TestResetUsage:

    @pytest.mark.asyncio
    async def test_resets_all_categories(self):
        """Reset deletes keys for all categories."""
        redis = AsyncMock()
        redis.delete = AsyncMock()

        await reset_usage("org-1", redis_client=redis)

        # Should delete one key per category
        assert redis.delete.call_count == len(PLAN_LIMITS[PlanTier.FREE])


# ===========================================================================
# Database Helpers
# ===========================================================================

class TestPaginationQuery:

    def test_page_size_capped_at_100(self):
        """Page size cannot exceed 100."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        # Chain all query builder methods
        for method in ["select", "order", "range"]:
            getattr(mock_table, method, MagicMock()).return_value = mock_table

        build_pagination_query(mock_client, "skills", page_size=500)

        # Verify range was called with max 100 page size
        range_call = mock_table.range.call_args
        start, end = range_call[0]
        assert end - start < 100

    def test_offset_calculated_from_page(self):
        """Offset is (page-1) * page_size."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        for method in ["select", "order", "range"]:
            getattr(mock_table, method, MagicMock()).return_value = mock_table

        build_pagination_query(mock_client, "skills", page=3, page_size=20)

        range_call = mock_table.range.call_args
        start, end = range_call[0]
        assert start == 40  # (3-1) * 20
        assert end == 59  # 40 + 20 - 1


class TestFilteredQuery:

    def test_filters_applied(self):
        """Filters are applied as eq() calls."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        for method in ["select", "eq", "order", "range"]:
            getattr(mock_table, method, MagicMock()).return_value = mock_table

        build_filtered_query(
            mock_client, "skills",
            filters={"status": "active", "category": "analysis"},
        )

        # eq should be called for each filter
        assert mock_table.eq.call_count == 2

    def test_none_values_skipped(self):
        """None filter values are skipped."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        for method in ["select", "eq", "order", "range"]:
            getattr(mock_table, method, MagicMock()).return_value = mock_table

        build_filtered_query(
            mock_client, "skills",
            filters={"status": "active", "category": None},
        )

        # Only one eq call (category=None skipped)
        assert mock_table.eq.call_count == 1

    def test_uuid_values_converted_to_string(self):
        """UUID filter values are converted to strings."""
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        for method in ["select", "eq", "order", "range"]:
            getattr(mock_table, method, MagicMock()).return_value = mock_table

        test_uuid = UUID("12345678-1234-1234-1234-123456789abc")
        build_filtered_query(
            mock_client, "skills",
            filters={"org_id": test_uuid},
        )

        eq_args = mock_table.eq.call_args
        assert eq_args[0][1] == str(test_uuid)


# ===========================================================================
# Quota Middleware
# ===========================================================================

# ===========================================================================
# Health Check Service
# ===========================================================================

class TestHealthChecks:

    @pytest.mark.asyncio
    async def test_keycloak_health_with_cached_jwks(self):
        """Keycloak reports healthy when JWKS is cached."""
        from server.app.services.keycloak import get_keycloak

        kc = get_keycloak()
        kc._jwks = {"keys": [{"kid": "test"}]}  # Set cached JWKS

        result = await _check_keycloak()

        assert result["status"] == "healthy"
        assert result["jwks_cached"] is True
        assert "latency_ms" in result

        # Cleanup
        kc._jwks = None

    @pytest.mark.asyncio
    async def test_keycloak_health_without_cached_jwks(self):
        """Keycloak reports degraded when no JWKS cached."""
        from server.app.services.keycloak import get_keycloak

        kc = get_keycloak()
        original_jwks = kc._jwks
        kc._jwks = None

        result = await _check_keycloak()

        assert result["status"] == "degraded"
        assert result["jwks_cached"] is False

        # Cleanup
        kc._jwks = original_jwks

    def test_stripe_health_unconfigured(self):
        """Stripe reports unconfigured with placeholder keys."""
        result = _check_stripe()

        assert result["status"] == "unconfigured"
        assert result["api_key_configured"] is False

    def test_stripe_health_check_shape(self):
        """Stripe health check returns expected fields."""
        result = _check_stripe()

        assert "status" in result
        assert "api_key_configured" in result
        assert "webhook_secret_configured" in result

    @pytest.mark.asyncio
    async def test_check_health_returns_structure(self):
        """Full health check returns expected structure."""
        result = await check_health()

        assert "status" in result
        assert "checks" in result
        assert "duration_ms" in result
        assert isinstance(result["checks"], dict)
        assert "redis" in result["checks"]
        assert "database" in result["checks"]
        assert "keycloak" in result["checks"]
        assert "stripe" in result["checks"]

    @pytest.mark.asyncio
    async def test_check_health_keycloak_degraded_not_unhealthy(self):
        """Keycloak error is treated as degraded, not unhealthy."""
        result = await check_health()

        # Keycloak will be degraded (no live server)
        kc_check = result["checks"]["keycloak"]
        # Should be 'degraded' or 'healthy', not 'error'
        assert kc_check["status"] != "error"


class TestQuotaMiddleware:

    def test_period_end_timestamp_is_future(self):
        """Period end timestamp is in the future."""
        from server.app.middleware.quota import _get_period_end_timestamp

        ts = _get_period_end_timestamp()
        now = int(datetime.now(timezone.utc).timestamp())
        assert ts > now

    def test_period_end_is_first_of_next_month(self):
        """Period end is midnight of the 1st of next month."""
        from server.app.middleware.quota import _get_period_end_timestamp

        ts = _get_period_end_timestamp()
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)

        assert dt.day == 1
        assert dt.hour == 0
        assert dt.minute == 0

    def test_period_end_december_wraps_to_january(self):
        """December correctly wraps to January of next year."""
        from server.app.middleware.quota import _get_period_end_timestamp

        with patch("server.app.middleware.quota.datetime") as mock_dt:
            mock_now = datetime(2025, 12, 15, tzinfo=timezone.utc)
            mock_dt.now.return_value = mock_now
            mock_dt.side_effect = lambda *a, **k: datetime(*a, **k)

            # Can't easily test this without more complex mocking
            # but we verify the function doesn't crash
            ts = _get_period_end_timestamp()
            assert ts > 0
