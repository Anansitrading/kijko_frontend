# Setting Sprint 2: My Profile

## Overview
Implements the user profile settings section, allowing users to manage their personal account information including avatar, contact details, and role preferences.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system, base UI components

## Deliverables

### 1. Avatar Management
- **Avatar upload component**:
  - Drag & drop or click to upload
  - Image cropping/resizing (square aspect ratio)
  - Supported formats: JPG, PNG, GIF
  - Max file size: 2MB
  - Upload to Supabase Storage
- **Gravatar integration**:
  - Detect Gravatar by email hash
  - Toggle to use Gravatar vs custom avatar
  - Fallback to initials if no avatar

### 2. Account Information Fields
All fields use auto-save from Sprint 1.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Email | Email input | Valid email format | Show verification badge |
| First Name | Text input | Required, 1-50 chars | |
| Last Name | Text input | Required, 1-50 chars | |
| Company | Text input | Optional, max 100 chars | |
| Role | Dropdown | Required | See role options below |
| Timezone | Dropdown | Required | Used for time display |

### 3. Role Selection
Dropdown with the following options:
- Business Owner
- Developer
- Admin
- User

Role affects:
- Dashboard default view
- Feature recommendations
- Onboarding flow customization

### 4. Timezone Selection
- Searchable dropdown with all IANA timezones
- Group by region (Americas, Europe, Asia, etc.)
- Show current time in selected timezone
- Auto-detect user's timezone on first visit

### 5. Password Change
- **Current password** field (required for verification)
- **New password** field with strength indicator:
  - Minimum 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number
  - Strength bar (Weak/Medium/Strong)
- **Confirm password** field with match validation
- Separate "Change Password" button (not auto-save for security)

### 6. Email Verification Status
- Display verification badge next to email
- "Resend verification" link if unverified
- Modal confirmation when email is changed

## Database Schema Additions
```sql
-- User profile extension (supplements auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  use_gravatar BOOLEAN DEFAULT false,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  company VARCHAR(100),
  role VARCHAR(50) DEFAULT 'User',
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

## API Endpoints
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update profile fields
- `POST /api/profile/avatar` - Upload avatar image
- `DELETE /api/profile/avatar` - Remove custom avatar
- `POST /api/profile/password` - Change password
- `POST /api/profile/resend-verification` - Resend email verification

## Acceptance Criteria
- [ ] Avatar upload works with preview
- [ ] Gravatar integration functional
- [ ] All text fields auto-save correctly
- [ ] Role dropdown saves immediately
- [ ] Timezone dropdown is searchable
- [ ] Password change validates strength
- [ ] Email verification status displays correctly
- [ ] All changes persist across sessions

## Files to Create/Modify
- `app/settings/profile/page.tsx`
- `components/Settings/Profile/AvatarUpload.tsx`
- `components/Settings/Profile/GravatarToggle.tsx`
- `components/Settings/Profile/PasswordChange.tsx`
- `components/Settings/Profile/TimezoneSelect.tsx`
- `components/Settings/Profile/RoleSelect.tsx`
- `components/Settings/Profile/EmailVerification.tsx`
- `lib/gravatar.ts` - Gravatar hash utilities
- `lib/timezones.ts` - Timezone list and utilities

## Provides Foundation For
- Sprint 3: General Settings (user preferences extend profile)
- Sprint 5: Notifications (timezone affects delivery times)
- Sprint 8: Members (roles and permissions build on this)
