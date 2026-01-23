# Setting Sprint 1: Foundation & Settings Infrastructure

## Overview
This sprint establishes the foundational architecture for the entire Settings module, including navigation, layout, and the critical auto-save system that all subsequent sprints depend on.

## Prerequisites
- None (this is the foundation sprint)

## Deliverables

### 1. Settings Page Layout & Navigation
- **Settings sidebar navigation** with all section links:
  - My Profile
  - General
  - Integrations
  - Notifications
  - Security and Data
  - Billing and Usage
  - Members (with "Teams/Enterprise" badge)
  - Advanced Security
  - Audit Log
- **Responsive layout** that works on desktop and mobile
- **Active state indication** for current section
- **Route structure**: `/settings/[section]`

### 2. Auto-Save Infrastructure
This is the core functionality that ALL settings will use.

#### Requirements:
- **Auto-save hook** (`useAutoSave`) with:
  - Debounced saves for text inputs (300-500ms delay)
  - Immediate saves for toggles, dropdowns, and selections
  - Optimistic UI updates
  - Network error handling with retry logic (3 retries with exponential backoff)
  - Loading state management
  - Success/error feedback

#### Visual Feedback Components:
- **SaveStatus component** showing:
  - "Saving..." with spinner during save
  - "Saved" with checkmark on success (auto-dismiss after 2s)
  - "Error saving" with retry option on failure
- Position: Top-right of settings content area

### 3. Settings Context & State Management
- **SettingsContext** provider for global settings state
- **Supabase integration** for real-time settings persistence
- **Settings types/interfaces** for TypeScript support

### 4. Base UI Components
- **SettingsSection** - Container component for each settings group
- **SettingsRow** - Individual setting item layout
- **SettingsToggle** - Toggle switch with auto-save
- **SettingsDropdown** - Dropdown select with auto-save
- **SettingsInput** - Text input with debounced auto-save

## Database Schema
```sql
-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_key VARCHAR(255) NOT NULL,
  settings_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, settings_key)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

## Acceptance Criteria
- [ ] Settings page accessible via navigation
- [ ] Sidebar shows all settings sections
- [ ] Auto-save hook works with debouncing
- [ ] Visual feedback shows save status
- [ ] Error handling with retry works correctly
- [ ] Settings persist to Supabase
- [ ] TypeScript types defined for all settings

## Files to Create/Modify
- `app/settings/layout.tsx` - Settings layout with sidebar
- `app/settings/page.tsx` - Settings index (redirect to profile)
- `components/Settings/SettingsSidebar.tsx`
- `components/Settings/SettingsSection.tsx`
- `components/Settings/SettingsRow.tsx`
- `components/Settings/SettingsToggle.tsx`
- `components/Settings/SettingsDropdown.tsx`
- `components/Settings/SettingsInput.tsx`
- `components/Settings/SaveStatus.tsx`
- `hooks/useAutoSave.ts`
- `contexts/SettingsContext.tsx`
- `types/settings.ts`

## Provides Foundation For
- Sprint 2: My Profile (uses all base components)
- All subsequent sprints depend on this infrastructure
