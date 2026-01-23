# Sprint 8: Polish & Advanced Features

## Sprint Goal
Implement real-time updates, advanced search/filtering, export functionality, and final polish for production readiness.

## Prerequisites (from Sprint 1-7)
- All tabs fully functional
- Diff viewer and rollback working
- All API integrations complete
- Core UI components in place

---

## User Stories

### US-8.1: Real-time Updates
**As a** user
**I want** to see live updates when others make changes
**So that** I have current information without refreshing

**Acceptance Criteria:**
- [ ] Activity log updates in real-time
- [ ] User "last active" updates live
- [ ] Enrichment progress shows real-time progress
- [ ] New ingestions appear automatically
- [ ] Visual indicator when new data arrives

### US-8.2: Global Search
**As a** user
**I want** to search within the modal
**So that** I can quickly find information

**Acceptance Criteria:**
- [ ] Cmd/Ctrl + K focuses search
- [ ] Search across users, activity, changelog
- [ ] Results categorized by section
- [ ] Keyboard navigation in results

### US-8.3: Export Functionality
**As a** user
**I want** to export data from various tabs
**So that** I can use it externally

**Acceptance Criteria:**
- [ ] Export Context Info (JSON) from Overview
- [ ] Export Activity Log (CSV/JSON) from Users
- [ ] Export Changelog (CSV/JSON) from Changelog
- [ ] Download Original files from Compression

### US-8.4: View Knowledge Graph
**As a** user
**I want** to visualize the knowledge graph
**So that** I can understand entity relationships

**Acceptance Criteria:**
- [ ] "View Graph" button opens KG visualization
- [ ] Interactive graph with zoom/pan
- [ ] Click nodes to see details
- [ ] Filter by entity type

### US-8.5: Settings Modals
**As a** user
**I want** to configure enrichment and compression settings
**So that** I can customize behavior

**Acceptance Criteria:**
- [ ] Compression Settings modal
- [ ] LSP Configuration modal
- [ ] ChromaCode Configuration modal
- [ ] Changes save and apply

---

## Technical Tasks

### T-8.1: WebSocket Integration
Implement real-time updates:

```typescript
// services/websocket.ts
interface WebSocketService {
  connect(contextId: string): void;
  disconnect(): void;
  subscribe(event: string, callback: (data: any) => void): void;
  unsubscribe(event: string): void;
}

// Events to subscribe to:
// - 'activity:new' - New activity event
// - 'user:status' - User online/offline
// - 'enrichment:progress' - Enrichment progress update
// - 'ingestion:complete' - New ingestion finished
```

### T-8.2: Real-time Context Provider
Create context for real-time data:

```typescript
// contexts/RealtimeContext.tsx
interface RealtimeState {
  connected: boolean;
  lastUpdate: Date | null;
  pendingUpdates: number;
}

function RealtimeProvider({ children, contextId }) {
  // Connect WebSocket on mount
  // Dispatch updates to relevant state
  // Show connection status indicator
}
```

### T-8.3: Update Indicator Component
Create visual indicator for new updates:

```typescript
// components/common/UpdateIndicator.tsx
interface UpdateIndicatorProps {
  count: number;
  onClick: () => void;
}
```

Shows: "3 new updates" with click to refresh/scroll

### T-8.4: Global Search Modal
Create `components/ContextDetailInspector/modals/SearchModal.tsx`:

```typescript
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  onResultSelect: (result: SearchResult) => void;
}

interface SearchResult {
  type: 'user' | 'activity' | 'changelog' | 'file';
  id: string;
  title: string;
  subtitle: string;
  tab: TabType;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 🔍 Search...                                [✕]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Users                                            │
│ ├─ 👤 Sarah Chen - sarah@kijko.ai              │
│                                                  │
│ Activity                                         │
│ ├─ 👁️ Sarah viewed auth/oauth.ts               │
│                                                  │
│ Changelog                                        │
│ ├─ ⬆️ Ingestion #12 - websocket changes         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### T-8.5: Export Service
Create export utilities:

```typescript
// services/export.ts

// Context info export
function exportContextInfo(context: ContextItem, summary: ContextSummary): void {
  const data = {
    context,
    summary,
    exportedAt: new Date().toISOString(),
  };
  downloadJSON(data, `${context.name}-info.json`);
}

// Activity log export
function exportActivityLog(events: ActivityEvent[], format: 'csv' | 'json'): void {
  if (format === 'csv') {
    const csv = convertToCSV(events, ['timestamp', 'type', 'user', 'description']);
    downloadCSV(csv, 'activity-log.csv');
  } else {
    downloadJSON(events, 'activity-log.json');
  }
}

// Changelog export
function exportChangelog(entries: ChangelogEntry[], format: 'csv' | 'json'): void {
  // Similar to activity log
}

// Utility functions
function downloadJSON(data: any, filename: string): void;
function downloadCSV(csv: string, filename: string): void;
function convertToCSV(data: any[], columns: string[]): string;
```

### T-8.6: Knowledge Graph Viewer Modal
Create `components/ContextDetailInspector/modals/KnowledgeGraphModal.tsx`:

```typescript
interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
}

// Use a graph visualization library like:
// - react-force-graph
// - vis-network
// - d3-force
```

**Features:**
- Force-directed graph layout
- Node colors by entity type
- Click node to see details panel
- Zoom/pan controls
- Filter dropdown by entity type

### T-8.7: Compression Settings Modal
Create `components/ContextDetailInspector/modals/CompressionSettingsModal.tsx`:

```typescript
interface CompressionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: CompressionSettings) => void;
  currentSettings: CompressionSettings;
}

interface CompressionSettings {
  method: 'hypervisa' | 'standard';
  preserveStructure: boolean;
  preserveTypes: boolean;
  preserveExports: boolean;
  preserveDocs: boolean;
  optimizationLevel: 'low' | 'medium' | 'high';
}
```

### T-8.8: LSP Configuration Modal
Create `components/ContextDetailInspector/modals/LSPConfigModal.tsx`:

```typescript
interface LSPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: LSPConfig) => void;
  currentConfig: LSPConfig;
}

interface LSPConfig {
  enableGoToDefinition: boolean;
  enableAutoCompletion: boolean;
  enableTypeInference: boolean;
  excludePatterns: string[];
  maxFileSize: number;
}
```

### T-8.9: ChromaCode Configuration Modal
Create `components/ContextDetailInspector/modals/ChromaCodeConfigModal.tsx`:

```typescript
interface ChromaCodeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ChromaCodeConfig) => void;
  currentConfig: ChromaCodeConfig;
}

interface ChromaCodeConfig {
  embeddingModel: 'text-embedding-3-small' | 'text-embedding-3-large';
  chunkStrategy: 'sliding' | 'semantic' | 'paragraph';
  chunkSize: number;
  overlap: number;
  excludePatterns: string[];
}
```

### T-8.10: Download Original Files
Implement original file download:

```typescript
// services/download.ts
async function downloadOriginalFiles(contextId: string): Promise<void> {
  // Request download from API
  // API returns zip file or download URL
  // Trigger browser download
}
```

### T-8.11: Keyboard Shortcut Handler
Enhance keyboard shortcuts:

```typescript
// hooks/useKeyboardShortcuts.ts
function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      }
      if (isMod && e.key === 'w') {
        e.preventDefault();
        handlers.onClose?.();
      }
      if (isMod && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        handlers.onTabSwitch?.(parseInt(e.key) - 1);
      }
      if (e.key === 'Escape') {
        handlers.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

### T-8.12: Loading & Animation Polish
Add finishing touches:

```typescript
// Skeleton loaders for each tab
// Smooth transitions between states
// Progress animations
// Hover effects
// Focus states for accessibility
```

### T-8.13: Error Boundary
Add error handling at modal level:

```typescript
// components/ContextDetailInspector/ErrorBoundary.tsx
class ModalErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ModalErrorState error={this.state.error} onRetry={...} />;
    }
    return this.props.children;
  }
}
```

### T-8.14: Accessibility Audit
Ensure accessibility compliance:

- [ ] All interactive elements focusable
- [ ] Proper ARIA labels
- [ ] Keyboard navigation throughout
- [ ] Screen reader announcements for updates
- [ ] Focus trap in modals
- [ ] Color contrast meets WCAG AA

### T-8.15: Performance Optimization
Optimize for performance:

```typescript
// Memoize expensive computations
// Virtualize long lists (react-window)
// Lazy load tab content
// Debounce search input
// Cancel pending requests on unmount
```

---

## UI Specifications

### Search Modal
```
┌──────────────────────────────────────────────────┐
│ [🔍                                        ] [✕] │
├──────────────────────────────────────────────────┤
│                                                  │
│ Results for "sarah"                              │
│                                                  │
│ USERS                                            │
│ ┌────────────────────────────────────────────┐  │
│ │ 👤 Sarah Chen                              │◄─│ Highlighted
│ │    sarah@kijko.ai • Admin                  │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ACTIVITY                                         │
│ ┌────────────────────────────────────────────┐  │
│ │ 💬 Sarah Chen asked about authentication   │  │
│ │    2 hours ago                             │  │
│ └────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────┐  │
│ │ 👁️ Sarah Chen viewed /auth/oauth.ts       │  │
│ │    2 hours ago                             │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ Press ↑↓ to navigate, Enter to select, Esc close│
└──────────────────────────────────────────────────┘
```

### Connection Status
```
● Connected (green dot, subtle)
○ Connecting... (yellow dot, pulsing)
● Disconnected (red dot)
```

---

## Definition of Done
- [ ] Real-time updates work via WebSocket
- [ ] Global search (Cmd/Ctrl+K) functional
- [ ] All export functions work (JSON/CSV)
- [ ] Knowledge Graph visualization displays
- [ ] Settings modals save and apply changes
- [ ] Download Original files works
- [ ] All keyboard shortcuts functional
- [ ] Accessibility audit passed
- [ ] Performance optimized (no jank)
- [ ] Error boundaries in place
- [ ] Loading states polished
- [ ] Animations smooth

---

## Deliverables
1. WebSocket service and real-time context
2. Search modal with results
3. Export utilities for all data types
4. Knowledge Graph visualization modal
5. Settings modals (Compression, LSP, ChromaCode)
6. Keyboard shortcut system
7. Performance optimizations
8. Accessibility improvements
9. Error boundaries and graceful degradation

---

## Final Checklist

### Functional Requirements
- [ ] Modal opens/closes correctly
- [ ] All 5 tabs fully functional
- [ ] Chat works with persistence
- [ ] Compression stats display
- [ ] Enrichment status and controls
- [ ] User management complete
- [ ] Changelog with diff viewer
- [ ] Rollback functionality
- [ ] Real-time updates
- [ ] Search functionality
- [ ] Export functionality
- [ ] Settings configuration

### Non-Functional Requirements
- [ ] Performance: Modal loads < 500ms
- [ ] Responsive: Works on mobile/tablet
- [ ] Accessible: WCAG AA compliant
- [ ] Error handling: Graceful degradation
- [ ] Offline: Shows cached data when disconnected

### Documentation
- [ ] Component API documentation
- [ ] State management documentation
- [ ] API endpoint documentation
- [ ] Keyboard shortcut reference
