# Setting Sprint 7: Billing and Usage

## Overview
Implements subscription management, payment methods, billing history, usage metrics dashboard, and invoicing details for Dutch BV compliance.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system
- **Sprint 2 Complete**: User profile (billing linked to account)
- **Sprint 4 Complete**: Security (payment data requires secure handling)

## Deliverables

### 1. Current Plan Display
- Plan tiers: Free, Pro (EUR 29/mo), Teams (EUR 79/mo), Enterprise
- Current plan card with upgrade/downgrade options
- Plan comparison modal

### 2. Payment Method Management
- Credit Card (Visa, Mastercard, Amex)
- SEPA Direct Debit (EU customers)
- Add/remove/set default payment method

### 3. Billing History
- Paginated invoice list with status
- Download individual invoices (PDF)
- Filter by date range

### 4. Usage Metrics Dashboard
| Metric | Display |
|--------|---------|
| API Calls | Count this billing period |
| Ingestions | Number of data imports |
| Storage | GB used |
| Seats | Team members |
| Oracle Queries | Daily AI queries |

- Progress bars with limit warnings (80%, 100%)
- Usage trend charts

### 5. Invoicing Details (Dutch BV)
- Company Name, BTW Number (with VIES validation)
- KVK Number, Invoice Address
- Auto-save on all fields

## Database Schema
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  current_period_end TIMESTAMPTZ
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255),
  card_brand VARCHAR(20),
  card_last4 VARCHAR(4),
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE billing_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  btw_number VARCHAR(20),
  kvk_number VARCHAR(20),
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'NL'
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Acceptance Criteria
- [ ] Current plan displays correctly
- [ ] Can add/remove payment methods
- [ ] Invoices list with download
- [ ] Usage metrics display with progress bars
- [ ] BTW number validates via VIES
- [ ] Billing details save via auto-save

## Files to Create/Modify
- `app/settings/billing/page.tsx`
- `components/Settings/Billing/CurrentPlan.tsx`
- `components/Settings/Billing/PaymentMethods.tsx`
- `components/Settings/Billing/InvoiceHistory.tsx`
- `components/Settings/Billing/UsageMetrics.tsx`
- `components/Settings/Billing/BillingDetails.tsx`
