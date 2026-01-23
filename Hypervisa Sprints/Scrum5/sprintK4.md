# Sprint FP4: Right Sidebar - Chat History & Export

## Goal
Build the collapsible right sidebar with chat history panel, session management, and export functionality.

## Prerequisites Completed By This Sprint
- Collapsible history sidebar with smooth animations
- Chat history list with session switching
- Editable chat names
- Export context functionality
- Complete 3-panel layout with all sidebars functional

## Dependencies From Previous Sprints
- Sprint FP1: RightSidebar shell component exists
- Sprint FP3: Chat message state and conversation system implemented
- Sprint FP3: Chat area ready to display different chat sessions

## Deliverables

### Feature 1: History Panel Container
- **Description**: Create the collapsible right sidebar container
- **Acceptance Criteria**:
  - [ ] Sidebar width: 280px when expanded
  - [ ] Collapsed state: thin bar (~40px) with expand icon
  - [ ] Smooth transition animation on collapse/expand (300ms)
  - [ ] Collapse triggered by header click or dedicated button
  - [ ] State persists during session
- **Technical Notes**: Create `RightSidebar/HistoryPanel.tsx`. Use CSS transitions for smooth animation.

### Feature 2: History Panel Header
- **Description**: Create the header with collapse control and chat count
- **Acceptance Criteria**:
  - [ ] "< HISTORY" text with back arrow icon
  - [ ] Arrow/header click collapses sidebar
  - [ ] Chat count display (e.g., "3 chats")
  - [ ] Count updates when chats are added/removed
  - [ ] Header styling consistent with design
- **Technical Notes**: Part of `RightSidebar/HistoryPanel.tsx`.

### Feature 3: Chat Session List
- **Description**: Create the scrollable list of chat sessions
- **Acceptance Criteria**:
  - [ ] Scrollable container for multiple sessions
  - [ ] Each session shows: name, date/timestamp
  - [ ] Active session visually highlighted
  - [ ] Click on session switches the chat view
  - [ ] Sessions sorted by most recent first
  - [ ] Empty state when no history exists
- **Technical Notes**: Create `RightSidebar/ChatHistoryList.tsx`.

### Feature 4: Chat History Item Component
- **Description**: Individual chat session item with edit capability
- **Acceptance Criteria**:
  - [ ] Display chat name (editable on click)
  - [ ] Display timestamp/date (e.g., "Today", "Yesterday", or date)
  - [ ] Click selects and loads this chat session
  - [ ] Active state styling (highlighted background)
  - [ ] Hover state for better UX
  - [ ] Optional: delete button on hover
- **Technical Notes**: Create `RightSidebar/ChatHistoryItem.tsx`.

### Feature 5: Editable Chat Names
- **Description**: Allow users to rename chat sessions inline
- **Acceptance Criteria**:
  - [ ] Double-click or edit icon triggers edit mode
  - [ ] Inline text input replaces name display
  - [ ] Enter saves, Escape cancels
  - [ ] Click outside saves changes
  - [ ] Name persists after edit
  - [ ] Validation: non-empty name required
- **Technical Notes**: Implement within `ChatHistoryItem.tsx` with controlled input state.

### Feature 6: New Chat Functionality
- **Description**: Allow creating new chat sessions
- **Acceptance Criteria**:
  - [ ] "New Chat" button or option available
  - [ ] Creates new session with default name (e.g., "New Chat")
  - [ ] Switches to new chat immediately
  - [ ] Previous chat preserved in history
  - [ ] New chat starts with AI summary
- **Technical Notes**: Button can be in header or as first item in list.

### Feature 7: Collapsed State View
- **Description**: Create the minimal collapsed state UI
- **Acceptance Criteria**:
  - [ ] Thin vertical bar (~40px width)
  - [ ] "Click to expand" text or icon indicator
  - [ ] Click anywhere on collapsed bar expands sidebar
  - [ ] Visual hint that content is hidden
  - [ ] Maintains dark theme styling
- **Technical Notes**: Part of `HistoryPanel.tsx` conditional rendering.

### Feature 8: Export Context Button
- **Description**: Create the export functionality in the sidebar footer
- **Acceptance Criteria**:
  - [ ] "Export Context Info" button with download icon
  - [ ] Button positioned at bottom of sidebar
  - [ ] Click triggers export flow
  - [ ] Export includes: selected files, chat history, context summary
  - [ ] Export format: JSON or markdown (or both options)
  - [ ] Shows success/error feedback after export
- **Technical Notes**: Create `RightSidebar/ExportButton.tsx`.

### Feature 9: Chat History State Management
- **Description**: Implement state management for chat history
- **Acceptance Criteria**:
  - [ ] `chatHistory` array state with all sessions
  - [ ] `activeChatId` tracks current session
  - [ ] Switching sessions updates chat area
  - [ ] New sessions added to history
  - [ ] Session data includes: id, name, messages, createdAt
  - [ ] State accessible to chat area component
- **Technical Notes**: Lift state to page level or use context. Integrate with Sprint FP3 chat state.

## Technical Considerations
- Collapse animation should not cause layout shift in main content
- Consider localStorage for persisting collapse state preference
- Chat history could be stored in localStorage or synced with backend
- Export should handle large contexts efficiently

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Right sidebar matches design reference
- [ ] Collapse/expand animation is smooth (no jank)
- [ ] Chat session switching works correctly
- [ ] Edit and delete operations work properly
- [ ] Export produces valid output file
- [ ] Layout remains stable when sidebar collapses
- [ ] Code reviewed and follows project conventions

## Notes
- Chat history persistence (localStorage vs backend) can be decided during implementation
- The export format should be useful for sharing context with other tools
- Consider adding keyboard shortcuts for sidebar toggle (future enhancement)
- The collapsed state should not break the layout or cause content reflow
