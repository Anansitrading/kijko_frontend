# Sprint FP1: Foundation & Routing Setup

## Goal
Establish the foundational page structure, routing configuration, and 3-panel layout skeleton for the Context Detail Inspector full-page transformation.

## Prerequisites Completed By This Sprint
- React Router route configuration for `/project/:projectId`
- Base page component with 3-panel layout structure
- Navigation between ProjectContext overview and detail page
- Layout shell components ready for content implementation

## Dependencies From Previous Sprints
None - This is the foundation sprint.

## Deliverables

### Feature 1: Route Configuration
- **Description**: Set up React Router route for the new Context Detail Inspector page at `/project/:projectId`
- **Acceptance Criteria**:
  - [ ] Route `/project/:projectId` is registered in the app router
  - [ ] Route parameter `projectId` is accessible via `useParams()`
  - [ ] Invalid project IDs show appropriate error state
  - [ ] Browser back/forward navigation works correctly
- **Technical Notes**: Use React Router v6 patterns. Ensure route is added to the existing router configuration.

### Feature 2: Page Directory Structure
- **Description**: Create the folder structure for the new full-page component
- **Acceptance Criteria**:
  - [ ] Directory created: `src/pages/ContextDetailInspectorPage/`
  - [ ] Main index.tsx file created
  - [ ] Subdirectories created: `components/LeftSidebar/`, `components/MainContent/`, `components/RightSidebar/`
  - [ ] All directories contain placeholder index files
- **Technical Notes**: Follow existing project conventions for file naming and exports.

### Feature 3: Three-Panel Layout Shell
- **Description**: Implement the base 3-column layout structure using flexbox
- **Acceptance Criteria**:
  - [ ] Full viewport height layout (`h-screen`)
  - [ ] Left sidebar: fixed 240px width
  - [ ] Main content: flexible width (takes remaining space)
  - [ ] Right sidebar: fixed 280px width
  - [ ] Dark theme background applied (`#0a0e1a` or similar)
  - [ ] Proper overflow handling configured
- **Technical Notes**:
```tsx
<div className="h-screen w-full bg-[#0a0e1a] flex overflow-hidden">
  <LeftSidebar className="w-[240px] flex-shrink-0" />
  <MainContent className="flex-1 min-w-0" />
  <RightSidebar className="w-[280px] flex-shrink-0" />
</div>
```

### Feature 4: Basic Panel Components
- **Description**: Create skeleton components for each panel with placeholder content
- **Acceptance Criteria**:
  - [ ] `LeftSidebar/index.tsx` - renders with visible border/background for testing
  - [ ] `MainContent/index.tsx` - renders with visible border/background for testing
  - [ ] `RightSidebar/index.tsx` - renders with visible border/background for testing
  - [ ] Each panel shows placeholder text indicating its role
  - [ ] Panels are properly contained within their allocated space
- **Technical Notes**: Use distinct background colors initially for visual debugging of layout.

### Feature 5: Navigation Integration
- **Description**: Connect ProjectContext overview to navigate to the new detail page
- **Acceptance Criteria**:
  - [ ] Clicking a project in ProjectContext navigates to `/project/:projectId`
  - [ ] Close button (X) placeholder in MainContent header
  - [ ] Close button navigates back to ProjectContext overview
  - [ ] Deep linking works (direct URL access loads correct project)
- **Technical Notes**: Replace the current `openModal()` call with `navigate()` to the new route.

### Feature 6: Project Data Loading Hook
- **Description**: Create a custom hook for loading project data based on route parameter
- **Acceptance Criteria**:
  - [ ] `useProjectData(projectId)` hook created
  - [ ] Hook returns loading, error, and data states
  - [ ] Loading state shows skeleton/spinner
  - [ ] Error state shows appropriate message
  - [ ] Data is fetched when projectId changes
- **Technical Notes**: This hook will be expanded in later sprints. Start with basic structure that returns mock data.

## Technical Considerations
- Remove any modal-specific code patterns (no `position: fixed`, `z-index` for overlays)
- Ensure the page takes full viewport without scroll bars on the main container
- Set up proper TypeScript interfaces for component props
- Consider using CSS custom properties for consistent spacing values

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Route navigation works in all directions (forward, back, deep link)
- [ ] Layout renders correctly at common viewport sizes (1280px+)
- [ ] No console errors or TypeScript warnings
- [ ] Code follows existing project conventions
- [ ] Components are properly exported

## Notes
- This sprint focuses on infrastructure only - no actual UI content yet
- The visual appearance will be placeholder-style until subsequent sprints
- Ensure the existing Context Detail Inspector modal still works during this transition period
