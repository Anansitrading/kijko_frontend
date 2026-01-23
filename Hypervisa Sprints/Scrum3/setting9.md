# Setting Sprint 9: Advanced Security

## Overview
Implements enterprise-grade security features including login history audit, configurable security policies, IP whitelisting, and compliance documentation.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure
- **Sprint 4 Complete**: Basic security (2FA, sessions, API keys)
- **Sprint 8 Complete**: Members (team security policies)

## Plan Requirement
**Enterprise** plan for full features. Some features for **Teams**.

## Deliverables

### 1. Login History
- Audit display: Date, status, IP, location, device, method
- Filter by success/failed, date range
- Export to CSV
- Failed login alerts

### 2. Security Policies

#### Password Policy:
- Min length (8-32), require upper/lower/number/symbol
- Password expiry, prevent reuse

#### Session Policy:
- Session timeout, idle timeout
- Max concurrent sessions, remember device

#### Authentication Policy:
- Require 2FA (all/admins/none)
- SSO enforcement

### 3. IP Whitelist
- Add IPs/ranges, named groups
- Modes: Disabled, Warn, Enforce
- Admin bypass for emergencies

### 4. Compliance Dashboard
- SOC 2, ISO 27001, GDPR, HIPAA status
- Downloadable compliance documents
- Data residency display

### 5. Security Score
- Score 0-100 based on enabled features
- Recommendations to improve

## Database Schema
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  ip_address INET,
  location JSONB,
  device_info JSONB,
  auth_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE security_policies (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  password_min_length INTEGER DEFAULT 8,
  password_require_upper BOOLEAN DEFAULT true,
  password_require_number BOOLEAN DEFAULT true,
  session_timeout_minutes INTEGER DEFAULT 480,
  require_2fa VARCHAR(20) DEFAULT 'none'
);

CREATE TABLE ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100),
  ip_address INET,
  ip_range CIDR,
  is_active BOOLEAN DEFAULT true
);
```

## Acceptance Criteria
- [ ] Login history displays with filtering
- [ ] Password policy enforces requirements
- [ ] IP whitelist blocks non-whitelisted IPs
- [ ] Compliance documents downloadable
- [ ] Security score calculates accurately

## Files to Create/Modify
- `app/settings/security/advanced/page.tsx`
- `components/Settings/Security/LoginHistory.tsx`
- `components/Settings/Security/SecurityPolicies.tsx`
- `components/Settings/Security/IPWhitelist.tsx`
- `components/Settings/Security/ComplianceDashboard.tsx`
- `components/Settings/Security/SecurityScore.tsx`
