# Architecture Research

**Domain:** SaaS Backend for AI Developer Tools
**Researched:** 2026-02-10
**Confidence:** HIGH (architecture defined by existing frontend contracts and infrastructure)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│           Caddy/Nginx Reverse Proxy                          │
│  app.kijko.nl → Kijko-MVP/dist (static)                    │
│  api.kijko.nl → localhost:8000 (FastAPI)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
    v             v              v
┌─────────┐ ┌─────────┐ ┌──────────────┐
│ FastAPI  │ │ Celery  │ │ Socket.IO    │
│ :8000   │ │ Workers │ │ (in FastAPI) │
└────┬────┘ └────┬────┘ └──────┬───────┘
     │           │              │
     ├───────────┴──────────────┘
     │
     v
┌─────────────────────────────────────┐
│          Infrastructure              │
│  Supabase Cloud (PostgreSQL + Auth)  │
│  Redis (Celery + Socket.IO + Cache)  │
│  Stripe API (Payments)               │
│  Keycloak (OIDC Auth)               │
│  FalkorDB (Knowledge Graph)          │
│  HyperVisa API (:8042)              │
│  Langfuse (Observability)            │
└─────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| FastAPI App | HTTP request handling, routing, validation | Routers + dependency injection |
| Auth Middleware | JWT validation, user context extraction | FastAPI middleware + Keycloak |
| RLS Proxy | Tenant isolation at DB level | Supabase service_role + auth.uid() |
| Celery Workers | Background job execution | Habit scheduler, ingestion, webhooks |
| Socket.IO Server | Real-time event broadcasting | Mounted on FastAPI ASGI app |
| Stripe Webhook Handler | Payment event processing | Signature verification + idempotent handling |
| Rate Limiter | Per-plan request throttling | Redis sliding window |
| Usage Tracker | Metering API calls per tenant | Redis counters + periodic flush to DB |

## Recommended Project Structure

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, middleware, Socket.IO mount
│   ├── config.py             # pydantic-settings configuration
│   ├── dependencies.py       # DI: supabase client, stripe, redis
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py           # POST /auth/signup, /auth/login, /auth/refresh
│   │   ├── projects.py       # 22 project endpoints
│   │   ├── skills.py         # 14 skill endpoints
│   │   ├── habits.py         # 11 habit endpoints
│   │   ├── reflexes.py       # 12 reflex endpoints
│   │   ├── executions.py     # 5 execution history endpoints
│   │   ├── billing.py        # Stripe subscriptions + payments
│   │   ├── analytics.py      # Event ingestion
│   │   ├── oauth.py          # GitHub/GitLab OAuth
│   │   ├── files.py          # File upload to Supabase Storage
│   │   ├── health.py         # /health with dependency checks
│   │   └── websocket.py      # Socket.IO event handlers
│   ├── models/
│   │   ├── __init__.py
│   │   ├── auth.py           # Auth request/response models
│   │   ├── project.py        # Project Pydantic models (match TS types)
│   │   ├── skill.py          # Skill models
│   │   ├── habit.py          # Habit models
│   │   ├── reflex.py         # Reflex models
│   │   ├── execution.py      # Execution models
│   │   ├── billing.py        # Billing models (match billing.ts)
│   │   └── analytics.py      # Analytics event models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_client.py   # Supabase wrapper with RLS context
│   │   ├── stripe_service.py    # Stripe business logic
│   │   ├── auth_service.py      # Keycloak + JWT operations
│   │   ├── skill_executor.py    # AI model execution (Claude/Gemini)
│   │   ├── ingestion_service.py # Code ingestion pipeline
│   │   ├── langfuse_service.py  # Observability wrapper
│   │   └── usage_service.py     # Usage metering + quota checks
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT validation + user context
│   │   ├── rate_limit.py        # Per-plan rate limiting
│   │   ├── usage_tracking.py    # Usage metering per request
│   │   └── cors.py              # CORS configuration
│   └── workers/
│       ├── __init__.py
│       ├── celery_app.py        # Celery configuration
│       ├── ingestion_worker.py  # Code ingestion tasks
│       ├── habit_executor.py    # Cron-triggered habit execution
│       └── webhook_processor.py # Reflex webhook processing
├── tests/
│   ├── conftest.py             # Fixtures: test client, mock supabase, etc.
│   ├── test_auth.py
│   ├── test_projects.py
│   ├── test_skills.py
│   ├── test_billing.py
│   └── test_health.py
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml          # Full stack for local dev
```

### Structure Rationale

- **routers/**: One file per domain — matches frontend service files 1:1
- **models/**: Pydantic models matching TypeScript interfaces exactly
- **services/**: Business logic separated from HTTP handling
- **middleware/**: Cross-cutting concerns (auth, rate limiting, usage)
- **workers/**: Background tasks in separate process (Celery)

## Architectural Patterns

### Pattern 1: Dependency Injection via FastAPI Depends

**What:** All service dependencies injected through FastAPI's Depends() system
**When to use:** Every router handler that needs DB, Stripe, or auth context
**Trade-offs:** Clean testing (mock dependencies), slight boilerplate

```python
async def get_current_user(
    authorization: str = Header(...),
    supabase: AsyncClient = Depends(get_supabase)
) -> User:
    token = authorization.replace("Bearer ", "")
    user = await supabase.auth.get_user(token)
    return user

@router.get("/projects")
async def list_projects(user: User = Depends(get_current_user)):
    ...
```

### Pattern 2: RLS-Aware Supabase Queries

**What:** Every DB query uses service_role client with auth context set
**When to use:** All data access
**Trade-offs:** Security guarantee at DB level, slight overhead per query

```python
async def query_with_rls(supabase, user_id: str, org_id: str):
    # Set RLS context
    await supabase.rpc("set_request_context", {
        "user_id": user_id, "org_id": org_id
    })
    # Query is now scoped by RLS policies
    return await supabase.table("projects").select("*").execute()
```

### Pattern 3: Webhook Idempotency

**What:** Stripe webhooks processed exactly once using idempotency keys
**When to use:** All webhook handlers
**Trade-offs:** Requires tracking processed event IDs, prevents duplicate processing

```python
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)

    # Idempotency check
    if await is_event_processed(event.id):
        return {"status": "already_processed"}

    await process_event(event)
    await mark_event_processed(event.id)
```

## Data Flow

### Request Flow

```
[Browser] → [Caddy/api.kijko.nl] → [FastAPI]
    → [Auth Middleware: validate JWT, extract user_id/org_id]
    → [Rate Limit Middleware: check plan tier limits]
    → [Usage Tracking Middleware: increment counters]
    → [Router Handler: validate input with Pydantic]
    → [Service Layer: business logic]
    → [Supabase Client: RLS-scoped query]
    → [Response: Pydantic model → JSON]
```

### Background Task Flow

```
[API Request] → [Celery Task Queue (Redis)]
    → [Worker picks up task]
    → [Execute: ingestion/habit/webhook]
    → [Socket.IO: broadcast progress event]
    → [Supabase: persist results]
```

### Billing Flow

```
[User selects plan] → [POST /billing/checkout]
    → [Create Stripe Checkout Session with iDEAL]
    → [Redirect to Stripe Hosted Page]
    → [Payment completes]
    → [Stripe Webhook: checkout.session.completed]
    → [Create/update subscription in DB]
    → [Set plan tier limits]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single FastAPI process, single Celery worker, Redis on same host |
| 1k-10k users | Multiple Uvicorn workers (gunicorn), multiple Celery workers, Redis cluster |
| 10k+ users | Horizontal scaling behind load balancer, read replicas, dedicated Redis |

### Scaling Priorities

1. **First bottleneck:** Database queries — solved by Supabase managed scaling + connection pooling
2. **Second bottleneck:** AI execution — solved by Celery worker pool scaling

## Anti-Patterns

### Anti-Pattern 1: Application-Level Tenant Filtering

**What people do:** WHERE org_id = ? in every query
**Why it's wrong:** One missed filter = data leak; impossible to audit
**Do this instead:** RLS policies at database level — impossible to bypass

### Anti-Pattern 2: Synchronous AI Execution

**What people do:** Await Claude/Gemini response in request handler
**Why it's wrong:** Blocks worker, 30s+ timeout risk
**Do this instead:** Queue to Celery, return job ID, push results via WebSocket

### Anti-Pattern 3: Storing Stripe State Locally

**What people do:** Cache subscription status in local DB as source of truth
**Why it's wrong:** State drifts from Stripe reality
**Do this instead:** Webhook-driven updates + verify with Stripe API on critical paths

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | supabase-py client, service_role key | RLS context per request |
| Stripe | stripe-python SDK, webhook listener | Signature verification required |
| Keycloak | OIDC discovery + JWT validation | org_id in custom claims |
| HyperVisa | HTTP client to localhost:8042 | Already running as systemd service |
| FalkorDB | Via Graphiti MCP or direct | Knowledge graph queries |
| Langfuse | langfuse-python SDK | @observe decorator on LLM calls |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Router ↔ Service | Direct function call | Same process |
| API ↔ Worker | Celery task queue (Redis) | Async, reliable |
| API ↔ WebSocket | Socket.IO emit | Same ASGI process |
| Worker ↔ WebSocket | Redis pub/sub | Cross-process event delivery |

## Sources

- FastAPI architecture guide (fastapi.tiangolo.com/tutorial/bigger-applications/)
- Supabase RLS documentation (supabase.com/docs/guides/auth/row-level-security)
- Stripe webhooks best practices (stripe.com/docs/webhooks/best-practices)
- Implementation plan: /home/devuser/Desktop/kijko-backend-implementation-plan.md
- Dependency analysis: /home/devuser/Desktop/dependency_analysis.md

---
*Architecture research for: SaaS Backend (AI Developer Tools)*
*Researched: 2026-02-10*
