# Setting Sprint 4: Security and Data

## Overview
Implements core security features including Two-Factor Authentication (2FA), session management, API key management, and GDPR-compliant data export functionality.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system
- **Sprint 2 Complete**: User profile (security extends user account)
- **Sprint 3 Complete**: Theme system (security UI uses theme)

## Deliverables

### 1. Two-Factor Authentication (2FA)

#### Setup Flow:
1. User clicks "Enable 2FA"
2. Generate and display QR code (TOTP secret)
3. User scans with authenticator app (Google Authenticator, Authy, etc.)
4. User enters verification code to confirm
5. Display backup codes (one-time use)
6. 2FA is now active

#### Components:
- **2FA Setup Modal**:
  - QR code display
  - Manual entry key option
  - Code verification input
  - Backup codes display (downloadable)
- **2FA Status Badge**: Enabled/Disabled indicator
- **Disable 2FA**: Requires current password + 2FA code

#### Backup Codes:
- Generate 10 backup codes on setup
- Each code is one-time use
- Allow regeneration (invalidates old codes)
- Downloadable as text file

### 2. Active Sessions Management

#### Session Display:
| Column | Description |
|--------|-------------|
| Device | Browser + OS (e.g., "Chrome on Windows") |
| Location | City, Country (via IP geolocation) |
| IP Address | Masked for privacy (e.g., "192.168.xxx.xxx") |
| Last Active | Relative time (e.g., "2 hours ago") |
| Status | Current session badge |

#### Actions:
- **Terminate Session**: End individual session (except current)
- **Terminate All Others**: End all sessions except current
- **Current Session**: Highlighted, cannot be terminated here

### 3. API Key Management

#### API Key Features:
- **Create New Key**:
  - Name/description field
  - Expiration option (never, 30/60/90 days, custom)
  - Permission scopes (read, write, admin)
  - Generated key shown ONCE (copy prompt)
- **Key List**:
  - Key name
  - Created date
  - Last used date
  - Expiration status
  - Usage count
- **Revoke Key**: Confirmation modal, immediate effect

#### Key Format:
```
kijko_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
kijko_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Data Export (GDPR Compliance)

#### Export Options:
- **Full Data Export**: All user data
- **Selective Export**: Choose data categories
  - Profile information
  - Settings
  - Activity history
  - Contexts and sources
  - Integration data

#### Export Format:
- JSON (machine-readable)
- ZIP archive containing structured files

#### Export Flow:
1. User requests export
2. System queues export job
3. Email notification when ready
4. Download link valid for 24 hours
5. Export history tracked

## Database Schema
```sql
-- 2FA settings
CREATE TABLE user_2fa (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT, -- Encrypted TOTP secret
  is_enabled BOOLEAN DEFAULT false,
  backup_codes_hash TEXT[], -- Hashed backup codes
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL,
  device_info JSONB, -- {browser, os, device_type}
  ip_address INET,
  location JSONB, -- {city, country, region}
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix VARCHAR(20), -- First few chars for identification
  scopes TEXT[] DEFAULT '{"read"}',
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data export requests
CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, ready, expired
  export_type VARCHAR(20), -- full, selective
  categories TEXT[],
  file_url TEXT,
  file_size BIGINT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- RLS policies for all tables
```

## API Endpoints
- `POST /api/security/2fa/setup` - Initialize 2FA setup
- `POST /api/security/2fa/verify` - Verify and enable 2FA
- `POST /api/security/2fa/disable` - Disable 2FA
- `GET /api/security/2fa/backup-codes` - Get/regenerate backup codes
- `GET /api/security/sessions` - List active sessions
- `DELETE /api/security/sessions/:id` - Terminate session
- `DELETE /api/security/sessions/others` - Terminate all other sessions
- `GET /api/security/api-keys` - List API keys
- `POST /api/security/api-keys` - Create new API key
- `DELETE /api/security/api-keys/:id` - Revoke API key
- `POST /api/data/export` - Request data export
- `GET /api/data/exports` - List export history

## Acceptance Criteria
- [ ] 2FA setup flow works with QR code
- [ ] Backup codes generated and downloadable
- [ ] 2FA required on login when enabled
- [ ] Sessions list shows all active sessions
- [ ] Can terminate other sessions
- [ ] API keys can be created with scopes
- [ ] API key shown only once on creation
- [ ] API keys can be revoked
- [ ] Data export generates valid JSON
- [ ] Export download link works

## Files to Create/Modify
- `app/settings/security/page.tsx`
- `components/Settings/Security/TwoFactorSetup.tsx`
- `components/Settings/Security/BackupCodes.tsx`
- `components/Settings/Security/SessionsList.tsx`
- `components/Settings/Security/ApiKeyManager.tsx`
- `components/Settings/Security/ApiKeyCreate.tsx`
- `components/Settings/Security/DataExport.tsx`
- `lib/2fa.ts` - TOTP utilities
- `lib/api-keys.ts` - API key generation utilities

## Provides Foundation For
- Sprint 6: Integrations (API keys used for webhook auth)
- Sprint 9: Advanced Security (builds on basic security)
- Sprint 10: Audit Log (security events are logged)
