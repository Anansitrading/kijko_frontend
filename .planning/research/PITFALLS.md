# Pitfalls Research

**Domain:** SaaS Backend for AI Developer Tools
**Researched:** 2026-02-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: RLS Misconfiguration Leaking Tenant Data

**What goes wrong:** A single missing or misconfigured RLS policy allows users to see/modify other tenants' data. One leaked query = trust destruction.

**Why it happens:** RLS policies are easy to write wrong — missing auth.uid() check, wrong column reference, policy on SELECT but not DELETE.

**How to avoid:**
- Enable RLS on EVERY table with organization_id
- Test every endpoint with 2+ user contexts (verify tenant isolation)
- Use SECURITY DEFINER helpers for RLS-safe operations
- Never use service_role without explicitly setting auth context

**Warning signs:** Tests pass but only test one user, queries return more rows than expected

**Phase to address:** Phase 1 (Foundation) — RLS policies must be correct before any CRUD

---

### Pitfall 2: Stripe Webhook Delivery Failures

**What goes wrong:** Webhooks arrive out of order, duplicate, or are missed entirely. Subscription state becomes inconsistent.

**Why it happens:** Network issues, webhook endpoint errors, missing idempotency.

**How to avoid:**
- Verify webhook signatures (stripe.Webhook.construct_event)
- Implement idempotency keys (track processed event IDs)
- Handle events out of order (check timestamps, use event types for state machines)
- Set up webhook monitoring in Stripe dashboard

**Warning signs:** Subscription status doesn't match Stripe dashboard, invoices marked paid but user shows free tier

**Phase to address:** Phase 3 (Billing) — webhook handler must be bulletproof

---

### Pitfall 3: JWT Secret/Key Mismatch Between Services

**What goes wrong:** Keycloak signs JWTs with one key, FastAPI validates with another, or tokens from one environment work in another.

**Why it happens:** Keycloak realm keys rotate, environment variable mismatch, using symmetric (HS256) instead of asymmetric (RS256).

**How to avoid:**
- Use OIDC discovery endpoint (/.well-known/openid-configuration) for dynamic key fetch
- Cache JWKS but refresh on validation failure
- Always use RS256 (asymmetric) in production
- Validate issuer, audience, and expiry claims

**Warning signs:** 401 errors despite valid-looking tokens, "signature verification failed" errors

**Phase to address:** Phase 1 (Foundation) — auth middleware setup

---

### Pitfall 4: Blocking AI Execution in Request Handlers

**What goes wrong:** Claude/Gemini calls take 10-60 seconds. If awaited in the request handler, the connection times out, workers are blocked, and the app becomes unresponsive.

**Why it happens:** Simple implementation: get request → call API → return result. Doesn't account for real-world latency.

**How to avoid:**
- Queue AI execution to Celery immediately
- Return execution ID to client
- Push results via WebSocket when complete
- Set reasonable timeouts on external API calls

**Warning signs:** 504 Gateway Timeout on skill execution, CPU/memory spikes during execution

**Phase to address:** Phase 2 (Core API) — skill execution architecture

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Mock services for untested integrations | Ship faster | Dead code accumulation | MVP only, with TODO tracking |
| Single Celery worker | Simple deployment | Queue bottleneck under load | Until > 100 concurrent users |
| In-memory rate limiting | No Redis dependency | Doesn't work with multiple workers | Single-worker dev only |
| Hardcoded CORS origins | Quick setup | Security risk if forgotten | Never in production |
| Skip webhook signature verification | Faster development | Complete security bypass | NEVER |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth | Using anon key for server operations | Use service_role key with explicit auth context |
| Stripe | Processing events without idempotency | Track event IDs, handle duplicates gracefully |
| Keycloak | Hardcoding JWKS keys | Use OIDC discovery with caching and refresh |
| Redis | No connection pooling | Use connection pool, handle reconnects |
| Socket.IO | Not setting up Redis adapter | Required for multi-worker WebSocket |
| Celery | Losing task results | Use result_backend, implement retry with backoff |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries | Slow list endpoints | Use .select("*, relation(*)") joins | > 50 items per page |
| Unbounded list queries | Memory spikes | Always paginate, default limit 50 | > 1000 records |
| Synchronous file upload | Request timeout | Stream to Supabase Storage, chunked upload | > 10MB files |
| No connection pooling | Connection exhaustion | Supabase Pooler (PgBouncer), Redis pool | > 50 concurrent connections |
| Socket.IO without rooms | Broadcasting to all | Use rooms per project/user | > 100 concurrent WebSocket clients |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing API keys in plaintext | Key theft | Encrypt at rest with Fernet, env vars for service keys |
| CORS wildcard in production | CSRF attacks | Restrict to app.kijko.nl, localhost:3000 |
| No rate limiting on auth endpoints | Brute force attacks | 5 attempts/minute for login, exponential backoff |
| Missing input validation | SQL injection, XSS | Pydantic models for all inputs, parameterized queries via Supabase |
| Webhook endpoint without signature verification | Forged events | ALWAYS verify Stripe signatures |
| float for billing calculations | Rounding errors (€0.01 discrepancies) | Python Decimal for all money |

## "Looks Done But Isn't" Checklist

- [ ] **Auth:** Token refresh mechanism tested — verify expired tokens trigger refresh, not 401 loop
- [ ] **RLS:** Multi-tenant isolation tested with 2+ users — verify user A can't see user B's data
- [ ] **Billing:** Webhook retry handling tested — verify retried events don't create duplicate subscriptions
- [ ] **WebSocket:** Reconnection tested — verify client reconnects after network drop
- [ ] **Background tasks:** Error handling tested — verify failed Celery tasks are retried with backoff
- [ ] **File upload:** Size limits enforced — verify > 100MB upload is rejected before processing
- [ ] **Rate limiting:** Per-plan limits enforced — verify free tier can't exceed 1000 API calls
- [ ] **GDPR:** Cascade deletion tested — verify deleting user removes ALL related data

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS data leak | Phase 1 (Foundation) | Multi-user test suite |
| Webhook failures | Phase 3 (Billing) | Webhook replay test |
| JWT key mismatch | Phase 1 (Foundation) | OIDC discovery integration test |
| Blocking AI execution | Phase 2 (Core API) | Load test with concurrent executions |
| Missing rate limiting | Phase 2 (Core API) | Rate limit integration test |
| Float billing errors | Phase 3 (Billing) | Decimal assertion in billing tests |

## Sources

- Stripe webhook best practices (stripe.com/docs/webhooks/best-practices)
- Supabase RLS troubleshooting guide
- FastAPI security documentation
- OWASP API Security Top 10
- Implementation plan: /home/devuser/Desktop/kijko-backend-implementation-plan.md

---
*Pitfalls research for: SaaS Backend (AI Developer Tools)*
*Researched: 2026-02-10*
