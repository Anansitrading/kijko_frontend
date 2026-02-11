# Kijko Backend — Production FastAPI API

## What This Is

Kijko is a SaaS platform for AI-powered developer tools, offering Skills (reusable AI prompts), Habits (scheduled skill execution), Reflexes (event-triggered skill execution), and project-level code ingestion with knowledge graph visualization. The React 19 + TypeScript frontend is deployed at `app.kijko.nl` with 23 service files returning mock data. This project builds the Python FastAPI backend that connects the frontend to real infrastructure: Supabase (auth + DB), Stripe (billing), WebSocket (real-time), and the Oracle-Cortex Python ecosystem.

## Core Value

Every mock endpoint becomes a real endpoint — users can sign up, authenticate, manage projects, execute AI skills, and pay for subscriptions with real data flowing through real infrastructure.

## Requirements

### Validated

<!-- Existing frontend capabilities (deployed, working with mock data) -->

- ✓ React 19 SPA with full UI for Projects, Skills, Habits, Reflexes — existing
- ✓ 23 service files with defined TypeScript interfaces — existing
- ✓ 3 SQL migration files ready for deployment — existing
- ✓ Complete billing UI with 4-tier plan definitions — existing
- ✓ WebSocket client patterns for real-time events — existing
- ✓ Persona detection system (Alex/Maya/Sam) — existing
- ✓ HyperVisa integration tab with preview/render — existing

### Active

- [ ] FastAPI backend with 89 endpoints matching frontend interfaces
- [ ] Supabase PostgreSQL with RLS multi-tenancy
- [ ] Keycloak OIDC authentication with org_id JWT claims
- [ ] Stripe payments with iDEAL (Dutch market), webhooks, 4-tier plans
- [ ] WebSocket server (python-socketio) for real-time agent events
- [ ] Background workers (Celery + Redis) for ingestion, habits, reflexes
- [ ] Usage metering with OpenMeter + quota enforcement
- [ ] Langfuse observability for LLM call tracing
- [ ] Docker Compose stack for local development
- [ ] Test suite with 80%+ coverage on critical paths
- [ ] GDPR DSR endpoints with cascade deletion
- [ ] Health endpoints with dependency checks

### Out of Scope

- Frontend redesign — frontend is 95% complete, minimal changes only
- Mobile app — web-first
- Mollie PSP integration — future backup, Stripe only for now
- On-premise deployment — SaaS-only for v1
- Custom OAuth providers beyond Google/GitHub — defer

## Context

### Technical Environment
- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4 — deployed at app.kijko.nl
- **Backend target**: Python FastAPI on Hetzner, proxied via api.kijko.nl
- **Database**: Supabase Cloud (PostgreSQL 15) with Row-Level Security
- **Existing Python ecosystem**: Oracle-Cortex, HyperVisa API (:8042), Graphiti/FalkorDB, Agent-Lightning, cxdb
- **Payments**: Stripe with iDEAL for Dutch market. 4 tiers: Free/Pro(€29)/Teams(€79)/Enterprise
- **Auth**: Keycloak OIDC with org_id claims in JWT

### Mock-to-Real Migration Pattern
Each frontend service file uses `delay() + Map<>` stores. The backend must implement endpoints matching these TypeScript interfaces exactly. Frontend migration: replace mock data with `fetch(API_BASE_URL + '/endpoint')`.

### Existing Infrastructure
| Service | Status | Port |
|---------|--------|------|
| HyperVisa API | Running | 8042 |
| Graphiti/FalkorDB | Running | MCP |
| cxdb | Running | 9009/9010 |
| Agent-Lightning | Running | cron |
| Oracle Daemon | Running | Zulip |

### Linear Project
- Project ID: `4ead2c67-ad19-482a-81da-509b12f88861`
- Team: Kijko
- 107 active tickets, 22 in Agentic Review

## Constraints

- **Tech Stack**: Python FastAPI — entire Oracle-Cortex ecosystem is Python
- **Database**: Supabase PostgreSQL with RLS — multi-tenancy at DB level, not application level
- **Payments**: Stripe with iDEAL — Dutch BV compliance required (BTW, KVK)
- **Security**: All endpoints require auth except /health, /auth/login, /auth/signup
- **Timeline**: Overnight sprint — backend PRs ready for human review by morning
- **Frontend**: Do NOT modify frontend unless absolutely necessary for API integration
- **Billing**: All calculations use Decimal, never float

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Python FastAPI over Node/Deno | Oracle-Cortex stack is Python; one language, one runtime | — Pending |
| Supabase RLS over app-level filtering | DB enforces tenant isolation; no data leaks possible | — Pending |
| Stripe with iDEAL over Mollie | Primary Dutch PSP, better developer experience | — Pending |
| Keycloak OIDC over Supabase Auth | org_id claims needed for multi-tenancy | — Pending |
| python-socketio over raw WebSocket | Redis adapter for multi-worker scaling | — Pending |
| Celery + Redis over asyncio tasks | Reliable background jobs with retry/dead-letter | — Pending |
| Backend in server/ subdirectory | Keep frontend+backend in one repo for integration | — Pending |

---
*Last updated: 2026-02-10 after overnight sprint initialization*
