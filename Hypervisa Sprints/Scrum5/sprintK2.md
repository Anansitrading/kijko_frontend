# Sprint FP2: Left Sidebar - Source Files & Ingestion

## Goal
Build the complete left sidebar with Kijko branding, New Ingestion button, source files list with checkboxes, and system footer.

## Prerequisites Completed By This Sprint
- Fully functional left sidebar with all UI elements
- Source file selection mechanism (checkbox state management)
- New Ingestion button placement and click handler ready for logic
- System status footer display
- Foundation for ingestion functionality migration

## Dependencies From Previous Sprints
- Sprint FP1: Page route and 3-panel layout structure must be complete
- Sprint FP1: LeftSidebar shell component exists

## Deliverables

### Feature 1: Kijko Header Component
- **Description**: Create the branded header section with logo and version text
- **Acceptance Criteria**:
  - [ ] Kijko logo displayed (use existing logo asset or styled "K" icon)
  - [ ] "CMD_CENTER_v2.1" text displayed below/beside logo
  - [ ] Proper spacing and alignment matching design reference
  - [ ] Dark background consistent with sidebar
- **Technical Notes**: Create `LeftSidebar/KijkoHeader.tsx`. Check existing components for logo assets.

### Feature 2: New Ingestion Button
- **Description**: Create the prominent blue "New Ingestion" button at the top of the sidebar
- **Acceptance Criteria**:
  - [ ] Full-width blue button with "New Ingestion" text
  - [ ] Plus icon or appropriate indicator
  - [ ] Hover and active states styled
  - [ ] Click handler prop for triggering ingestion flow
  - [ ] Button is visually prominent as primary action
- **Technical Notes**: Create `LeftSidebar/NewIngestionButton.tsx`. This will connect to migrated ingestion logic in Sprint FP5.

### Feature 3: Source Files Section Header
- **Description**: Create the "Source Files" header with count and size display
- **Acceptance Criteria**:
  - [ ] "Source Files" label displayed
  - [ ] Count display format: "selected/total" (e.g., "18/24")
  - [ ] Size display format (e.g., "2.6 MB")
  - [ ] Collapsible chevron icon (optional, for future)
- **Technical Notes**: Part of `LeftSidebar/SourceFilesList.tsx`.

### Feature 4: Source Files List
- **Description**: Create the scrollable list of source files with selection capability
- **Acceptance Criteria**:
  - [ ] Scrollable container when files exceed viewport
  - [ ] Each file shows: checkbox, file type icon, filename, file size
  - [ ] File type icons differentiate: TypeScript, JavaScript, JSON, Markdown, etc.
  - [ ] Long filenames truncate with ellipsis
  - [ ] Checkbox selection updates selected count in header
  - [ ] Select all / deselect all functionality (header checkbox)
- **Technical Notes**: Create `LeftSidebar/SourceFilesList.tsx` and `LeftSidebar/SourceFileItem.tsx`.

### Feature 5: Source File Item Component
- **Description**: Individual file item with checkbox and metadata
- **Acceptance Criteria**:
  - [ ] Checkbox input (controlled component)
  - [ ] File type icon based on extension
  - [ ] Filename with proper truncation
  - [ ] File size display (formatted: KB, MB)
  - [ ] Hover state for better UX
  - [ ] Click anywhere on row toggles checkbox
- **Technical Notes**: Create `LeftSidebar/SourceFileItem.tsx`. Use Lucide icons for file types.

### Feature 6: Add Files Button
- **Description**: Create the "+ Add Files" button at the bottom of the files list
- **Acceptance Criteria**:
  - [ ] Button positioned at bottom of files section
  - [ ] Plus icon with "Add Files" text
  - [ ] Click handler for triggering file addition
  - [ ] Styled consistently with design (subtle, secondary action)
- **Technical Notes**: This may trigger the same flow as New Ingestion or a simplified file picker.

### Feature 7: System Footer
- **Description**: Create the footer with system status and settings link
- **Acceptance Criteria**:
  - [ ] "SYSTEM OPTIMAL" status text with green dot indicator
  - [ ] Status indicator reflects actual system state (or mock for now)
  - [ ] "System Settings" link with gear icon
  - [ ] Click on settings navigates to settings page
  - [ ] Footer stays fixed at bottom of sidebar
- **Technical Notes**: Create `LeftSidebar/SystemFooter.tsx`.

### Feature 8: Selected Files State Management
- **Description**: Implement state management for file selection
- **Acceptance Criteria**:
  - [ ] `selectedFileIds` state array maintained
  - [ ] Selection persists during session
  - [ ] Selection affects which files are included in chat context
  - [ ] Selection state accessible to other components
- **Technical Notes**: Use React Context or lift state to page level. This state will be used by the chat functionality.

## Technical Considerations
- File type icon mapping should be extensible for new file types
- Consider virtualization for very large file lists (100+ files)
- Ensure accessibility: proper labels, keyboard navigation for checkboxes
- State management approach should scale to other panels

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Left sidebar matches design reference screenshot
- [ ] File selection works correctly with count updates
- [ ] All interactive elements have appropriate hover/focus states
- [ ] No horizontal overflow or layout issues
- [ ] Components are well-typed with TypeScript
- [ ] Code reviewed and follows project conventions

## Notes
- The actual ingestion logic migration happens in Sprint FP5
- Mock data can be used for the file list initially
- The selected files state will be consumed by the chat panel in Sprint FP3
