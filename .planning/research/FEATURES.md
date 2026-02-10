# Feature Research

**Domain:** SaaS Backend for AI Developer Tools
**Researched:** 2026-02-10
**Confidence:** HIGH (features derived from existing frontend interfaces)

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User authentication (signup/login/logout) | Basic access control | MEDIUM | Keycloak OIDC + Supabase Auth |
| Project CRUD with pagination | Core entity management | LOW | 22 endpoints in projectApi.ts |
| Team/member management | Multi-user collaboration | MEDIUM | Invitations, roles, permissions |
| REST API with proper error handling | Standard API behavior | LOW | FastAPI handles most of this |
| File upload | Code ingestion input | MEDIUM | Supabase Storage |
| Health endpoint | Operational monitoring | LOW | /health with dependency checks |
| CORS configuration | Browser security | LOW | Restrict to app.kijko.nl |
| Rate limiting | API protection | MEDIUM | Per-plan tier limits |
| Input validation | Data integrity | LOW | Pydantic models |
| Session management | Persistent login | LOW | JWT with refresh tokens |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI Skills execution (Claude/Gemini) | Core product value — reusable AI prompts | HIGH | Server-side execution with token tracking |
| Habits (cron-scheduled skills) | Automated AI workflows | HIGH | pg_cron + Celery workers |
| Reflexes (webhook-triggered skills) | Event-driven AI responses | HIGH | Webhook receiver + condition matching |
| Real-time WebSocket events | Live execution feedback | MEDIUM | python-socketio with Redis adapter |
| Code ingestion pipeline | Repository analysis | HIGH | Git clone, AST parse, knowledge graph |
| Knowledge graph visualization | Visual code understanding | HIGH | Graphiti/FalkorDB integration |
| Persona-based UX (Alex/Maya/Sam) | Adaptive onboarding | LOW | Backend analytics for persona scoring |
| HyperVisa video context | Novel context compression | MEDIUM | Existing API at :8042 |
| Usage metering + quotas | Fair usage enforcement | MEDIUM | OpenMeter + Redis sliding window |
| Multi-tenant RLS isolation | Enterprise security | HIGH | Database-level tenant isolation |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time everything | Feels modern | WebSocket overhead for mostly-static data | Real-time for execution events only, REST for CRUD |
| Custom OAuth providers | "Support everything" | Maintenance burden, security surface | Google + GitHub OAuth only for v1 |
| GraphQL API | Flexible queries | Extra complexity for a defined interface set | REST matches frontend service files exactly |
| Microservices | "Scale better" | Over-engineering for current stage | Modular monolith with clear boundaries |

## Feature Dependencies

```
Authentication → ALL other features
Database Schema → Auth → Projects CRUD → Skills CRUD
Skills CRUD → Habits (requires skill reference)
Skills CRUD → Reflexes (requires skill reference)
Skills CRUD → Executions (skill execution records)
Stripe Setup → Subscription Management → Quota Enforcement → Rate Limiting
WebSocket Server → Real-time Events → Ingestion Progress
Keycloak OIDC → JWT Middleware → RLS Policies → Multi-tenancy
```

### Dependency Notes

- **Auth requires DB schema:** RLS policies reference auth tables
- **Skills requires Projects:** Skills belong to projects
- **Habits/Reflexes require Skills:** They execute skills
- **Billing requires Auth:** Subscriptions tied to users/orgs
- **WebSocket requires Auth:** JWT validation for socket connections

## MVP Definition

### Launch With (v1)

- [x] Auth (signup, login, session, JWT) — gates everything
- [x] Projects CRUD with repositories and members — core entity
- [x] Skills CRUD with execution — core value proposition
- [x] Habits with scheduling — automation differentiator
- [x] Reflexes with webhooks — event-driven differentiator
- [x] Stripe billing with 4 tiers — revenue generation
- [x] WebSocket for execution events — real-time feedback
- [x] Health + monitoring — operational readiness

### Add After Validation (v1.x)

- [ ] Knowledge graph integration — needs Graphiti stabilization
- [ ] Advanced analytics — needs usage data
- [ ] GDPR automation — needs legal review
- [ ] Email notifications — needs email provider setup

### Future Consideration (v2+)

- [ ] Mollie PSP — backup payment processor
- [ ] On-premise deployment — enterprise only
- [ ] Custom OAuth providers — low demand initially
- [ ] Mobile app — web-first approach

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth + JWT | HIGH | MEDIUM | P0 |
| Projects CRUD | HIGH | MEDIUM | P0 |
| Skills CRUD + Execution | HIGH | HIGH | P0 |
| Stripe Billing | HIGH | HIGH | P0 |
| Habits Scheduling | MEDIUM | HIGH | P1 |
| Reflexes Webhooks | MEDIUM | HIGH | P1 |
| WebSocket Events | MEDIUM | MEDIUM | P1 |
| Usage Metering | MEDIUM | MEDIUM | P1 |
| Health Endpoints | LOW | LOW | P1 |
| GDPR Endpoints | LOW | MEDIUM | P2 |
| Knowledge Graph | MEDIUM | HIGH | P2 |

## Sources

- Frontend service files: /home/devuser/Kijko-MVP/services/*.ts
- Type definitions: /home/devuser/Kijko-MVP/types/
- Billing types: /home/devuser/Kijko-MVP/types/settings/billing.ts
- Implementation plan: /home/devuser/Desktop/kijko-backend-implementation-plan.md

---
*Feature research for: SaaS Backend (AI Developer Tools)*
*Researched: 2026-02-10*
