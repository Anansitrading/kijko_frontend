# Sprint 4: Changelog Tab (Basic)

## Sprint Goal
Implement the basic Changelog tab displaying version history with a timeline of ingestions, enrichments, and configuration changes.

## Prerequisites (from Sprint 1-3)
- Modal shell with tab navigation
- TypeScript interfaces (ChangelogEntry, UserAccess)
- List/timeline component patterns
- Date formatting utilities
- Scrollable container patterns

---

## User Stories

### US-4.1: Changelog Timeline
**As a** user
**I want** to see a history of all changes to this context
**So that** I can track what has changed over time

**Acceptance Criteria:**
- [ ] Scrollable timeline of changelog entries
- [ ] Different entry types: Ingestion, Enrichment, Config, Access
- [ ] Each entry has icon, type label, timestamp, author
- [ ] Ingestion entries show files added/removed/modified counts
- [ ] Color coding for different entry types

### US-4.2: Ingestion Entry Details
**As a** user
**I want** to see details of each ingestion
**So that** I can understand what files were changed

**Acceptance Criteria:**
- [ ] Expandable file lists for added/removed/modified
- [ ] Added files: Green (+) prefix
- [ ] Removed files: Red (-) prefix
- [ ] Modified files: Yellow (~) prefix with line changes
- [ ] Truncated lists with "... and X more files"
- [ ] Action buttons: "View Full Diff", "Rollback to #X"

### US-4.3: Changelog Filtering
**As a** user
**I want** to filter the changelog
**So that** I can find specific types of changes

**Acceptance Criteria:**
- [ ] Filter by type: All Changes, Ingestions, Enrichments, Config
- [ ] Filter by time: Last 7 days, 30 days, 90 days, All time
- [ ] Export button for CSV/JSON export

---

## Technical Tasks

### T-4.1: API Endpoints
Implement or mock:

```
GET    /api/context/:id/changelog              # Changelog entries
GET    /api/context/:id/changelog/:number/diff # Get diff (Sprint 7)
POST   /api/context/:id/rollback/:number       # Rollback (Sprint 7)
```

### T-4.2: Changelog Entry Component
Create `components/ContextDetailInspector/tabs/ChangelogTab/ChangelogEntry.tsx`:

```typescript
interface ChangelogEntryProps {
  entry: ChangelogEntry;
  onViewDiff: (entryId: string) => void;
  onRollback: (entryNumber: number) => void;
}
```

**Entry Type Icons:**
- ⬆️ INGESTION - New code version
- 🔧 ENRICHMENT UPDATE - KG/LSP/CC updates
- ⚙️ CONFIGURATION - Settings changes
- 🔐 ACCESS CHANGE - Permission updates

### T-4.3: Ingestion Entry Component
Create `components/ContextDetailInspector/tabs/ChangelogTab/IngestionEntry.tsx`:

```typescript
interface IngestionEntryProps {
  entry: ChangelogEntry;
  onViewDiff: () => void;
  onRollback: () => void;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ ⬆️ INGESTION #12                                  │
│ Jan 22, 2026 15:23  •  by You                    │
│                                                  │
│ +127 files added  │  -3 files removed  │  ~45 mod│
│                                                  │
│ Added:                                           │
│ + src/features/real-time/websocket.ts            │
│ + src/features/real-time/events.ts               │
│ + ... and 124 more files                         │
│                                                  │
│ Removed:                                         │
│ - src/legacy/old-client.ts                       │
│ - ... and 1 more file                            │
│                                                  │
│ Modified:                                        │
│ ~ src/core/client.ts (+234, -89 lines)          │
│ ~ ... and 43 more files                          │
│                                                  │
│ [View Full Diff]  [Rollback to #11]             │
└──────────────────────────────────────────────────┘
```

### T-4.4: File List Component
Create `components/ContextDetailInspector/tabs/ChangelogTab/FileList.tsx`:

```typescript
interface FileListProps {
  type: 'added' | 'removed' | 'modified';
  files: string[] | ModifiedFile[];
  maxVisible?: number; // Default 3
}

interface ModifiedFile {
  path: string;
  linesAdded: number;
  linesRemoved: number;
}
```

**Styling:**
- Added: Green text, + prefix
- Removed: Red text, - prefix
- Modified: Yellow/orange text, ~ prefix

### T-4.5: Enrichment Entry Component
Create `components/ContextDetailInspector/tabs/ChangelogTab/EnrichmentEntry.tsx`:

```typescript
interface EnrichmentEntryProps {
  entry: ChangelogEntry;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 🔧 ENRICHMENT UPDATE                              │
│ Jan 18, 2026 14:22  •  System                    │
│                                                  │
│ Knowledge Graph rebuilt                          │
│ +156 new entities  │  +423 new relationships     │
└──────────────────────────────────────────────────┘
```

### T-4.6: Changelog Filter Toolbar
Create `components/ContextDetailInspector/tabs/ChangelogTab/FilterToolbar.tsx`:

```typescript
interface FilterToolbarProps {
  typeFilter: ChangelogType | 'all';
  timeFilter: TimeRange;
  onTypeChange: (type: ChangelogType | 'all') => void;
  onTimeChange: (range: TimeRange) => void;
  onExport: () => void;
}

type ChangelogType = 'ingestion' | 'enrichment' | 'config' | 'access';
type TimeRange = '7d' | '30d' | '90d' | 'all';
```

### T-4.7: Main Changelog Tab Component
Create `components/ContextDetailInspector/tabs/ChangelogTab/index.tsx`:

```typescript
interface ChangelogTabProps {
  contextId: string;
}

function ChangelogTab({ contextId }: ChangelogTabProps) {
  const [typeFilter, setTypeFilter] = useState<ChangelogType | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeRange>('30d');

  const { entries, isLoading, error, loadMore, hasMore } = useChangelog(
    contextId,
    { type: typeFilter, time: timeFilter }
  );

  // Render filter toolbar and entry list
}
```

### T-4.8: Custom Hook for Changelog Data
Create `hooks/useChangelog.ts`:

```typescript
interface UseChangelogOptions {
  type?: ChangelogType | 'all';
  time?: TimeRange;
  limit?: number;
}

interface UseChangelogReturn {
  entries: ChangelogEntry[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
}

function useChangelog(
  contextId: string,
  options: UseChangelogOptions
): UseChangelogReturn {
  // Fetch with pagination
  // Filter client-side or server-side
}
```

### T-4.9: Footer Buttons for Changelog Tab
Update `ModalFooter.tsx`:

```typescript
const changelogFooterButtons = [
  { icon: '📥', label: 'New Ingestion', onClick: handleNewIngestion, variant: 'primary' },
  { icon: '⬇️', label: 'Export Changelog', onClick: handleExport, variant: 'secondary' },
  { icon: '🔄', label: 'Compare Versions', onClick: handleCompare, variant: 'secondary', disabled: true }, // Sprint 7
];
```

### T-4.10: Export Functionality
Implement changelog export:

```typescript
function exportChangelog(entries: ChangelogEntry[], format: 'csv' | 'json') {
  // Format entries
  // Trigger download
}
```

---

## UI Specifications

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Context Name                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Compression] [Enrichments] [Users] [Changelog]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [All Changes ▼]  [Last 30 days ▼]              [Export]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⬆️ INGESTION #12                                     │   │
│  │ Jan 22, 2026 15:23  •  by You                       │   │
│  │                                                      │   │
│  │ +127 added  │  -3 removed  │  ~45 modified          │   │
│  │                                                      │   │
│  │ Added:                                              │   │
│  │ + src/features/real-time/websocket.ts               │   │
│  │ + ... and 124 more files                            │   │
│  │                                                      │   │
│  │ [View Full Diff]  [Rollback to #11]                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⬆️ INGESTION #11                                     │   │
│  │ Jan 19, 2026 09:45  •  by Sarah Chen               │   │
│  │                                                      │   │
│  │ +45 added  │  -1 removed  │  ~12 modified           │   │
│  │                                                      │   │
│  │ [View Full Diff]  [Rollback to #10]                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🔧 ENRICHMENT UPDATE                                 │   │
│  │ Jan 18, 2026 14:22  •  System                       │   │
│  │                                                      │   │
│  │ Knowledge Graph rebuilt                             │   │
│  │ +156 entities  │  +423 relationships                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [📥 New Ingestion]  [⬇️ Export]  [🔄 Compare Versions]     │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- Entry cards: Subtle border, slight background
- Type badges: Colored based on type
- File paths: Monospace font
- Added: #10b981 (green)
- Removed: #ef4444 (red)
- Modified: #f59e0b (yellow/orange)
- Action buttons: Small, text-style

---

## Definition of Done
- [ ] Timeline displays changelog entries correctly
- [ ] Different entry types render with correct icons/styling
- [ ] Ingestion entries show file counts and expandable lists
- [ ] File lists truncate with "... and X more"
- [ ] Type filter works (All, Ingestions, Enrichments, etc.)
- [ ] Time filter works (7d, 30d, 90d, All)
- [ ] Export functionality downloads JSON/CSV
- [ ] Loading state while fetching
- [ ] Empty state when no entries
- [ ] "View Full Diff" and "Rollback" buttons visible (disabled until Sprint 7)

---

## Deliverables
1. `tabs/ChangelogTab/` - All changelog components
2. `useChangelog` hook with filtering
3. Export utility functions
4. Entry type components (Ingestion, Enrichment, Config, Access)

---

## Dependencies for Next Sprint
Sprint 5 requires:
- Progress bar component (from Sprint 3)
- Section layout patterns
- Status badge component
