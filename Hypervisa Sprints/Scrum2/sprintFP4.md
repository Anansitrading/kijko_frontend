# Sprint FP4: Drag & Drop System

## Goal
Implement the complete drag & drop file upload experience with visual feedback, toast notifications, and polish the overall file management UX.

## Prerequisites Completed By This Sprint
- Complete file management system with drag & drop
- Toast notification system (reusable for future features)
- Full visual feedback system for drag interactions
- Production-ready Context Detail Inspector Tab 1

## Dependencies From Previous Sprints
- **Sprint FP1**: Header/branding, timestamp persistence
- **Sprint FP2**: Collapsible panel, select-all checkbox, "Source Files" terminology
- **Sprint FP3**: Add Files button, SourceFile interface with `compressed`, file handler, uncompressed indicator

## Deliverables

### Feature 1: Drop Zone Setup
- **Description**: Make the entire Source Files list a valid drop zone for files
- **Acceptance Criteria**:
  - [ ] Entire Source Files panel accepts dropped files
  - [ ] Drop zone covers full panel area (not just file list)
  - [ ] Works with single and multiple files
  - [ ] Prevents default browser behavior (opening file)
  - [ ] Works when panel is expanded (not collapsed)
- **Technical Notes**:
  - Add `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers
  - Use `e.preventDefault()` to allow drop
  - Consider wrapping the panel in a drop zone container

### Feature 2: Drag Visual Feedback - Dragover State
- **Description**: Provide clear visual indication when files are being dragged over the drop zone
- **Acceptance Criteria**:
  - [ ] Visual feedback activates on dragenter
  - [ ] Light border highlight (e.g., blue/accent color)
  - [ ] Slight background color change or opacity
  - [ ] "Drop files here" text/overlay appears
  - [ ] Visual feedback deactivates on dragleave or drop
  - [ ] Smooth transition in/out
- **Technical Notes**:
```typescript
const [isDragOver, setIsDragOver] = useState(false);

// Apply conditional classes based on isDragOver
className={`panel ${isDragOver ? 'drag-over' : ''}`}
```
- CSS considerations:
```css
.drag-over {
  border: 2px dashed var(--accent-color);
  background: rgba(var(--accent-rgb), 0.05);
}
```

### Feature 3: Drop Handler Integration
- **Description**: Process dropped files using the handler created in Sprint FP3
- **Acceptance Criteria**:
  - [ ] Dropped files extracted from DataTransfer
  - [ ] Files processed through `handleFilesAdded` function
  - [ ] New files appear in list with `compressed: false`
  - [ ] New files have uncompressed visual indicator
  - [ ] File count and total size update correctly
  - [ ] Duplicate handling works (skip or rename)
- **Technical Notes**:
```typescript
const onDrop = (e: DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFilesAdded(files);
    showToast(); // Trigger toast
  }
};
```

### Feature 4: Toast Notification Component
- **Description**: Create a reusable toast notification component for warnings and feedback
- **Acceptance Criteria**:
  - [ ] Toast appears center of screen
  - [ ] Semi-transparent background
  - [ ] Supports warning type (orange/yellow accent)
  - [ ] Fade in/out animation
  - [ ] No buttons required
  - [ ] Configurable message and duration
- **Technical Notes**:
```typescript
interface ToastProps {
  message: string;
  duration?: number; // default 3000-4000ms
  type: 'warning' | 'info' | 'success';
  onClose?: () => void;
}
```

### Feature 5: Toast Behavior & Interactions
- **Description**: Implement toast auto-dismiss and click-to-close behavior
- **Acceptance Criteria**:
  - [ ] Auto-dismiss after 3-4 seconds
  - [ ] Clicking anywhere outside toast closes it
  - [ ] Clicking on toast itself also closes it
  - [ ] Fade in animation on appear (~200ms)
  - [ ] Fade out animation on dismiss (~200ms)
  - [ ] Only one toast shown at a time (queue or replace)
- **Technical Notes**:
  - Use `setTimeout` for auto-dismiss
  - Use `useEffect` cleanup to clear timeout
  - Consider backdrop click handler or global click listener

### Feature 6: Uncompressed Files Toast
- **Description**: Show warning toast when files are added (via drop or Add Files button)
- **Acceptance Criteria**:
  - [ ] Toast shows: "⚠️ Deze bestanden zijn nog niet gecomprimeerd"
  - [ ] Appears immediately after files are added
  - [ ] Warning styling (orange/yellow accent)
  - [ ] Same behavior for drag & drop and Add Files button
  - [ ] Doesn't show if no files were actually added
- **Technical Notes**:
  - Integrate toast trigger into `handleFilesAdded`
  - Or call toast in both drop handler and file picker handler

### Feature 7: File Type Filtering
- **Description**: Ensure only relevant file types are accepted via drag & drop
- **Acceptance Criteria**:
  - [ ] Accepts: .ts, .tsx, .js, .jsx, .json, .md, .css, .scss, .html, .yml, .yaml
  - [ ] Gracefully handles rejected files
  - [ ] Option: show info toast for rejected files
  - [ ] Folders are handled appropriately (reject or flatten)
- **Technical Notes**:
  - Check `file.type` and/or file extension
  - Create allowlist of accepted types
  - Consider warning user about rejected files

### Feature 8: Edge Cases & Polish
- **Description**: Handle edge cases and add final polish to the drag & drop experience
- **Acceptance Criteria**:
  - [ ] Dragging over collapsed panel doesn't break UI
  - [ ] Very large files handled gracefully
  - [ ] Many files at once handled (10+)
  - [ ] Empty drop (no files) doesn't trigger toast
  - [ ] Drag from external apps works (file explorer)
  - [ ] No console errors during drag operations
- **Technical Notes**:
  - Test with edge cases
  - Consider auto-expanding panel on drag if collapsed
  - Add loading state for large file batches if needed

## Technical Considerations

### State Management
```typescript
interface PanelState {
  collapsed: boolean;
  files: SourceFile[];
  selectAllToggle: boolean;
  isDragOver: boolean; // NEW
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'warning' | 'info' | 'success';
}
```

### Event Handler Pattern
```typescript
// Drag events need all four handlers
onDragOver={(e) => {
  e.preventDefault();
  e.stopPropagation();
}}
onDragEnter={(e) => {
  e.preventDefault();
  setIsDragOver(true);
}}
onDragLeave={(e) => {
  e.preventDefault();
  setIsDragOver(false);
}}
onDrop={handleDrop}
```

### Toast Hook (Optional Enhancement)
```typescript
const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType, duration = 3500) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
};
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed
- [ ] Cross-browser testing (Chrome, Firefox, Edge)
- [ ] Drag & drop works from file explorer
- [ ] Toast displays and dismisses correctly
- [ ] No visual glitches during drag
- [ ] Performance acceptable with many files
- [ ] Sprint deliverables verified
- [ ] Full Tab 1 implementation complete

## Testing Checklist
- [ ] Drop single file
- [ ] Drop multiple files
- [ ] Drop folder (test rejection/handling)
- [ ] Drop unsupported file type
- [ ] Drop on collapsed panel
- [ ] Drag leave without drop
- [ ] Toast auto-dismiss
- [ ] Toast click-to-dismiss
- [ ] Add Files button still works
- [ ] Uncompressed indicator shows for new files
- [ ] File count/size updates correctly
- [ ] No memory leaks (repeated drops)

## Notes
- This is the most complex sprint with the highest risk
- Drag & drop has many browser quirks - test thoroughly
- The toast component should be designed for reuse across the application
- Consider creating a shared `useFileUpload` hook for the combined logic
- This sprint completes the Context Detail Inspector Tab 1 implementation
