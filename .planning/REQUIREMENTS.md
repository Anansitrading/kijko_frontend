# Requirements: Kijko Backend

**Defined:** 2026-02-10
**Core Value:** Every mock endpoint becomes a real endpoint — users can sign up, authenticate, manage projects, execute AI skills, and pay for subscriptions with real data.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: FastAPI project scaffold with proper directory structure (routers/models/services/middleware/workers)
- [ ] **FOUND-02**: pydantic-settings configuration loading from environment variables
- [ ] **FOUND-03**: Dependency injection for Supabase client, Stripe client, Redis connection
- [ ] **FOUND-04**: 3 SQL migrations deployed to Supabase (projects, skills, habits_scheduler)
- [ ] **FOUND-05**: RLS policies enabled on all tables with organization_id column
- [ ] **FOUND-06**: SECURITY DEFINER helper functions for RLS-safe operations

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password via Keycloak
- [ ] **AUTH-02**: User can log in and receive JWT with org_id claims
- [ ] **AUTH-03**: User can refresh expired access tokens
- [ ] **AUTH-04**: User session persists across requests via JWT Bearer tokens
- [ ] **AUTH-05**: FastAPI middleware validates Keycloak JWT on every protected endpoint
- [ ] **AUTH-06**: Middleware sets RLS context (auth.uid, app.current_org_id) per request
- [ ] **AUTH-07**: OAuth login via Google and GitHub through Keycloak
- [ ] **AUTH-08**: User can log out (token invalidation)

### Projects

- [ ] **PROJ-01**: User can create project with name, description, chunking strategy
- [ ] **PROJ-02**: User can get project by ID
- [ ] **PROJ-03**: User can get project with full relations (repos, members, progress)
- [ ] **PROJ-04**: User can update project metadata
- [ ] **PROJ-05**: User can delete project (cascade to repos, members, progress)
- [ ] **PROJ-06**: User can list projects with pagination and search
- [ ] **PROJ-07**: User can view project statistics
- [ ] **PROJ-08**: User can add repository to project (provider, URL, branch)
- [ ] **PROJ-09**: User can list project repositories
- [ ] **PROJ-10**: User can remove repository from project
- [ ] **PROJ-11**: User can add team member to project with role
- [ ] **PROJ-12**: User can list project members
- [ ] **PROJ-13**: User can update member role
- [ ] **PROJ-14**: User can remove member from project
- [ ] **PROJ-15**: User can send bulk invitations
- [ ] **PROJ-16**: User can resend invitation
- [ ] **PROJ-17**: User can cancel pending invitation
- [ ] **PROJ-18**: User can view pending invitations
- [ ] **PROJ-19**: User can start project ingestion
- [ ] **PROJ-20**: User can view ingestion progress
- [ ] **PROJ-21**: User can validate project name (uniqueness check)
- [ ] **PROJ-22**: User can validate repository URL (accessibility check)

### Skills

- [ ] **SKIL-01**: User can create skill with prompt, model, parameters, input schema
- [ ] **SKIL-02**: User can get skill by ID
- [ ] **SKIL-03**: User can get skill with relations (executions, habits, reflexes)
- [ ] **SKIL-04**: User can list skills with filtering and pagination
- [ ] **SKIL-05**: User can update skill configuration
- [ ] **SKIL-06**: User can delete skill (cascade to executions)
- [ ] **SKIL-07**: User can duplicate a skill
- [ ] **SKIL-08**: User can execute a skill and receive results
- [ ] **SKIL-09**: User can test skill with configuration
- [ ] **SKIL-10**: User can test skill by ID
- [ ] **SKIL-11**: User can view skill execution statistics
- [ ] **SKIL-12**: User can view skill execution history
- [ ] **SKIL-13**: User can bulk activate/deactivate/delete skills
- [ ] **SKIL-14**: User can export/import skill configurations

### Habits

- [ ] **HBIT-01**: User can create habit with skill reference and cron schedule
- [ ] **HBIT-02**: User can get habit by ID
- [ ] **HBIT-03**: User can get habit with skill details
- [ ] **HBIT-04**: User can list habits with filtering
- [ ] **HBIT-05**: User can update habit configuration and schedule
- [ ] **HBIT-06**: User can delete habit
- [ ] **HBIT-07**: User can activate/deactivate habit
- [ ] **HBIT-08**: User can trigger immediate habit execution
- [ ] **HBIT-09**: User can reset habit error count
- [ ] **HBIT-10**: User can view habit execution statistics
- [ ] **HBIT-11**: User can validate cron expressions

### Reflexes

- [ ] **RFLX-01**: User can create reflex with skill reference and trigger configuration
- [ ] **RFLX-02**: User can get reflex by ID
- [ ] **RFLX-03**: User can get reflex with skill details
- [ ] **RFLX-04**: User can list reflexes with filtering
- [ ] **RFLX-05**: User can update reflex configuration
- [ ] **RFLX-06**: User can delete reflex
- [ ] **RFLX-07**: User can activate/deactivate reflex
- [ ] **RFLX-08**: User can test reflex with mock event
- [ ] **RFLX-09**: User can reset reflex error count
- [ ] **RFLX-10**: User can regenerate webhook secret
- [ ] **RFLX-11**: User can view reflex execution statistics
- [ ] **RFLX-12**: User can view webhook endpoint info

### Executions

- [ ] **EXEC-01**: User can list executions with filters (skill, status, date range)
- [ ] **EXEC-02**: User can get execution details (input, output, tokens, cost, duration)
- [ ] **EXEC-03**: User can cancel running execution
- [ ] **EXEC-04**: User can view aggregated stats by skill
- [ ] **EXEC-05**: User can view aggregated stats by time period

### Billing

- [ ] **BILL-01**: User can view current subscription and plan details
- [ ] **BILL-02**: User can create Stripe checkout session for plan upgrade (with iDEAL)
- [ ] **BILL-03**: User can downgrade subscription plan
- [ ] **BILL-04**: User can cancel subscription (at period end)
- [ ] **BILL-05**: User can resume cancelled subscription
- [ ] **BILL-06**: User can add payment method (card or SEPA)
- [ ] **BILL-07**: User can remove payment method
- [ ] **BILL-08**: User can set default payment method
- [ ] **BILL-09**: User can view invoice history with download links
- [ ] **BILL-10**: User can view current usage metrics per category
- [ ] **BILL-11**: User can update billing details (company, BTW, KVK, address)
- [ ] **BILL-12**: User can validate BTW number via VIES API
- [ ] **BILL-13**: Stripe webhooks processed for subscription lifecycle events
- [ ] **BILL-14**: Usage quotas enforced per plan tier (429 on exceed)
- [ ] **BILL-15**: All billing calculations use Decimal (never float)

### Analytics

- [ ] **ANLT-01**: System accepts batch analytics events via POST /api/analytics/events

### WebSocket

- [ ] **WSCK-01**: WebSocket server accepts authenticated connections
- [ ] **WSCK-02**: Real-time ingestion progress events broadcast to project rooms
- [ ] **WSCK-03**: Activity events broadcast to user rooms
- [ ] **WSCK-04**: Token refresh events sent when JWT nearing expiry
- [ ] **WSCK-05**: WebSocket reconnection handled gracefully

### Infrastructure

- [ ] **INFR-01**: /health endpoint returns status of all dependencies (DB, Redis, Stripe, Keycloak)
- [ ] **INFR-02**: Docker Compose stack for local development (API, Redis, Celery workers)
- [ ] **INFR-03**: CORS configured for app.kijko.nl and localhost:3000 only
- [ ] **INFR-04**: Rate limiting on auth endpoints (5 attempts/minute)
- [ ] **INFR-05**: Structured JSON logging with request ID tracing
- [ ] **INFR-06**: API key encryption at rest for stored secrets

### Security

- [ ] **SECR-01**: All endpoints require authentication except /health, /auth/login, /auth/signup
- [ ] **SECR-02**: RLS policies enforce tenant isolation on every table
- [ ] **SECR-03**: Stripe webhook signature verification on all webhook events
- [ ] **SECR-04**: Input validation via Pydantic models on all endpoints
- [ ] **SECR-05**: No secrets hardcoded — all via environment variables
- [ ] **SECR-06**: GDPR DSR endpoints for data export and cascade deletion

### Testing

- [ ] **TEST-01**: Unit tests for all auth middleware functions
- [ ] **TEST-02**: Integration tests for core CRUD endpoints (projects, skills)
- [ ] **TEST-03**: RLS isolation tests (verify tenant data separation)
- [ ] **TEST-04**: Stripe webhook handler tests with signature verification
- [ ] **TEST-05**: 80%+ code coverage on critical paths (auth, billing, RLS)

## v2 Requirements

Deferred to future release.

### Advanced Integrations

- **INTG-01**: Knowledge graph visualization via Graphiti/FalkorDB
- **INTG-02**: Code ingestion pipeline with AST parsing (tree-sitter)
- **INTG-03**: MCP registry integration with Panopticon
- **INTG-04**: Email notifications (Resend/SES) for invitations and events
- **INTG-05**: Langfuse LLM call tracing middleware

### Operations

- **OPS-01**: GitHub Actions CI/CD pipeline
- **OPS-02**: Cloudflare DNS/DDoS/SSL configuration
- **OPS-03**: Sentry error tracking integration
- **OPS-04**: Load testing with 50 concurrent users
- **OPS-05**: Failover drill procedure (Hetzner → Railway)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend redesign | Frontend is 95% complete, backend-only sprint |
| Mobile app | Web-first, mobile later |
| Mollie PSP | Future backup, Stripe is primary |
| Custom OAuth providers | Google + GitHub sufficient for v1 |
| GraphQL API | REST matches frontend service files exactly |
| Microservices architecture | Modular monolith appropriate for current scale |
| On-premise deployment | SaaS-only for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 through FOUND-06 | Phase 1 | Pending |
| AUTH-01 through AUTH-08 | Phase 1 | Pending |
| PROJ-01 through PROJ-22 | Phase 2 | Pending |
| SKIL-01 through SKIL-14 | Phase 2 | Pending |
| HBIT-01 through HBIT-11 | Phase 2 | Pending |
| RFLX-01 through RFLX-12 | Phase 2 | Pending |
| EXEC-01 through EXEC-05 | Phase 2 | Pending |
| ANLT-01 | Phase 2 | Pending |
| BILL-01 through BILL-15 | Phase 3 | Pending |
| WSCK-01 through WSCK-05 | Phase 4 | Pending |
| SECR-06 | Phase 4 | Pending |
| INFR-01 through INFR-06 | Phase 5 | Pending |
| SECR-01 through SECR-05 | Phase 1-5 | Pending |
| TEST-01 through TEST-05 | Phase 1-5 | Pending |

**Coverage:**
- v1 requirements: 101 total
- Mapped to phases: 101
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
