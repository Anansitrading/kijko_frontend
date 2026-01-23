# Sprint FP3: File Management Features

## Goal
Implement the "Add Files" button and establish the file state model with compression tracking, preparing the foundation for drag & drop.

## Prerequisites Completed By This Sprint
- Add Files button and file picker integration (needed for drag & drop to share same flow)
- SourceFile interface with `compressed` property (needed for drag & drop file handling)
- File addition workflow established (needed for drag & drop to reuse same logic)
- Uncompressed file visual indicator (needed for drag & drop visual feedback)

## Dependencies From Previous Sprints
- **Sprint FP1**: Header/branding in place
- **Sprint FP2**: Panel structure, terminology ("Source Files"), select-all checkbox

## Deliverables

### Feature 1: Add Files Button - UI
- **Description**: Add a subtle "+ Add files" button at the bottom of the Source Files list
- **Acceptance Criteria**:
  - [ ] Button positioned at bottom of Source Files list
  - [ ] Text: "+ Add files" or "+ Add source files"
  - [ ] Subtle styling: lighter color, smaller/less bold font
  - [ ] Plus icon combined with text
  - [ ] Hover state indicates clickability
  - [ ] Doesn't draw attention away from main content
- **Technical Notes**:
  - Position after the last file item, before any footer
  - Consider using opacity or muted text color
  - Match existing design system patterns

### Feature 2: Add Files Button - File Picker Integration
- **Description**: Clicking the Add Files button opens a native file picker dialog
- **Acceptance Criteria**:
  - [ ] Click triggers file picker dialog
  - [ ] Multiple file selection allowed
  - [ ] Accepts relevant file types: .ts, .tsx, .js, .jsx, .json, .md, .css, .html, etc.
  - [ ] Selected files are added to the Source Files list
  - [ ] Files appear at end of list or in sorted position
- **Technical Notes**:
  - Use `<input type="file" multiple accept="..." />` (hidden)
  - Trigger click programmatically on button click
  - Handle `onChange` event to process selected files

### Feature 3: SourceFile Interface Update
- **Description**: Extend the SourceFile interface to track compression status
- **Acceptance Criteria**:
  - [ ] `compressed: boolean` property added to SourceFile interface
  - [ ] Existing files default to `compressed: true`
  - [ ] Newly added files have `compressed: false`
  - [ ] Interface properly typed throughout codebase
- **Technical Notes**:
```typescript
interface SourceFile {
  id: string;
  name: string;
  size: string;
  selected: boolean;
  compressed: boolean; // NEW
  type: string;
}
```

### Feature 4: Uncompressed File Visual Indicator
- **Description**: Visually distinguish files that haven't been compressed yet
- **Acceptance Criteria**:
  - [ ] Uncompressed files have distinct visual styling
  - [ ] Options: orange/yellow tint, warning icon (⚠️), or subtle badge
  - [ ] Indicator is noticeable but not alarming
  - [ ] Clear visual difference from compressed files
  - [ ] Indicator disappears when file becomes compressed
- **Technical Notes**:
  - Consider subtle background color or left border
  - Icon option: small warning indicator next to filename
  - Ensure accessibility: don't rely solely on color

### Feature 5: File Addition Handler
- **Description**: Create reusable function to handle adding files to the list (will be shared with drag & drop)
- **Acceptance Criteria**:
  - [ ] Function accepts File[] or FileList
  - [ ] Generates unique IDs for new files
  - [ ] Extracts file metadata (name, size, type)
  - [ ] Sets `compressed: false` for new files
  - [ ] Sets `selected: true` by default for new files
  - [ ] Adds files to existing list without duplicates
  - [ ] Returns updated file list
- **Technical Notes**:
```typescript
const handleFilesAdded = (files: FileList | File[]): SourceFile[] => {
  // Process files
  // Check for duplicates by name
  // Create SourceFile objects
  // Return merged list
}
```

### Feature 6: File Size Formatting
- **Description**: Ensure newly added files have properly formatted sizes
- **Acceptance Criteria**:
  - [ ] File sizes display in human-readable format
  - [ ] Format: KB, MB as appropriate (e.g., "2.4 KB", "1.2 MB")
  - [ ] Total size in header updates when files added
  - [ ] Consistent formatting with existing files
- **Technical Notes**:
  - Use `file.size` from File API (in bytes)
  - Create or reuse formatFileSize utility function

## Technical Considerations
- This sprint establishes the file handling patterns that Sprint FP4 will extend
- Keep the file addition handler generic so drag & drop can reuse it
- Consider how the toast notification (Sprint FP4) will integrate with this flow
- Test with various file types and sizes
- Handle edge cases: empty file selection, very large files, duplicate names

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed (if applicable)
- [ ] File picker works cross-browser
- [ ] Uncompressed indicator is accessible
- [ ] File handler is reusable and testable
- [ ] Sprint deliverables verified

## Notes
- This sprint has medium complexity
- The file addition handler is a critical piece that Sprint FP4 depends on
- Focus on creating clean, reusable code for the file handling logic
- Toast notification is intentionally deferred to Sprint FP4 to keep this sprint focused
