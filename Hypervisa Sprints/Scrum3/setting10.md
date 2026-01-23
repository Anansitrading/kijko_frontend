# Setting Sprint 10: Audit Log

## Overview
Implements comprehensive activity monitoring with chronological audit trail, advanced filtering, export capabilities, and event categorization.

## Prerequisites
- **All Previous Sprints Complete**: Events from all modules feed into audit log

## Plan Requirement
Full audit for **Teams/Enterprise**. Limited history for other plans.

## Deliverables

### 1. Activity Timeline
- Chronological event display with infinite scroll
- Real-time updates, expandable details
- User avatar, relative timestamps

### 2. Event Types

| Category | Events |
|----------|--------|
| User | login, logout, profile_updated, password_changed, 2fa_enabled |
| Context | created, updated, deleted, shared, exported |
| Team | member_invited, member_joined, member_removed, role_changed |
| Security | login_failed, session_terminated, api_key_created/revoked |
| Integration | connected, disconnected, webhook_triggered |
| System | export_completed, backup_created |

### 3. Filter Options
- User, action type, date range, full-text search
- Preset ranges: Today, 7 days, 30 days, custom
- Save and share filters

### 4. Export Logs
- Formats: CSV, JSON, PDF (Enterprise)
- Date range and event type filtering
- Scheduled exports (daily/weekly/monthly)

### 5. Retention
| Plan | Retention |
|------|-----------|
| Free | 7 days |
| Pro | 30 days |
| Teams | 90 days |
| Enterprise | 1 year+ |

## Database Schema
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  changes JSONB,
  ip_address INET,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_team_date ON audit_logs(team_id, created_at DESC);
CREATE INDEX idx_audit_logs_type ON audit_logs(event_type, created_at DESC);

CREATE TABLE audit_log_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT false
);
```

## Logging Integration
```typescript
await auditLog({
  eventType: 'user.settings_changed',
  userId: currentUser.id,
  metadata: { settingKey: 'theme', oldValue: 'light', newValue: 'dark' },
  request: req
});
```

## Acceptance Criteria
- [ ] Timeline displays events chronologically
- [ ] Real-time updates for new events
- [ ] All event types are captured
- [ ] Filters work correctly
- [ ] Export generates valid files
- [ ] Retention policy enforced

## Files to Create/Modify
- `app/settings/audit-log/page.tsx`
- `components/Settings/AuditLog/AuditTimeline.tsx`
- `components/Settings/AuditLog/AuditEventCard.tsx`
- `components/Settings/AuditLog/AuditFilters.tsx`
- `components/Settings/AuditLog/ExportModal.tsx`
- `lib/audit-log.ts`

## Completion
This is the final sprint. All 9 settings sections will be fully functional with auto-save, global theme, security features, team collaboration, and full audit trail.
