# Sprint 3: Compression Tab

## Sprint Goal
Implement the Compression tab displaying compression metrics, ingestion history, and compression algorithm details with actionable controls.

## Prerequisites (from Sprint 1 & 2)
- Modal shell with tab navigation
- TypeScript interfaces (CompressionMetrics)
- State management patterns
- Loading/progress bar components
- API integration patterns

---

## User Stories

### US-3.1: Compression Stats Display
**As a** user
**I want** to see compression statistics
**So that** I understand how much space/cost is being saved

**Acceptance Criteria:**
- [ ] Three stat cards displayed horizontally: Original Size, Compressed, Compression Ratio
- [ ] Each card shows: Large number, unit label, sublabel
- [ ] Visual progress bar showing compression percentage
- [ ] Token savings displayed with estimated cost savings
- [ ] Numbers formatted with commas (2,458,624)

### US-3.2: Ingestion History
**As a** user
**I want** to see the history of code ingestions
**So that** I can track when and what was updated

**Acceptance Criteria:**
- [ ] Section header "INGESTION HISTORY"
- [ ] Summary stats: Total ingestions, Last ingestion, Average interval
- [ ] Scrollable timeline list (last 10 ingestions)
- [ ] Each entry shows: #number, timestamp, files added/removed
- [ ] Color coding: green for added, red for removed

### US-3.3: Compression Settings
**As a** user
**I want** to see and modify compression settings
**So that** I can optimize the compression for my needs

**Acceptance Criteria:**
- [ ] Section displaying compression algorithm info
- [ ] Shows: Method, Preserve options, Optimization level
- [ ] "Re-compress" button triggers new compression
- [ ] "Compression Settings" button opens settings (modal or panel)

---

## Technical Tasks

### T-3.1: API Endpoints
Implement or mock:

```
GET    /api/context/:id/compression    # Compression metrics
POST   /api/context/:id/compress       # Trigger re-compression
```

### T-3.2: Compression Stats Component
Create `components/ContextDetailInspector/tabs/CompressionTab/CompressionStats.tsx`:

```typescript
interface CompressionStatsProps {
  metrics: CompressionMetrics;
}

// Display three cards in a row
// Card 1: Original tokens
// Card 2: Compressed tokens
// Card 3: Compression ratio
```

**Card Design:**
```
┌──────────────────┐
│    2,458,624     │  <- Large, bold number
│      tokens      │  <- Unit label
│  Starting Tokens │  <- Sublabel (secondary color)
└──────────────────┘
```

### T-3.3: Progress Bar Component
Create `components/ContextDetailInspector/tabs/CompressionTab/CompressionProgress.tsx`:

```typescript
interface CompressionProgressProps {
  savingsPercent: number;
  tokensSaved: number;
  costSavings: number;
}
```

**Display:**
```
████████████████████░░░░░░ 94.8% compressed
Token Savings: 2,331,777 tokens
Estimated Cost Savings: $23.32 per 1M queries
```

### T-3.4: Ingestion History Component
Create `components/ContextDetailInspector/tabs/CompressionTab/IngestionHistory.tsx`:

```typescript
interface IngestionHistoryProps {
  totalIngestions: number;
  lastIngestion: Date;
  avgInterval: number;
  history: IngestionEntry[];
}

interface IngestionEntry {
  number: number;
  timestamp: Date;
  filesAdded: number;
  filesRemoved: number;
}
```

**List Item Design:**
```
┌──────────────────────────────────────────────────┐
│ #12  Jan 22, 2026 15:23  +127 files  -3 files   │
└──────────────────────────────────────────────────┘
```

### T-3.5: Compression Algorithm Info Component
Create `components/ContextDetailInspector/tabs/CompressionTab/CompressionDetails.tsx`:

```typescript
interface CompressionDetailsProps {
  method: string;
  preserves: string[];
  optimizationLevel: string;
}
```

**Display:**
```
COMPRESSION ALGORITHM
• Method: Hypervisa Contextual Compression v2.1
• Preserve: Structure, Types, Exports, Documentation
• Optimization Level: High (favor accuracy over compression)
```

### T-3.6: Main Compression Tab Component
Create `components/ContextDetailInspector/tabs/CompressionTab/index.tsx`:

```typescript
interface CompressionTabProps {
  contextId: string;
}

function CompressionTab({ contextId }: CompressionTabProps) {
  const { metrics, history, isLoading, error, recompress } = useCompressionData(contextId);

  // Render all sub-components
}
```

### T-3.7: Custom Hook for Compression Data
Create `hooks/useCompressionData.ts`:

```typescript
interface UseCompressionDataReturn {
  metrics: CompressionMetrics | null;
  history: IngestionEntry[];
  isLoading: boolean;
  error: string | null;
  recompress: () => Promise<void>;
  isRecompressing: boolean;
}

function useCompressionData(contextId: string): UseCompressionDataReturn {
  // Fetch compression data on mount
  // Provide recompress action
}
```

### T-3.8: Footer Buttons for Compression Tab
Update `ModalFooter.tsx`:

```typescript
const compressionFooterButtons = [
  { icon: '⟳', label: 'Re-compress', onClick: handleRecompress, variant: 'primary' },
  { icon: '⬇️', label: 'Download Original', onClick: handleDownload, variant: 'secondary' },
  { icon: '⚙️', label: 'Optimize Settings', onClick: handleSettings, variant: 'secondary' },
];
```

### T-3.9: Re-compress Action Handler
Implement compression trigger:

```typescript
async function handleRecompress(contextId: string) {
  // Show loading state
  // Call POST /api/context/:id/compress
  // Poll for completion or use WebSocket
  // Update metrics on completion
  // Show success/error toast
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
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  2,458,624   │ │   126,847    │ │    19.4x     │        │
│  │    tokens    │ │    tokens    │ │  compression │        │
│  │Starting Token│ │Current Tokens│ │  Space Saved │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ████████████████████░░░░░░ 94.8% compressed               │
│  Token Savings: 2,331,777 tokens                           │
│  Estimated Cost Savings: $23.32 per 1M queries             │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  INGESTION HISTORY                                          │
│  Total Ingestions: 12  │  Last: 2 hours ago  │  Avg: 3.2d  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #12  Jan 22, 2026 15:23   +127 files   -3 files     │   │
│  │ #11  Jan 19, 2026 09:45   +45 files    -1 file      │   │
│  │ #10  Jan 15, 2026 14:12   +89 files    -12 files    │   │
│  │ ...                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  COMPRESSION ALGORITHM                                      │
│  • Method: Hypervisa Contextual Compression v2.1           │
│  • Preserve: Structure, Types, Exports, Documentation      │
│  • Optimization Level: High                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   [⟳ Re-compress]  [⬇️ Download Original]  [⚙️ Settings]    │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- Stat cards: Subtle background (#1a1f26)
- Progress bar fill: Primary blue (#3b82f6)
- Progress bar track: Dark gray (#374151)
- Added files: Green text (#10b981)
- Removed files: Red text (#ef4444)
- Section headers: All caps, secondary color

---

## Definition of Done
- [ ] Three stat cards display correctly with formatted numbers
- [ ] Progress bar animates and shows percentage
- [ ] Token savings and cost savings calculated and displayed
- [ ] Ingestion history list scrollable with proper formatting
- [ ] Compression algorithm details displayed
- [ ] Re-compress button triggers action with loading state
- [ ] Footer buttons functional
- [ ] Loading skeleton during initial fetch
- [ ] Error handling for API failures

---

## Deliverables
1. `tabs/CompressionTab/` - All compression components
2. `useCompressionData` hook
3. API integration for compression endpoints
4. Progress bar with animation
5. Number formatting utilities

---

## Dependencies for Next Sprint
Sprint 4 requires:
- List/timeline component patterns
- Date formatting utilities
- Scrollable container patterns
