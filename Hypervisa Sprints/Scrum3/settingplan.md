# Settings Plan - Kijko Application

## Overview
All settings use **auto-save functionality** - changes are saved automatically without requiring a "Save" button.

---

## 1. My Profile

### Account Information
- **Avatar/Gravatar**: Upload custom avatar or integrate with Gravatar service
- **Email**: Primary email address with verification status indicator
- **Password**: Change password functionality with strength requirements
- **First name & Last name**: Basic user profile information
- **Company**: Organization name (optional field)
- **Role**: Dropdown selection with options:
  - Business Owner
  - Developer
  - Admin
  - User
- **Timezone**: Dropdown with timezone selection (used when handling time without explicit timezone)

---

## 2. General

### Application Preferences
- **Model Choice**: Dropdown with AI model selection including:
  - Claude (Anthropic)
  - Gemini (Google)
  - GPT (OpenAI)
  - Other available models
- **Theme**: Global theme toggle
  - Light mode
  - Dark mode
  - *(Must be implemented globally across entire application)*

---

## 3. Integrations

### Connected Services
- **Connected Apps**: Third-party integrations with permissions management
  - Organized by categories
  - **Search functionality** to filter integrations
  - Permission controls per integration
- **Webhook Management**: Configure webhooks for real-time event notifications
  - Endpoint URL configuration
  - Event type selection
  - Webhook status monitoring

---

## 4. Notifications

### Notification Preferences
- **Email Notifications**: Toggle controls for:
  - Product updates
  - Security alerts
  - Billing reminders
- **In-app Notifications**: Event-based notification triggers:
  - New leads
  - Task completions
  - System updates
- **Notification Frequency**: Delivery schedule options
  - Real-time
  - Daily digest
  - Weekly summary
- **Quiet Hours**: Time window configuration for notification suppression

---

## 5. Security and Data

### Security Controls
- **Two-Factor Authentication (2FA)**: Enable/disable 2FA for account
- **Active Sessions**: Overview of logged-in devices
  - Session details (device, location, last active)
  - Ability to terminate individual sessions
- **API Keys**: Generate and manage API keys for integrations
  - Create new keys
  - Revoke existing keys
  - Usage tracking per key
- **Data Export**: Download all account data (GDPR compliance)
  - Full data export in machine-readable format

---

## 6. Billing and Usage

### Subscription Management
- **Current Plan**: Active subscription tier display
  - Upgrade/downgrade options
  - Plan comparison
- **Payment Method**: Payment details management
  - Credit card
  - SEPA direct debit
- **Billing History**: Invoice and payment history
  - Downloadable invoices
  - Payment status tracking
- **Usage Metrics**: Real-time usage monitoring
  - API calls count
  - Amount of ingestions
  - Storage used vs. limits
  - Seats occupied vs. available
  - Daily queries to Oracle agent/tools
- **Invoicing Details**: Business billing information
  - BTW (VAT) number
  - Invoice address for Dutch BV's

---

## 7. Members
**Availability**: Teams and Enterprise plans only

### Team Management
- **Team Overview**: List of all team members with assigned roles
- **Invite Members**: Send email invitations with role assignment
- **Permissions**: Granular access controls per role
  - Role-based permissions matrix
  - Custom permission settings
- **Pending Invitations**: Overview of outstanding invitations
  - Resend invitation option
  - Cancel invitation option

---

## 8. Advanced Security

### Enterprise Security Features
- **Login History**: Audit trail of login attempts
  - Successful and failed login attempts
  - IP addresses and timestamps
- **Security Policies**: Configurable security requirements
  - Password complexity requirements
  - Session timeout settings
- **IP Whitelist**: IP address restrictions
  - Allowed IP ranges
  - Block/allow list management
- **Compliance**: Certification and compliance status
  - SOC2 compliance status
  - ISO certifications
  - Compliance documentation

---

## 9. Audit Log

### Activity Monitoring
- **Activity Timeline**: Chronological overview of all account activities
  - User actions
  - System changes
  - API calls
  - Security events
- **Filter Options**: Advanced filtering capabilities
  - Filter by user
  - Filter by action type
  - Filter by date range
- **Export Logs**: Download audit logs for compliance purposes
  - CSV/JSON export formats
  - Configurable date ranges
- **Event Types**: Tracked event categories
  - User actions
  - System changes
  - API calls
  - Security events

---

## Technical Requirements

### Auto-Save Functionality
- All settings changes must be saved automatically
- No manual "Save" button required
- Visual feedback on save status (e.g., "Saved" indicator)
- Debounced saves for text inputs (300-500ms delay)
- Immediate saves for toggles and dropdowns

### Implementation Notes
- Use optimistic UI updates for better UX
- Handle network errors gracefully with retry logic
- Show loading states during save operations
- Maintain setting state in Supabase real-time database
