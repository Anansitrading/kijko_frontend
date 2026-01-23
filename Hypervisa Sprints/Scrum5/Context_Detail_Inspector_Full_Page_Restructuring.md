# Context Detail Inspector - Full Page Restructuring

## Overview

We are restructuring the Kijko app to transform the Context Detail Inspector from a popup/modal into a full-page route. This is a major architectural change that involves migrating the ingestion functionality from ContextStore and creating a new layout structure.

## Current vs New Architecture

**CURRENT:**
```
ProjectContext.tsx (overview page)
└─> ContextStore.tsx (codebase projects)
    └─> Context Detail Inspector (popup modal)
```

**NEW:**
```
ProjectContext.tsx (projects grid, NotebookLM-style overview)
└─> Context Detail Inspector (full page at /project/:projectId)
```

## New Layout Structure

The Context Detail Inspector will become a full-page, 3-panel layout as shown in the reference screenshot:

### Left Sidebar (~240px fixed width)

**Header Section:**
- Kijko logo with "CMD_CENTER_v2.1" text
- Blue "New Ingestion" button (prominent, full width)

**Source Files Section:**
- "Source Files" header with count and size (e.g., "18/24 | 2.6 MB")
- Scrollable list of files with:
  - Checkboxes for each file (to include/exclude from context)
  - File type icons (TypeScript, JSON, Markdown, etc.)
  - Filename and file size
  - Proper overflow handling for long names
- "+ Add Files" button at bottom of list

**Footer Section:**
- "SYSTEM OPTIMAL" status indicator (green dot + text)
- "System Settings" link with gear icon

### Middle Panel (Main Content, flexible width)

**Header:**
- Project/codebase name (e.g., "panopticon-core") with wrench icon, editable
- Tab navigation: "Overview & Chat" | "Compression" | "Enrichments" | "Users" | "Changelog"
- "Live" status indicator (green dot + text) in top right
- Close button (X) in top right corner

**Chat Area:**
- AI-generated summary as first message from Kijko
- Codebase description and key information
- Suggested questions as clickable items below summary
- Chat conversation with source citations
- Scrollable message history

**Footer:**
- Message input field with placeholder text
- Send button
- Token/context usage information display

### Right Sidebar (~280px, collapsible)

**History Panel:**
- "< HISTORY" header with back arrow (collapse trigger)
- Chat count display (e.g., "3 chats")
- List of chat sessions:
  - Chat name (editable on click)
  - Timestamp/date
  - Click to switch to that chat
- "Click to expand" state when collapsed (show only thin bar with icon)

**Footer:**
- "Export Context Info" button with download icon

## Critical Migrations

### 1. New Ingestion Button & Functionality
**MUST MIGRATE from ContextStore to new page:**
- Move "New Ingestion" button to left sidebar (top position)
- Migrate ALL ingestion logic and components:
  - File upload modal/drawer UI
  - File processing and parsing logic
  - Progress indicators and loading states
  - Error handling and validation
  - Configuration settings for ingestion
  - Success/failure notifications
- Ensure ingestion adds sources to the currently active project

### 2. Source Files Management
- Display all project sources in left sidebar
- Implement checkbox selection (controls which files are in chat context)
- Show file type icons and metadata
- Add "+ Add Files" functionality
- Display counts: selected/total files + total size

### 3. Routing & Navigation
- Create new route: `/project/:projectId`
- Route parameter provides project ID for data loading
- Close button (X) navigates back to ProjectContext.tsx overview
- Implement proper browser back button support
- Deep linking support (direct URL access)

## Technical Requirements

### Component Structure
```
src/pages/ContextDetailInspectorPage/
├─ index.tsx (main page component)
├─ components/
│  ├─ LeftSidebar/
│  │  ├─ KijkoHeader.tsx
│  │  ├─ NewIngestionButton.tsx ← MIGRATE from ContextStore
│  │  ├─ SourceFilesList.tsx
│  │  ├─ SourceFileItem.tsx
│  │  └─ SystemFooter.tsx
│  ├─ MainContent/
│  │  ├─ ProjectHeader.tsx
│  │  ├─ TabNavigation.tsx
│  │  ├─ ChatArea.tsx
│  │  ├─ AISummaryMessage.tsx
│  │  ├─ SuggestedQuestions.tsx
│  │  └─ ChatInput.tsx
│  └─ RightSidebar/
│     ├─ HistoryPanel.tsx
│     ├─ ChatHistoryItem.tsx
│     └─ ExportButton.tsx
```

### Styling (Tailwind CSS)

**Page Layout:**
```tsx
<div className="h-screen w-full bg-[#0a0e1a] flex overflow-hidden">
  <LeftSidebar className="w-[240px] flex-shrink-0" />
  <MainContent className="flex-1 min-w-0" />
  <RightSidebar className="w-[280px] flex-shrink-0 transition-all" />
</div>
```

**Key Styling Requirements:**
- Full viewport height: `h-screen`
- Dark theme background: `#0a0e1a` or similar
- 3-column layout with fixed sidebars and flexible middle
- Smooth transitions for sidebar collapse: `transition-all duration-300`
- Proper overflow handling: scrollable sections where needed
- Consistent spacing and padding throughout

### State Management

**Required State:**
- `projectId`: From route params (useParams)
- `selectedFiles`: Array of checked source file IDs
- `activeChatId`: Currently displayed chat session
- `isHistoryCollapsed`: Right sidebar collapse state
- `activeTab`: Current tab selection (Overview & Chat, etc.)
- `messages`: Chat messages for active session
- `chatHistory`: List of all chat sessions for this project

**Data Loading:**
- Load project data based on `projectId` from route
- Fetch source files for the project
- Load chat history for the project
- Load initial AI summary for the project

### Functionality to Preserve

From existing Context Detail Inspector:
- All tab functionality (Overview & Chat, Compression, Enrichments, Users, Changelog)
- Source file selection and context management
- Chat with AI including source citations
- Suggested questions that populate chat input on click
- Token/context usage tracking and display
- Live status indicator
- Export functionality

### New Functionality

- **Routing**: Proper React Router integration
- **Back Navigation**: Close button returns to ProjectContext overview
- **Collapsible History**: Right sidebar can collapse to thin bar
- **Persistent State**: Maintain state when navigating between projects
- **Deep Linking**: Direct URL access to specific projects

## Implementation Steps

1. **Create new page route** at `/project/:projectId`
2. **Build 3-panel layout** structure with proper responsive grid
3. **Migrate LeftSidebar components**:
   - Copy Kijko header
   - **MIGRATE New Ingestion button + all related functionality**
   - Implement source files list with checkboxes
   - Add system footer
4. **Build MainContent area**:
   - Project header with editable name
   - Tab navigation
   - Chat area with AI summary as first message
   - Suggested questions component
   - Chat input with token display
5. **Build RightSidebar**:
   - History panel with collapse functionality
   - Chat session list
   - Export button
6. **Connect routing**: Update ProjectContext to link to new page
7. **Test full flow**: Navigate from overview → detail → back

## Design Reference

Use the provided screenshot (`New-layout.jpg`) as the exact design reference for:
- Component placement and sizing
- Color scheme and styling
- Spacing and padding
- Icon usage and button styles
- Typography and text hierarchy

## Important Notes

- Remove ALL modal/popup code - this is now a full page
- No `position: fixed`, `z-index` for modal overlay, or max-width/height constraints
- The page should take up the full viewport
- Maintain existing dark theme and Kijko branding
- Keep code clean and well-structured for maintainability
- Use TypeScript for type safety
- Follow existing project conventions for naming and structure

---

Build this Context Detail Inspector as a complete, routable full-page component that replaces the current popup implementation, with exact layout matching the screenshot and full migration of the ingestion functionality from ContextStore.
