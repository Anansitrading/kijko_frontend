# Setting Sprint 6: Integrations

## Overview
Implements the integrations management system including connected third-party apps with permissions management and webhook configuration for real-time event notifications.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system
- **Sprint 4 Complete**: Security (API keys for webhook authentication)
- **Sprint 5 Complete**: Notifications (webhooks trigger notification events)

## Deliverables

### 1. Connected Apps Management

#### App Categories:
- **CRM**: Salesforce, HubSpot, Pipedrive
- **Communication**: Slack, Microsoft Teams, Discord
- **Productivity**: Google Workspace, Microsoft 365, Notion
- **Analytics**: Google Analytics, Mixpanel, Amplitude
- **Storage**: Google Drive, Dropbox, OneDrive
- **Development**: GitHub, GitLab, Jira

#### Features:
- **Search & Filter**: Search by name, filter by category
- **Connect Flow**: OAuth popup, authorize permissions, return connected
- **Permission Management**: View/revoke permissions
- **Disconnect**: Confirmation modal, revokes all access

### 2. Webhook Management

#### Webhook Configuration:
| Field | Description |
|-------|-------------|
| Name | Friendly webhook identifier |
| Endpoint URL | HTTPS URL to receive events |
| Secret | Shared secret for signature verification |
| Events | Which events trigger this webhook |
| Status | Active / Paused |

#### Supported Event Types:
- `lead.created`, `lead.updated`
- `context.created`, `context.updated`, `context.deleted`
- `user.login`, `user.settings_changed`
- `export.completed`

#### Features:
- Create/edit/delete webhooks
- Test webhook (send test payload)
- View delivery logs
- Retry failed deliveries

## Database Schema
```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  scopes TEXT[],
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Acceptance Criteria
- [ ] Integration categories display correctly
- [ ] Search filters integrations in real-time
- [ ] OAuth connect flow works
- [ ] Webhooks can be created with events
- [ ] Test webhook sends payload
- [ ] Webhook deliveries are logged

## Files to Create/Modify
- `app/settings/integrations/page.tsx`
- `components/Settings/Integrations/AppGrid.tsx`
- `components/Settings/Integrations/AppCard.tsx`
- `components/Settings/Integrations/IntegrationSearch.tsx`
- `components/Settings/Integrations/WebhookList.tsx`
- `components/Settings/Integrations/WebhookForm.tsx`
