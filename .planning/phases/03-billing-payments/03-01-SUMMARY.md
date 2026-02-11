# Plan 03-01: Stripe Service & Billing Router — COMPLETE ✅

## What was built
- `server/app/services/stripe_service.py` — Full Stripe integration service
  - Customer lifecycle: get_or_create_customer with org_id metadata
  - Checkout: create_checkout_session with iDEAL + card payment methods
  - Subscriptions: get, update (plan change), cancel (period end)
  - Payment methods: list, attach, detach
  - Invoices: list with pagination
  - Portal: create_portal_session for self-service
  - BTW validation: Dutch VAT number format + Stripe tax ID API
  - PLAN_PRICES mapping: (PlanTier, BillingInterval) → Stripe price_id

- `server/app/routers/billing.py` — 14 billing endpoints
  - GET /billing/plans — list available plans
  - POST /billing/checkout — create Stripe checkout (iDEAL+card)
  - GET/PATCH/DELETE /billing/subscription — manage subscription
  - GET/POST/DELETE /billing/payment-methods — payment method CRUD
  - GET /billing/invoices — invoice history
  - GET/PATCH /billing/details — billing details management
  - POST /billing/validate-btw — BTW number validation
  - POST /billing/portal — Stripe customer portal
  - GET /billing/usage — current usage overview

## Key decisions
- iDEAL as primary payment method (Dutch market), card as fallback
- PlanTier enum: FREE, PRO, TEAMS, ENTERPRISE (matched existing enums)
- BillingInterval: MONTHLY, ANNUALLY (not "annual")
- All money values use Decimal for precision

## Tests
- 6 billing tests (plans, checkout, subscription, BTW, portal)

## Commit
- `955ba38` — feat: Phase 3 — Stripe billing, webhooks, usage metering, quota enforcement
