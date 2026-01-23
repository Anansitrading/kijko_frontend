# Setting Sprint 3: General Settings (Theme & Model)

## Overview
Implements global application preferences including AI model selection and theme management. The theme system must be implemented globally across the entire application.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure, auto-save system
- **Sprint 2 Complete**: User profile (preferences extend profile context)

## Deliverables

### 1. AI Model Selection
Dropdown to select preferred AI model for all AI-powered features.

#### Available Models:
| Model | Provider | Description |
|-------|----------|-------------|
| Claude | Anthropic | Advanced reasoning and analysis |
| Gemini | Google | Multimodal AI capabilities |
| GPT-4 | OpenAI | General purpose AI |
| GPT-4o | OpenAI | Optimized for speed |

#### Implementation:
- Store selected model in user settings
- Provide model to all AI service calls
- Show model capabilities tooltip on hover
- Auto-save on selection change

### 2. Global Theme System
Theme must be implemented across the **entire application**, not just settings.

#### Theme Options:
- **Light Mode**: Default light theme
- **Dark Mode**: Full dark theme
- **System**: Follow OS preference (optional enhancement)

#### Implementation Requirements:

##### CSS Variables Approach:
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  /* ... more variables */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  /* ... more variables */
}
```

##### Theme Context:
- **ThemeContext** provider at app root level
- Persist theme preference to localStorage + Supabase
- Apply theme on initial load (prevent flash)
- Sync across browser tabs

##### Components to Update:
All existing components must use CSS variables for colors:
- Navigation/Header
- Sidebar
- Cards and Panels
- Modals and Dialogs
- Forms and Inputs
- Tables
- Buttons
- Context Inspector components
- Toast notifications

### 3. Theme Toggle Component
- **Visual toggle** showing sun/moon icons
- Smooth transition animation between themes
- Accessible (keyboard navigation, ARIA labels)
- Available in Settings AND as quick toggle in header

## State Management

### Theme State Flow:
```
User selects theme
  → Update ThemeContext
  → Apply to document (data-theme attribute)
  → Save to localStorage (immediate)
  → Save to Supabase (background)
```

### Initial Load:
```
1. Check localStorage for cached theme
2. Apply immediately (prevent flash)
3. Fetch from Supabase for sync
4. Update if different from cache
```

## Database Schema Additions
```sql
-- Add to user_settings or create general_settings
INSERT INTO user_settings (user_id, settings_key, settings_value)
VALUES
  (user_id, 'theme', '"light"'),
  (user_id, 'ai_model', '"claude"');
```

## Acceptance Criteria
- [ ] Model dropdown shows all available AI models
- [ ] Model selection persists and is used by AI services
- [ ] Theme toggle switches between light/dark
- [ ] Theme applies globally to ALL components
- [ ] No flash of wrong theme on page load
- [ ] Theme syncs across browser tabs
- [ ] Theme persists across sessions
- [ ] Smooth transition animation between themes
- [ ] Quick toggle available in header

## Files to Create/Modify
### New Files:
- `app/settings/general/page.tsx`
- `components/Settings/General/ModelSelect.tsx`
- `components/Settings/General/ThemeToggle.tsx`
- `contexts/ThemeContext.tsx`
- `hooks/useTheme.ts`
- `styles/themes.css` - CSS variable definitions

### Files to Modify (for theme support):
- `app/layout.tsx` - Add ThemeProvider
- `app/globals.css` - Add CSS variables
- All component files - Update to use CSS variables
- `components/Header/` - Add quick theme toggle

## Provides Foundation For
- Sprint 4: Security (theme applies to security pages)
- Sprint 6: Integrations (model choice affects AI integrations)
- All future sprints inherit theme system
