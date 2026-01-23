# Setting Sprint 5: Notifications

## Overview
Implements the notification preferences system, allowing users to control how and when they receive notifications via email and in-app channels.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system
- **Sprint 2 Complete**: User profile (timezone affects notification timing)
- **Sprint 3 Complete**: Theme system (notification UI uses theme)

## Deliverables

### 1. Email Notifications
Toggle controls for email notification categories:

| Category | Description | Default |
|----------|-------------|---------|
| Product Updates | New features, improvements | On |
| Security Alerts | Login attempts, password changes, 2FA | On (locked) |
| Billing Reminders | Payment due, subscription changes | On |
| Weekly Digest | Summary of activity | Off |

#### Implementation:
- Security alerts cannot be disabled (regulatory requirement)
- Toggle saves immediately via auto-save
- Email unsubscribe links sync with these settings

### 2. In-App Notifications
Event-based notification triggers:

| Event Type | Description | Default |
|------------|-------------|---------|
| New Leads | When new leads are captured | On |
| Task Completions | When background tasks complete | On |
| System Updates | Maintenance, new features | On |
| Context Updates | Changes to saved contexts | Off |
| Team Activity | Member actions (Teams plan) | On |

#### Notification Bell Component:
- Badge with unread count
- Dropdown panel with notification list
- Mark as read (individual/all)
- Quick settings link

### 3. Notification Frequency
Delivery schedule options (applies to non-urgent notifications):

- **Real-time**: Immediate delivery
- **Daily Digest**: Single daily email at configured time
- **Weekly Summary**: Weekly roundup email

#### Digest Configuration:
- Preferred delivery time (uses user's timezone from Sprint 2)
- Day of week for weekly summary
- Email preview of digest format

### 4. Quiet Hours
Time window for notification suppression:

- **Enable/Disable** toggle
- **Start Time**: e.g., 10:00 PM
- **End Time**: e.g., 7:00 AM
- **Days**: Weekdays only / All days / Custom
- **Timezone**: Uses profile timezone

#### Quiet Hours Behavior:
- In-app notifications are silently queued
- Email notifications are held and sent after quiet hours
- Urgent security alerts bypass quiet hours

### 5. Notification Center (In-App)
Global notification component (not just settings):

- **Notification Bell** in header
- **Notification Panel**:
  - Grouped by date
  - Icon per notification type
  - Click to navigate to relevant page
  - Swipe to dismiss (mobile)
- **Empty State**: "You're all caught up!"

## Database Schema
```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notifications
  email_product_updates BOOLEAN DEFAULT true,
  email_security_alerts BOOLEAN DEFAULT true, -- Cannot be disabled
  email_billing_reminders BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT false,

  -- In-app notifications
  inapp_new_leads BOOLEAN DEFAULT true,
  inapp_task_completions BOOLEAN DEFAULT true,
  inapp_system_updates BOOLEAN DEFAULT true,
  inapp_context_updates BOOLEAN DEFAULT false,
  inapp_team_activity BOOLEAN DEFAULT true,

  -- Frequency
  notification_frequency VARCHAR(20) DEFAULT 'realtime',
  digest_time TIME DEFAULT '09:00',
  digest_day INTEGER DEFAULT 1, -- Monday

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  quiet_hours_days TEXT[] DEFAULT '{"all"}',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications storage
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB, -- Additional context data
  link TEXT, -- Navigation link
  is_read BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);
```

## API Endpoints
- `GET /api/notifications/preferences` - Get notification preferences
- `PATCH /api/notifications/preferences` - Update preferences
- `GET /api/notifications` - List notifications (paginated)
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Acceptance Criteria
- [ ] Email notification toggles work correctly
- [ ] Security alerts toggle is disabled/locked
- [ ] In-app notification toggles save immediately
- [ ] Frequency selection changes delivery behavior
- [ ] Digest time respects user timezone
- [ ] Quiet hours configuration works
- [ ] Notification bell shows in header
- [ ] Unread count badge updates in real-time
- [ ] Notifications can be marked as read
- [ ] Click on notification navigates correctly

## Files to Create/Modify
- `app/settings/notifications/page.tsx`
- `components/Settings/Notifications/EmailNotifications.tsx`
- `components/Settings/Notifications/InAppNotifications.tsx`
- `components/Settings/Notifications/FrequencySettings.tsx`
- `components/Settings/Notifications/QuietHours.tsx`
- `components/Notifications/NotificationBell.tsx`
- `components/Notifications/NotificationPanel.tsx`
- `components/Notifications/NotificationItem.tsx`
- `contexts/NotificationContext.tsx`
- `hooks/useNotifications.ts`

## Provides Foundation For
- Sprint 6: Integrations (webhook notifications)
- Sprint 8: Members (team notification settings)
- Sprint 10: Audit Log (audit events can trigger notifications)
