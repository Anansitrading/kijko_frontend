# Sprint FP1: Foundation & Header Changes

## Goal
Establish the core branding and content structure by updating headers, agent identification, and cleaning up the AI summary.

## Prerequisites Completed By This Sprint
- Repository name display in header (needed for consistent branding)
- Agent identification as "Kijko" (foundation for all user-facing interactions)
- Clean summary structure without KEY COMPONENTS (cleaner UI for subsequent features)
- Persistent timestamp across all tabs (foundation for state awareness)

## Dependencies From Previous Sprints
None - This is the foundational sprint.

## Deliverables

### Feature 1: Header Bar - Repository Name Display
- **Description**: Replace "CHAT WITH CONTEXT" text with the repository name ("panopticon-core") in the upper header bar
- **Acceptance Criteria**:
  - [ ] "CHAT WITH CONTEXT" text is removed
  - [ ] Repository name displays in the same position
  - [ ] Styling matches existing header design
  - [ ] Dynamic repository name support (not hardcoded)
- **Technical Notes**:
  - Locate header component in ContextDetailInspector
  - Add prop or context for repository name
  - Ensure responsive text truncation for long repo names

### Feature 2: Agent Identification - Kijko Branding
- **Description**: Replace "panopticon-core" agent label with "Kijko" while keeping the chatbot icon
- **Acceptance Criteria**:
  - [ ] Agent displays as "🤖 Kijko"
  - [ ] Chatbot icon (🤖) is preserved
  - [ ] Previous "panopticon-core" text is completely removed from agent line
  - [ ] Proper spacing between icon and text
- **Technical Notes**:
  - This is the second line below the repository name
  - Maintain existing icon styling

### Feature 3: AI Summary Cleanup
- **Description**: Remove the entire "KEY COMPONENTS" section from the AI-generated summary, keeping only the first paragraph
- **Acceptance Criteria**:
  - [ ] KEY COMPONENTS heading is removed
  - [ ] All bullet points under KEY COMPONENTS are removed
  - [ ] First paragraph of summary is preserved (ending with "...Tailwind CSS for styling.")
  - [ ] No visual gaps or layout issues after removal
- **Technical Notes**:
  - May require parsing summary content or adjusting the summary generation
  - Consider if this is a display filter or source modification

### Feature 4: Persistent Update Timestamp
- **Description**: Ensure the "Updated: Just now" timestamp in the lower-left corner is visible across ALL tabs
- **Acceptance Criteria**:
  - [ ] Timestamp displays in lower-left corner
  - [ ] Format: "Updated: Just now" (or relative time)
  - [ ] No container/border - plain text styling
  - [ ] Visible when switching between Overview, Sources, and other tabs
  - [ ] Subtle, light color that doesn't distract
- **Technical Notes**:
  - Move timestamp to a persistent footer component outside tab content
  - Ensure z-index doesn't conflict with other elements

## Technical Considerations
- These changes are primarily presentational/text changes
- No new state management required
- Consider creating constants for branding strings ("Kijko", etc.)
- Test across all tabs to ensure no regressions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed (if applicable)
- [ ] Visual testing across all tabs completed
- [ ] No console errors introduced
- [ ] Sprint deliverables verified in browser

## Notes
- This sprint focuses on quick wins that establish the visual foundation
- Estimated complexity: Low (text/content changes)
- Risk: Minimal - primarily UI text changes
