# Stack Research

**Domain:** SaaS Backend (AI Developer Tools)
**Researched:** 2026-02-10
**Confidence:** HIGH (stack pre-decided from existing ecosystem constraints)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| FastAPI | 0.115+ | REST API framework | Async-native, auto OpenAPI docs, Pydantic validation. Oracle-Cortex ecosystem is Python. |
| Uvicorn | 0.30+ | ASGI server | Production-grade, supports HTTP/2, works with Gunicorn for workers |
| Supabase (PostgreSQL 15) | Cloud | Database + Auth + Realtime + Storage | Managed PostgreSQL with RLS, auth built-in, real-time subscriptions |
| supabase-py | 2.x | Python client | Direct Supabase access including auth, storage, realtime |
| stripe-python | 10.x | Payment processing | Subscriptions, iDEAL, webhooks. Dutch market support |
| python-socketio | 5.x | WebSocket server | Redis adapter for multi-worker, compatible with Socket.IO client in frontend |
| Celery | 5.x | Background tasks | Reliable job execution with retry, dead-letter queues |
| Redis | 7.x | Cache/broker/adapter | Celery broker, Socket.IO adapter, rate limiting, session cache |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pydantic-settings | 2.x | Configuration management | Environment variables, .env loading, type validation |
| langfuse | 2.x | LLM observability | Trace every skill execution, track tokens and costs |
| httpx | 0.27+ | Async HTTP client | Calling Keycloak, HyperVisa API, external services |
| python-jose[cryptography] | 3.3+ | JWT handling | Keycloak token validation |
| bcrypt | 4.x | Password hashing | Local auth fallback |
| celery[redis] | 5.x | Task queue with Redis | Background workers for ingestion, habits, reflexes |
| pytest | 8.x | Testing framework | Unit + integration tests |
| pytest-asyncio | 0.23+ | Async test support | Testing async FastAPI endpoints |
| httpx-testclient | - | API testing | FastAPI TestClient for integration tests |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Alembic | Database migrations | Though using Supabase migrations primarily |
| Docker Compose | Local dev environment | Full stack: API, Redis, Keycloak, workers |
| Ruff | Linting + formatting | Fast, replaces flake8+black+isort |

## Installation

```bash
# Core
pip install fastapi uvicorn[standard] supabase stripe python-socketio celery[redis]

# Auth + Config
pip install python-jose[cryptography] pydantic-settings httpx bcrypt

# Observability
pip install langfuse structlog

# Dev
pip install pytest pytest-asyncio httpx ruff
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| FastAPI | Django REST Framework | Heavier, not async-native, separate ecosystem from Oracle-Cortex |
| FastAPI | Node.js/Express | Would create dual-language stack; Oracle-Cortex is Python |
| Supabase | Raw PostgreSQL + SQLAlchemy | Supabase provides auth, storage, realtime out-of-box |
| Celery | Temporal | Temporal already used elsewhere but Celery simpler for standard job queues |
| python-socketio | FastAPI WebSocket | python-socketio has Redis adapter for scaling across workers |
| Keycloak | Supabase Auth | Keycloak provides org_id claims needed for multi-tenant RLS |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SQLAlchemy ORM | Supabase-py handles queries; ORM adds complexity without value | supabase-py direct queries |
| Flask | Not async, limited dependency injection | FastAPI |
| Gunicorn alone | Needs Uvicorn workers for ASGI | uvicorn with gunicorn worker class |
| float for money | Rounding errors in billing | Decimal from Python stdlib |
| JWT custom implementation | Security-critical, easy to get wrong | python-jose with Keycloak verification |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| FastAPI 0.115+ | Pydantic 2.x | Must use Pydantic v2 models |
| supabase-py 2.x | PostgreSQL 15 | Requires postgrest-py 0.16+ |
| python-socketio 5.x | socket.io-client 4.x | Frontend uses socket.io-client |
| Celery 5.x | Redis 7.x | Redis 6+ required for streams |

## Sources

- FastAPI official docs (fastapi.tiangolo.com)
- Stripe Python SDK docs (stripe.com/docs/api?lang=python)
- Supabase Python client docs (supabase.com/docs/reference/python)
- Existing Oracle-Cortex codebase at /home/devuser/Oracle-Cortex/

---
*Stack research for: SaaS Backend (AI Developer Tools)*
*Researched: 2026-02-10*
