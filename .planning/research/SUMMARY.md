# Research Summary: Kijko Backend

**Domain:** SaaS Backend for AI Developer Tools
**Researched:** 2026-02-10
**Overall confidence:** HIGH (stack constrained by existing ecosystem, frontend interfaces define API contracts)

## Executive Summary

The Kijko backend is a FastAPI application replacing 89 mock endpoints across 23 frontend service files. The architecture is pre-determined by two constraints: (1) the entire Oracle-Cortex ecosystem is Python, making FastAPI the natural choice, and (2) the frontend already defines exact TypeScript interfaces that the backend must match.

The critical path runs through authentication (Keycloak OIDC + Supabase RLS) → core CRUD APIs → billing (Stripe + iDEAL) → real-time events (WebSocket) → infrastructure hardening. Multi-tenancy via Row-Level Security is the single most important architectural decision — it enforces data isolation at the database level, eliminating the risk of application-level filter bugs.

The highest-risk areas are: RLS policy misconfiguration (data leak), Stripe webhook reliability (billing consistency), and blocking AI execution in request handlers (performance). All three have well-understood mitigations documented in the pitfalls analysis.

The Dutch market focus (iDEAL payments, BTW validation, KVK compliance) adds specific requirements to the billing layer but doesn't affect the overall architecture.

## Key Findings

**Stack:** Python FastAPI + Supabase (PostgreSQL/Auth) + Stripe + Redis + Celery + python-socketio. Stack is constrained by existing Oracle-Cortex Python ecosystem.

**Architecture:** Modular monolith with clear router/service/model separation. RLS at DB level for multi-tenancy. Celery workers for background tasks. Socket.IO for real-time events.

**Critical pitfall:** RLS misconfiguration is the #1 risk — one missing policy = tenant data leak. Test every endpoint with multiple user contexts.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation & Security** - Database schema, RLS policies, FastAPI scaffold, auth middleware
   - Addresses: Authentication, project structure, multi-tenancy
   - Avoids: RLS misconfiguration, JWT key mismatch

2. **Core CRUD APIs** - Projects, Skills, Habits, Reflexes, Executions endpoints
   - Addresses: 64 endpoints across 5 domains
   - Avoids: Blocking AI execution, N+1 queries

3. **Billing & Payments** - Stripe integration, iDEAL, subscriptions, webhooks, metering
   - Addresses: Subscription lifecycle, usage enforcement
   - Avoids: Webhook delivery failures, float billing errors

4. **Real-time & Integrations** - WebSocket server, Langfuse observability, HyperVisa, GDPR
   - Addresses: Live execution events, compliance
   - Avoids: Socket.IO scaling without Redis adapter

5. **Infrastructure & Hardening** - Docker Compose, CI/CD, health endpoints, security hardening
   - Addresses: Deployment, monitoring, operational readiness
   - Avoids: CORS misconfiguration, missing rate limiting

**Phase ordering rationale:**
- Auth + RLS MUST come first (everything depends on authenticated, tenant-scoped queries)
- Core APIs must exist before billing can enforce quotas
- WebSocket can be built alongside billing (independent)
- Infrastructure/hardening is last (needs all features to test against)

**Research flags for phases:**
- Phase 1: Needs careful Keycloak OIDC setup — validate with Perplexity for current best practices
- Phase 3: Stripe iDEAL integration is less documented than card payments — research Dutch-specific flows
- Phase 5: Docker Compose with Keycloak + Supabase local — needs specific configuration research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Constrained by existing ecosystem, no real alternatives |
| Features | HIGH | Defined by frontend TypeScript interfaces |
| Architecture | HIGH | Standard FastAPI + Supabase patterns, well-documented |
| Pitfalls | HIGH | Known risks from similar SaaS backends |

## Gaps to Address

- Keycloak org_id claim configuration — needs phase-specific research during auth setup
- Supabase RLS with Keycloak tokens (not Supabase Auth tokens) — integration pattern needs validation
- OpenMeter Python client maturity — may need custom implementation
- iDEAL payment method specific Stripe configuration for Dutch market

---
*Research summary for: Kijko Backend*
*Researched: 2026-02-10*
