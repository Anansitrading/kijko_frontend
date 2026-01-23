# Sprint FP5: Integration, Migration & Cleanup

## Goal
Complete the ingestion functionality migration from ContextStore, integrate all components, remove deprecated modal code, and perform final testing and polish.

## Prerequisites Completed By This Sprint
- Full ingestion workflow migrated and functional
- All panels integrated and communicating properly
- Legacy modal code removed
- Complete, production-ready Context Detail Inspector page
- Full navigation flow working end-to-end

## Dependencies From Previous Sprints
- Sprint FP1: Routing and page structure complete
- Sprint FP2: Left sidebar with New Ingestion button ready
- Sprint FP3: Main content panel and chat functional
- Sprint FP4: Right sidebar with history complete

## Deliverables

### Feature 1: Ingestion Logic Migration
- **Description**: Move all ingestion functionality from ContextStore/HypervisaView to the new page
- **Acceptance Criteria**:
  - [ ] File upload modal/drawer UI migrated
  - [ ] File processing and parsing logic migrated
  - [ ] Progress indicators and loading states working
  - [ ] Error handling and validation working
  - [ ] Configuration settings for ingestion accessible
  - [ ] Success/failure notifications displayed
  - [ ] New files added to current project's source list
- **Technical Notes**: Review `components/Hypervisa/IngestionWizard.tsx` and related components. Adapt for new context.

### Feature 2: Ingestion Modal/Drawer
- **Description**: Create or adapt the ingestion UI for the new page
- **Acceptance Criteria**:
  - [ ] Triggered by "New Ingestion" button click
  - [ ] Displays file selection interface
  - [ ] Supports drag-and-drop file upload
  - [ ] Shows upload progress for each file
  - [ ] Allows configuration of ingestion settings
  - [ ] Can be dismissed/cancelled
  - [ ] Success closes modal and updates file list
- **Technical Notes**: Can be a modal overlay or slide-out drawer. Reuse existing IngestionWizard where possible.

### Feature 3: File Processing Integration
- **Description**: Connect ingestion to actually process and add files
- **Acceptance Criteria**:
  - [ ] Uploaded files are processed (parsed, indexed)
  - [ ] Processing status shown in real-time
  - [ ] Completed files appear in left sidebar list
  - [ ] File metadata extracted (size, type, line count)
  - [ ] Errors handled gracefully with user feedback
  - [ ] Large files handled appropriately
- **Technical Notes**: Connect to existing backend APIs or processing logic.

### Feature 4: Cross-Panel State Integration
- **Description**: Ensure all panels share and react to common state
- **Acceptance Criteria**:
  - [ ] Selected files (left) affect token count (middle)
  - [ ] Chat messages (middle) reference files (left)
  - [ ] Chat history (right) syncs with chat area (middle)
  - [ ] Project changes reflect across all panels
  - [ ] State updates trigger appropriate re-renders
- **Technical Notes**: Use React Context or state lifting. Ensure no stale state issues.

### Feature 5: Remove Deprecated Modal Code
- **Description**: Clean up the old Context Detail Inspector modal implementation
- **Acceptance Criteria**:
  - [ ] Modal components identified and removed/deprecated
  - [ ] ContextInspectorContext updated for new pattern
  - [ ] openModal() calls replaced with navigation
  - [ ] No dead code remaining
  - [ ] Imports cleaned up throughout codebase
- **Technical Notes**: Careful review needed to avoid breaking existing features. May keep modal for transition period.

### Feature 6: ProjectContext Grid Updates
- **Description**: Update the project overview to work with the new routing
- **Acceptance Criteria**:
  - [ ] Project cards navigate to `/project/:projectId`
  - [ ] Grid layout remains functional
  - [ ] Quick actions (if any) still work
  - [ ] New project creation flow works
  - [ ] Delete project flow works
- **Technical Notes**: Update `ProjectContext.tsx` to use React Router navigation.

### Feature 7: Deep Linking & URL State
- **Description**: Ensure direct URL access works correctly
- **Acceptance Criteria**:
  - [ ] `/project/:projectId` loads correct project
  - [ ] Invalid projectId shows 404 or error state
  - [ ] Tab state can optionally be in URL (e.g., `/project/1?tab=compression`)
  - [ ] Sharing URLs works as expected
  - [ ] Browser refresh maintains state
- **Technical Notes**: Consider URL query params for additional state like active tab.

### Feature 8: Error Boundaries & Edge Cases
- **Description**: Add error handling for component failures
- **Acceptance Criteria**:
  - [ ] Error boundary wraps major sections
  - [ ] Component errors don't crash entire page
  - [ ] Graceful fallback UI for errors
  - [ ] Network errors handled appropriately
  - [ ] Empty states for all lists (no files, no chats, etc.)
- **Technical Notes**: Use existing ErrorBoundary component or create new one.

### Feature 9: Performance Optimization
- **Description**: Ensure the page performs well with real data
- **Acceptance Criteria**:
  - [ ] Large file lists don't cause lag
  - [ ] Chat with many messages scrolls smoothly
  - [ ] Tab switching is instantaneous
  - [ ] No unnecessary re-renders
  - [ ] Memory usage reasonable
- **Technical Notes**: Use React DevTools Profiler. Consider React.memo, useMemo, useCallback where needed.

### Feature 10: Final Testing & Polish
- **Description**: Comprehensive testing of all functionality
- **Acceptance Criteria**:
  - [ ] Full flow tested: overview → project → chat → back
  - [ ] All tabs functional with real/mock data
  - [ ] Responsive behavior at common breakpoints
  - [ ] Keyboard navigation works
  - [ ] Accessibility basics covered (labels, focus states)
  - [ ] No console errors or warnings
  - [ ] Visual polish matches design reference
- **Technical Notes**: Create a testing checklist. Document any known issues.

## Technical Considerations
- Migration should be careful to not break existing functionality
- Consider feature flags for gradual rollout
- Backup plan: keep modal code available but unused
- Document any architectural decisions made during integration

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Ingestion workflow fully functional in new location
- [ ] All panels integrated and working together
- [ ] No regression in existing functionality
- [ ] Legacy modal code deprecated or removed
- [ ] Performance acceptable with realistic data
- [ ] Code reviewed and follows project conventions
- [ ] Documentation updated if needed

## Notes
- This is the final sprint - aim for production quality
- Consider creating a migration guide for the team
- Document any technical debt created for future cleanup
- The old modal can be kept as fallback during initial rollout if needed
- Success metric: users can do everything they could before, plus benefit from full-page layout
