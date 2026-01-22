# Sprint 7: Diff Viewer & Rollback Functionality

## Sprint Goal
Implement the diff viewer modal for viewing file changes between versions and the rollback functionality with confirmation dialogs.

## Prerequisites (from Sprint 1-6)
- Changelog tab with ingestion entries
- Modal component pattern
- Confirmation dialog pattern
- "View Full Diff" and "Rollback" buttons in place (disabled)

---

## User Stories

### US-7.1: View Full Diff
**As a** user
**I want** to view detailed file differences between versions
**So that** I can understand exactly what changed

**Acceptance Criteria:**
- [ ] "View Full Diff" button opens diff viewer modal
- [ ] Modal shows diff between selected version and previous
- [ ] Syntax highlighted code diff
- [ ] Line numbers displayed
- [ ] Color coding: Green for added, Red for removed
- [ ] Navigate between files (Previous/Next)
- [ ] File selector dropdown
- [ ] View mode toggle: Unified vs Split

### US-7.2: Download Diff
**As a** user
**I want** to download the diff
**So that** I can share or archive the changes

**Acceptance Criteria:**
- [ ] "Download Diff" button in diff viewer
- [ ] Downloads as .patch file
- [ ] Includes all files in the diff

### US-7.3: Rollback to Version
**As a** user
**I want** to rollback to a previous version
**So that** I can undo unwanted changes

**Acceptance Criteria:**
- [ ] "Rollback to #X" button shows confirmation modal
- [ ] Confirmation shows what will happen (files restored/removed/re-added)
- [ ] "Confirm Rollback" triggers rollback
- [ ] Progress indicator during rollback
- [ ] Success/error feedback
- [ ] Current state backed up before rollback

### US-7.4: Compare Versions
**As a** user
**I want** to compare any two versions
**So that** I can see changes across multiple ingestions

**Acceptance Criteria:**
- [ ] "Compare Versions" button in footer
- [ ] Version selector modal (pick two versions)
- [ ] Opens diff viewer with selected versions

---

## Technical Tasks

### T-7.1: API Endpoints
Implement or mock:

```
GET    /api/context/:id/changelog/:number/diff     # Get diff for version
GET    /api/context/:id/diff/:from/:to             # Compare two versions
POST   /api/context/:id/rollback/:number           # Rollback to version
GET    /api/context/:id/rollback/:number/preview   # Preview rollback changes
```

### T-7.2: Diff Viewer Modal
Create `components/ContextDetailInspector/modals/DiffViewerModal.tsx`:

```typescript
interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  fromVersion: number;
  toVersion: number;
}

interface DiffData {
  files: DiffFile[];
  summary: {
    filesAdded: number;
    filesRemoved: number;
    filesModified: number;
    totalAdditions: number;
    totalDeletions: number;
  };
}

interface DiffFile {
  path: string;
  status: 'added' | 'removed' | 'modified';
  hunks: DiffHunk[];
  linesAdded: number;
  linesRemoved: number;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}
```

### T-7.3: Diff Header Component
Create `components/ContextDetailInspector/modals/DiffViewer/DiffHeader.tsx`:

```typescript
interface DiffHeaderProps {
  fromVersion: number;
  toVersion: number;
  viewMode: 'unified' | 'split';
  onViewModeChange: (mode: 'unified' | 'split') => void;
  currentFile: string;
  files: string[];
  onFileChange: (file: string) => void;
  onClose: () => void;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ DIFF: Ingestion #12 → #11                  [✕]  │
├──────────────────────────────────────────────────┤
│ [Unified ▼]  [src/core/client.ts ▼]             │
└──────────────────────────────────────────────────┘
```

### T-7.4: Unified Diff View Component
Create `components/ContextDetailInspector/modals/DiffViewer/UnifiedDiffView.tsx`:

```typescript
interface UnifiedDiffViewProps {
  file: DiffFile;
}
```

**Layout:**
```
│ src/core/client.ts                               │
│                                                  │
│ 1    import { Config } from './config';          │
│ 2  + import { WebSocketManager } from '../...';  │ <- Green bg
│ 3    import { ApiClient } from './api';          │
│ 4                                                │
│ 5    export class PanopticonClient {             │
│ 6  -   constructor(config: Config) {             │ <- Red bg
│ 7  +   constructor(config: Config, ws = false) { │ <- Green bg
│ 8        this.config = config;                   │
```

### T-7.5: Split Diff View Component
Create `components/ContextDetailInspector/modals/DiffViewer/SplitDiffView.tsx`:

```typescript
interface SplitDiffViewProps {
  file: DiffFile;
}
```

Two-column layout showing old and new side by side.

### T-7.6: Diff Line Component
Create `components/ContextDetailInspector/modals/DiffViewer/DiffLine.tsx`:

```typescript
interface DiffLineProps {
  line: DiffLine;
  showLineNumbers: boolean;
}
```

**Styling:**
- Addition: Green background (#10b98120), green text
- Deletion: Red background (#ef444420), red text
- Context: Gray background, normal text
- Line numbers: Muted, fixed width

### T-7.7: Diff Footer Component
Create `components/ContextDetailInspector/modals/DiffViewer/DiffFooter.tsx`:

```typescript
interface DiffFooterProps {
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  onDownload: () => void;
}
```

**Layout:**
```
│ [< Previous File]  [Next File >]  [Download Diff]│
```

### T-7.8: Rollback Confirmation Modal
Create `components/ContextDetailInspector/modals/RollbackConfirmModal.tsx`:

```typescript
interface RollbackConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetVersion: number;
  preview: RollbackPreview;
  isRollingBack: boolean;
}

interface RollbackPreview {
  filesToRestore: number;
  filesToRemove: number;
  filesToReAdd: number;
  currentVersion: number;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ Confirm Rollback                            [✕]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ⚠️  Are you sure you want to rollback to        │
│     Ingestion #11?                               │
│                                                  │
│ This will:                                       │
│ • Restore 847 files to their previous state     │
│ • Remove 127 recently added files                │
│ • Re-add 3 previously deleted files              │
│ • Create backup of current state (#12)          │
│                                                  │
│ This action can be undone by rolling forward.   │
│                                                  │
│         [Cancel]  [Confirm Rollback]             │
└──────────────────────────────────────────────────┘
```

### T-7.9: Version Selector Modal
Create `components/ContextDetailInspector/modals/VersionSelectorModal.tsx`:

```typescript
interface VersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (fromVersion: number, toVersion: number) => void;
  versions: VersionInfo[];
}

interface VersionInfo {
  number: number;
  timestamp: Date;
  author: string;
}
```

### T-7.10: Syntax Highlighting
Implement syntax highlighting for diff content:

```typescript
// utils/syntaxHighlight.ts
function highlightCode(code: string, language: string): string {
  // Use a library like Prism.js or highlight.js
  // Or use a React component like react-syntax-highlighter
}

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'md': 'markdown',
    // ... etc
  };
  return languageMap[ext || ''] || 'text';
}
```

### T-7.11: Diff Download Utility
Create download functionality:

```typescript
// utils/downloadDiff.ts
function generatePatch(diff: DiffData): string {
  // Generate unified diff format
  // Standard .patch file format
}

function downloadDiff(diff: DiffData, filename: string) {
  const patch = generatePatch(diff);
  const blob = new Blob([patch], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  // Trigger download
}
```

### T-7.12: Custom Hooks
Create hooks for diff and rollback:

```typescript
// hooks/useDiff.ts
interface UseDiffReturn {
  diff: DiffData | null;
  isLoading: boolean;
  error: string | null;
  currentFileIndex: number;
  setCurrentFileIndex: (index: number) => void;
}

function useDiff(contextId: string, fromVersion: number, toVersion: number): UseDiffReturn;

// hooks/useRollback.ts
interface UseRollbackReturn {
  preview: RollbackPreview | null;
  isLoading: boolean;
  error: string | null;
  rollback: () => Promise<void>;
  isRollingBack: boolean;
}

function useRollback(contextId: string, targetVersion: number): UseRollbackReturn;
```

### T-7.13: Enable Changelog Buttons
Update changelog entry buttons:

```typescript
// Enable "View Full Diff" button
<Button onClick={() => setDiffModalOpen(true)}>
  View Full Diff
</Button>

// Enable "Rollback to #X" button
<Button onClick={() => setRollbackModalOpen(true)}>
  Rollback to #{entry.number - 1}
</Button>

// Enable "Compare Versions" footer button
<Button onClick={() => setVersionSelectorOpen(true)}>
  Compare Versions
</Button>
```

---

## UI Specifications

### Diff Viewer Modal Layout
```
┌─────────────────────────────────────────────────────────────┐
│ DIFF: Ingestion #12 → #11                              [✕]  │
├─────────────────────────────────────────────────────────────┤
│ [Unified ▼]  [src/core/client.ts ▼]                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ src/core/client.ts                                          │
│                                                             │
│ 1    import { Config } from './config';                     │
│ 2  + import { WebSocketManager } from '../real-time';       │
│ 3    import { ApiClient } from './api';                     │
│ 4                                                           │
│ 5    export class PanopticonClient {                        │
│ 6  - constructor(config: Config) {                          │
│ 7  + constructor(config: Config, wsEnabled = false) {       │
│ 8      this.config = config;                                │
│ 9  +   if (wsEnabled) {                                     │
│ 10 +     this.ws = new WebSocketManager(config);            │
│ 11 +   }                                                    │
│ 12   }                                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [< Previous File]     3 / 45 files     [Next File >]        │
│                                          [Download Diff]    │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- Modal: 80% viewport width, max 1200px
- Code font: Monospace
- Additions: Green background (#10b98120)
- Deletions: Red background (#ef444420)
- Line numbers: Muted gray, right-aligned
- File header: Bold, slightly lighter background

---

## Definition of Done
- [ ] "View Full Diff" opens diff modal with correct data
- [ ] Unified diff view displays correctly
- [ ] Split diff view displays correctly (toggle works)
- [ ] File selector dropdown navigates between files
- [ ] Previous/Next buttons work
- [ ] Syntax highlighting applied
- [ ] Download Diff creates .patch file
- [ ] Rollback confirmation shows preview
- [ ] Rollback executes and shows success/error
- [ ] "Compare Versions" allows selecting two versions
- [ ] Loading states for diff fetching
- [ ] Error handling for API failures

---

## Deliverables
1. `modals/DiffViewerModal/` - Diff viewer modal and components
2. `modals/RollbackConfirmModal.tsx`
3. `modals/VersionSelectorModal.tsx`
4. `useDiff` and `useRollback` hooks
5. Syntax highlighting utilities
6. Diff download utilities
7. Updated changelog entries with enabled buttons

---

## Dependencies for Next Sprint
Sprint 8 requires:
- All core functionality complete
- Real-time update patterns
- Export utilities
