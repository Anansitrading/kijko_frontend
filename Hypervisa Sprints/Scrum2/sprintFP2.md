# Sprint FP2: Panel Controls & UI Refinements

## Goal
Refine the Source Files panel with improved terminology, streamlined select-all functionality, and collapsible panel behavior.

## Prerequisites Completed By This Sprint
- "Source Files" terminology established (needed for consistent naming in future features)
- Select-all checkbox icon pattern (needed for file selection interactions in Sprint FP3/FP4)
- Collapsible panel infrastructure (needed for responsive layout with drag & drop)
- Panel state management foundation (collapsed state, used by future sprints)

## Dependencies From Previous Sprints
- **Sprint FP1**: Header and branding must be in place for visual consistency

## Deliverables

### Feature 1: Terminology Change - "Bronnen" to "Source Files"
- **Description**: Replace all instances of "Bronnen" with "Source Files" throughout the panel
- **Acceptance Criteria**:
  - [ ] Header shows "Source Files" instead of "Bronnen"
  - [ ] Format preserved: "Source Files (10/12 geselecteerd) 2.4 MB"
  - [ ] All tooltips/aria-labels updated
  - [ ] No remaining Dutch terminology in this panel
- **Technical Notes**:
  - Search codebase for "Bronnen" and replace
  - Update any i18n/translation files if applicable

### Feature 2: Select All Checkbox Icon
- **Description**: Replace the "Alle bronnen selecteren" text row with a simple checkbox icon at the top of the file list
- **Acceptance Criteria**:
  - [ ] "Alle bronnen selecteren" text row is completely removed
  - [ ] Checkbox icon appears where the folder icon (📁) currently is
  - [ ] Checkbox toggles all files selected/deselected
  - [ ] Visual states: checked (all selected), unchecked (none selected), indeterminate (partial)
  - [ ] No text label - only the checkbox icon
- **Technical Notes**:
  - Use standard checkbox component or custom icon
  - Handle three states: all, none, partial selection
  - Position at the start of the file list header area

### Feature 3: Collapsible Panel - Basic Structure
- **Description**: Add ability to collapse the left Source Files panel to maximize chat space
- **Acceptance Criteria**:
  - [ ] Collapse button positioned top-right of Source Files panel
  - [ ] Icon: `◀` (to collapse) / `▶` (to expand) or similar
  - [ ] Button is clearly clickable but subtle
  - [ ] Collapsed state: panel width ~40-50px, only expand icon visible
  - [ ] Expanded state: normal panel width
- **Technical Notes**:
  - Add collapsed boolean to panel state
  - Consider using CSS transform or width animation

### Feature 4: Collapsible Panel - Animation & Layout
- **Description**: Implement smooth animation and responsive layout adjustment when panel collapses/expands
- **Acceptance Criteria**:
  - [ ] Smooth CSS transition: 300-400ms ease-in-out
  - [ ] No abrupt visual changes during transition
  - [ ] Chat window expands to fill available space when panel collapses
  - [ ] Chat window shrinks appropriately when panel expands
  - [ ] Content doesn't overflow during animation
- **Technical Notes**:
  - Use CSS transitions on width property
  - May need to handle flex-grow/shrink on chat container
  - Test with various content lengths

### Feature 5: Panel State Persistence
- **Description**: Remember the collapsed/expanded state between interactions and optionally between sessions
- **Acceptance Criteria**:
  - [ ] State persists during current session (React state)
  - [ ] State persists between sessions (localStorage)
  - [ ] Panel opens in last-known state on reload
  - [ ] Graceful fallback if localStorage unavailable
- **Technical Notes**:
  - Key suggestion: `contextInspector.panelCollapsed`
  - Load from localStorage on mount, save on change

### Feature 6: Keyboard Shortcut (Optional Enhancement)
- **Description**: Add keyboard shortcut to toggle panel collapse
- **Acceptance Criteria**:
  - [ ] `Ctrl+B` (Windows) / `Cmd+B` (Mac) toggles panel
  - [ ] Shortcut works when focus is in the inspector
  - [ ] No conflict with other VS Code shortcuts
- **Technical Notes**:
  - Use useEffect with keydown listener
  - Check for metaKey (Mac) or ctrlKey (Windows)
  - This is optional - implement if time permits

## Technical Considerations
- Panel state interface addition:
```typescript
interface PanelState {
  collapsed: boolean;
  // ... existing properties
}
```
- CSS transitions should use `will-change: width` for performance
- Consider accessibility: collapsed panel should still be keyboard navigable
- Test panel collapse with different file list lengths

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed (if applicable)
- [ ] Animation is smooth on various devices
- [ ] State persistence works correctly
- [ ] Keyboard navigation not broken
- [ ] Sprint deliverables verified

## Notes
- This sprint has medium complexity due to animation and state management
- The collapsible panel is foundational for the drag & drop experience in Sprint FP4
- Prioritize core collapse functionality over keyboard shortcut if time-constrained
