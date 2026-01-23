# Sprint FP3: Main Content Panel - Header, Tabs & Chat

## Goal
Build the complete main content panel with project header, tab navigation, chat area with AI summary, suggested questions, and chat input with token display.

## Prerequisites Completed By This Sprint
- Project header with editable name and live status indicator
- Full tab navigation system (Overview & Chat, Compression, Enrichments, Users, Changelog)
- Chat interface with AI summary display
- Suggested questions functionality
- Chat input with token/context usage display
- Close button navigation back to overview

## Dependencies From Previous Sprints
- Sprint FP1: MainContent shell component and routing exists
- Sprint FP2: Selected files state is available for context calculation

## Deliverables

### Feature 1: Project Header Component
- **Description**: Create the header with project name, status indicators, and close button
- **Acceptance Criteria**:
  - [x] Project/codebase name displayed with wrench icon
  - [x] Name is editable on click (inline edit with save)
  - [x] "Live" status indicator (green dot + "Live" text) in top right
  - [x] Close button (X) in top right corner
  - [x] Close button navigates back to ProjectContext overview
  - [x] Header styling matches design reference
- **Technical Notes**: Create `MainContent/ProjectHeader.tsx`. Use `useNavigate()` for close button.

### Feature 2: Tab Navigation
- **Description**: Implement the tab system for switching between views
- **Acceptance Criteria**:
  - [x] Five tabs: "Overview & Chat", "Compression", "Enrichments", "Users", "Changelog"
  - [x] Active tab visually highlighted
  - [x] Tab click switches displayed content
  - [x] Tab state persists during session
  - [x] Smooth transition between tab content (optional animation)
- **Technical Notes**: Create `MainContent/TabNavigation.tsx`. Reuse existing tab components where applicable.

### Feature 3: Tab Content Integration
- **Description**: Connect existing tab content components to the new tab system
- **Acceptance Criteria**:
  - [x] Overview & Chat tab shows ChatArea component
  - [x] Compression tab integrates existing `CompressionTab` component
  - [x] Enrichments tab integrates existing `EnrichmentsTab` component
  - [x] Users tab integrates existing `UsersTab` component
  - [x] Changelog tab integrates existing `ChangelogTab` component
  - [x] Each tab loads its content appropriately
- **Technical Notes**: Import and render existing tab components from `components/ContextDetailInspector/tabs/`.

### Feature 4: AI Summary Message
- **Description**: Create the initial AI-generated summary message display
- **Acceptance Criteria**:
  - [x] Displayed as first message in chat from "Kijko"
  - [x] Shows "AI-generated summary" label/badge
  - [x] Contains codebase description and key information
  - [x] Styled distinctly from user messages
  - [x] Summary content loaded from project data
- **Technical Notes**: Already implemented in existing `ChatPanel.tsx` component. Integrated via OverviewTab.

### Feature 5: Suggested Questions
- **Description**: Create clickable suggested questions below the AI summary
- **Acceptance Criteria**:
  - [x] Display 3-5 suggested questions as clickable items
  - [x] Questions are relevant to the codebase/project
  - [x] Clicking a question populates the chat input
  - [x] Questions styled as subtle buttons or links
  - [x] Questions hide after first user message (optional)
- **Technical Notes**: Already implemented in existing `ChatPanel.tsx` component. Integrated via OverviewTab.

### Feature 6: Chat Area
- **Description**: Create the main chat conversation display area
- **Acceptance Criteria**:
  - [x] Scrollable message history container
  - [x] Messages displayed with sender identification
  - [x] AI responses include source citations (clickable references)
  - [x] User messages styled differently from AI messages
  - [x] Auto-scroll to newest message
  - [x] Proper spacing between messages
- **Technical Notes**: Already implemented in existing `ChatPanel.tsx` and `ChatMessage.tsx` components. Integrated via OverviewTab.

### Feature 7: Chat Input Component
- **Description**: Create the message input field with send functionality
- **Acceptance Criteria**:
  - [x] Text input field with placeholder "Ask about this context..."
  - [x] Send button (arrow icon or similar)
  - [x] Enter key submits message
  - [x] Shift+Enter allows multi-line input
  - [x] Input clears after sending
  - [x] Disabled state while AI is responding
- **Technical Notes**: Already implemented in existing `ChatInput.tsx`. Enhanced with token usage display. Integrated via OverviewTab.

### Feature 8: Token/Context Usage Display
- **Description**: Show the current token usage and context size in the footer
- **Acceptance Criteria**:
  - [x] Display current token count vs limit
  - [x] Visual indicator (progress bar or text)
  - [x] Updates when selected files change
  - [x] Warning state when approaching limit
  - [x] Positioned in chat footer area
- **Technical Notes**: Implemented in `ChatInput.tsx` with progress bar and warning states. Calculates tokens based on selected files.

### Feature 9: Chat Message State Management
- **Description**: Implement state for chat messages and conversation
- **Acceptance Criteria**:
  - [x] Messages array state maintained
  - [x] New messages append to array
  - [x] Message loading states handled
  - [x] Error states for failed messages
  - [x] Messages persist during tab switching
- **Technical Notes**: Already implemented via `useContextChat` hook and `ChatHistoryContext`. Tab state persists via localStorage.

## Technical Considerations
- Ensure existing tab components work without modal context
- Consider lazy loading for tab content to improve performance
- Chat should work with the selected files context from left sidebar
- Token calculation should be efficient (cache or debounce)

## Definition of Done
- [x] All acceptance criteria met
- [x] Main content panel matches design reference
- [x] Tab navigation works smoothly
- [x] Chat functionality is operational (can send and receive messages)
- [x] Token display updates correctly
- [x] Close button navigates back properly
- [x] All existing tab features preserved
- [x] Code reviewed and follows project conventions

## Notes
- The chat backend integration may use mock responses initially
- Source citations in chat responses link back to files in left sidebar
- Existing tab components may need minor refactoring to work in new context
- The "Overview & Chat" tab is the default/primary view
