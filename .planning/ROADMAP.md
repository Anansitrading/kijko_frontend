# Roadmap: Kijko Backend

**Created:** 2026-02-10
**Phases:** 5
**Requirements:** 101 mapped
**Execution:** Parallel (YOLO mode)

## Phase Overview

| # | Phase | Goal | Requirements | Plans (est) | Wave Type |
|---|-------|------|--------------|-------------|-----------|
| 1 | Foundation & Auth | Database, RLS, FastAPI scaffold, Keycloak auth middleware | FOUND-01..06, AUTH-01..08, SECR-01..05 | 4 | SEQUENTIAL |
| 2 | Core CRUD APIs | All domain endpoints: Projects, Skills, Habits, Reflexes, Executions, Analytics | PROJ-01..22, SKIL-01..14, HBIT-01..11, RFLX-01..12, EXEC-01..05, ANLT-01 | 6 | ASYNC |
| 3 | Billing & Payments | Stripe integration, iDEAL, subscriptions, webhooks, usage metering, quotas | BILL-01..15 | 3 | SEMI_ASYNC |
| 4 | Real-time & Compliance | WebSocket server, GDPR endpoints, Langfuse observability | WSCK-01..05, SECR-06 | 3 | ASYNC |
| 5 | Infrastructure & Hardening | Docker Compose, health endpoints, CI/CD, rate limiting, security hardening | INFR-01..06, TEST-01..05 | 4 | ASYNC |

## Phase Details

### Phase 1: Foundation & Auth
**Goal:** Establish the foundational backend: database schema deployed, RLS enforced, FastAPI app running, auth middleware validating Keycloak JWTs. Nothing else can be built without this.

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, SECR-01, SECR-02, SECR-03, SECR-04, SECR-05

**Success Criteria:**
1. FastAPI server starts and serves /health returning 200
2. All 3 SQL migrations deployed successfully to Supabase
3. RLS policies active on every table — verified by multi-user query test
4. JWT middleware validates Keycloak tokens and rejects expired/invalid tokens
5. Auth endpoints (signup, login, refresh, logout) return correct responses

**Dependencies:** None (this is the foundation)
**Wave Type:** SEQUENTIAL — everything depends on this completing first
**Plans:** 4 plans in 4 waves (SEQUENTIAL)

Plans:
- [ ] 01-01-PLAN.md — FastAPI scaffold, config, DI, health endpoint
- [ ] 01-02-PLAN.md — Deploy SQL migrations, create Pydantic models
- [ ] 01-03-PLAN.md — RLS policies, SECURITY DEFINER helpers, isolation tests
- [ ] 01-04-PLAN.md — Keycloak auth middleware, auth endpoints, JWT validation

**Linear Tickets:** KIJ-237, KIJ-262, KIJ-265, KIJ-313, KIJ-323, KIJ-245, KIJ-236

---

### Phase 2: Core CRUD APIs
**Goal:** Implement all domain CRUD endpoints matching the frontend TypeScript interfaces. After this phase, every service file in the frontend can be wired to a real API endpoint.

**Requirements:** PROJ-01..22, SKIL-01..14, HBIT-01..11, RFLX-01..12, EXEC-01..05, ANLT-01

**Success Criteria:**
1. All 22 project endpoints return correct responses with real Supabase data
2. Skills CRUD + execution queues work correctly via Celery
3. Habits CRUD with cron validation returns valid schedule data
4. Reflexes CRUD with webhook endpoint generation works
5. Execution history endpoint returns paginated results with proper filtering
6. RLS enforces tenant isolation on all endpoints (verified by multi-user test)

**Dependencies:** Phase 1 (auth middleware, database, RLS)
**Wave Type:** ASYNC — domain routers are independent and can be built in parallel
**Estimated Plans:** 6 (projects, skills, habits, reflexes, executions+analytics, Celery workers)

**Linear Tickets:** KIJ-261, KIJ-264, KIJ-325, KIJ-259

---

### Phase 3: Billing & Payments
**Goal:** Complete Stripe integration with iDEAL for Dutch market, subscription management, webhook processing, and usage quota enforcement per plan tier.

**Requirements:** BILL-01..15

**Success Criteria:**
1. Stripe checkout session creates with iDEAL payment method
2. Webhook handler processes subscription lifecycle events (with signature verification)
3. Usage metrics tracked per tenant and enforced per plan tier
4. Free tier users receive 429 when exceeding quota limits
5. All billing calculations use Decimal (verified by test assertions)

**Dependencies:** Phase 1 (auth), Phase 2 (usage tracking context)
**Wave Type:** SEMI_ASYNC — Stripe setup must happen before webhook handler and quota enforcement
**Estimated Plans:** 3 (Stripe integration, webhook handler, usage metering + quotas)

**Linear Tickets:** KIJ-318, KIJ-324, KIJ-317, KIJ-249, KIJ-263, KIJ-248, KIJ-250

---

### Phase 4: Real-time & Compliance
**Goal:** WebSocket server for real-time events, GDPR data subject request endpoints, and observability instrumentation.

**Requirements:** WSCK-01..05, SECR-06

**Success Criteria:**
1. WebSocket server accepts authenticated connections and delivers events to rooms
2. Ingestion progress events stream in real-time to connected clients
3. GDPR export endpoint generates complete user data archive
4. GDPR deletion endpoint cascades through all related tables
5. Socket.IO reconnection handles network interruptions gracefully

**Dependencies:** Phase 1 (auth for WebSocket JWT), Phase 2 (data to stream/export)
**Wave Type:** ASYNC — WebSocket and GDPR can be built independently
**Estimated Plans:** 3 (WebSocket server, GDPR endpoints, observability)

**Linear Tickets:** KIJ-321, KIJ-316, KIJ-314, KIJ-246

---

### Phase 5: Infrastructure & Hardening
**Goal:** Production-ready infrastructure: Docker Compose for local dev, health endpoints with dependency checks, rate limiting, security hardening, and comprehensive test suite.

**Requirements:** INFR-01..06, TEST-01..05

**Success Criteria:**
1. Docker Compose brings up full stack (API, Redis, Celery) in one command
2. /health endpoint checks DB, Redis, Stripe, Keycloak connectivity
3. Rate limiting enforced on auth endpoints (5 attempts/minute)
4. Test suite achieves 80%+ coverage on auth, billing, and RLS code paths
5. CORS restricted to app.kijko.nl and localhost:3000

**Dependencies:** Phases 1-4 (all features must exist to test against)
**Wave Type:** ASYNC — Docker, health, tests, and security can be parallelized
**Estimated Plans:** 4 (Docker Compose, health endpoints, test suite, security hardening)

**Linear Tickets:** KIJ-251, KIJ-315, KIJ-309, KIJ-326, KIJ-327, KIJ-253, KIJ-252, KIJ-269, KIJ-270

---

## Requirement Coverage

All 101 v1 requirements mapped to exactly one phase. Coverage: 100% ✓

| Category | Count | Phase |
|----------|-------|-------|
| Foundation | 6 | Phase 1 |
| Authentication | 8 | Phase 1 |
| Security | 6 | Phase 1-5 |
| Projects | 22 | Phase 2 |
| Skills | 14 | Phase 2 |
| Habits | 11 | Phase 2 |
| Reflexes | 12 | Phase 2 |
| Executions | 5 | Phase 2 |
| Analytics | 1 | Phase 2 |
| Billing | 15 | Phase 3 |
| WebSocket | 5 | Phase 4 |
| Infrastructure | 6 | Phase 5 |
| Testing | 5 | Phase 1-5 |

---
*Roadmap created: 2026-02-10*
*Last updated: 2026-02-10 after initial creation*
