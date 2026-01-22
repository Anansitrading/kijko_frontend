# Sprint 1: Foundation - Modal Structure & Core Infrastructure

## Sprint Goal
Establish the foundational architecture for the Context Detail Inspector modal, including the modal shell, tab navigation system, TypeScript interfaces, and base styling.

## Prerequisites
- Existing KIJKO interface codebase
- React/TypeScript environment configured
- Tailwind CSS or styled-components setup

---

## User Stories

### US-1.1: Modal Shell
**As a** user
**I want** to click on a context item and see a modal open
**So that** I can view detailed information about that context

**Acceptance Criteria:**
- [ ] Modal opens on context item click
- [ ] Modal is 900px wide, 700px tall, centered on screen
- [ ] Dark theme consistent with KIJKO interface (#0f1419 background)
- [ ] Header displays context name + close button (X)
- [ ] Modal closes on ESC key press
- [ ] Modal closes on click outside
- [ ] Smooth open/close animations (scale + fade)

### US-1.2: Tab Navigation
**As a** user
**I want** to navigate between different sections of context information
**So that** I can access the specific information I need

**Acceptance Criteria:**
- [ ] 5 horizontal tabs below header: Overview & Chat, Compression, Enrichments, Users, Changelog
- [ ] Active tab clearly indicated with visual styling
- [ ] Smooth tab switching animation (fade in/out)
- [ ] Keyboard shortcuts: Cmd/Ctrl + 1-5 for tab switching
- [ ] Tab state persists while modal is open

### US-1.3: Footer Component
**As a** user
**I want** context-aware action buttons at the bottom of the modal
**So that** I can perform relevant actions for each tab

**Acceptance Criteria:**
- [ ] Footer displays different buttons based on active tab
- [ ] Buttons follow KIJKO styling (36px height, 6px border-radius)
- [ ] Primary buttons use blue accent (#3b82f6)
- [ ] Secondary buttons have subtle styling

---

## Technical Tasks

### T-1.1: TypeScript Interfaces
Create all core interfaces in `types/contextInspector.ts`:

```typescript
// Core modal state
interface ContextDetailModal {
  isOpen: boolean;
  contextItem: ContextItem;
  activeTab: 'overview' | 'compression' | 'enrichments' | 'users' | 'changelog';
}

// Context item data
interface ContextItem {
  id: string;
  name: string;
  type: 'package' | 'repo' | 'files';
  size: number;
  fileCount: number;
  lastUpdated: Date;
  status: 'cached' | 'expired' | 'pending';
}

// Chat message
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Compression metrics
interface CompressionMetrics {
  originalTokens: number;
  compressedTokens: number;
  ratio: number;
  savingsPercent: number;
  costSavings: number;
  totalIngestions: number;
  lastIngestion: Date;
  avgInterval: number;
}

// Enrichment status
interface EnrichmentStatus {
  overall: number;
  knowledgeGraph: {
    active: boolean;
    coverage: number;
    entities: number;
    relationships: number;
    clusters: number;
    topEntities: Array<{name: string; references: number}>;
  };
  languageServer: {
    active: boolean;
    coverage: number;
    indexedFiles: number;
    totalFiles: number;
    symbols: number;
    languages: Array<{name: string; percentage: number}>;
  };
  chromaCode: {
    active: boolean;
    coverage: number;
    embeddings: number;
    totalFiles: number;
    dimensions: number;
    model: string;
    chunkStrategy: string;
  };
}

// User access
interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  lastActive: Date;
  avatar?: string;
}

// Activity event
interface ActivityEvent {
  id: string;
  type: 'view' | 'chat' | 'ingestion' | 'permission' | 'config';
  user: UserAccess;
  description: string;
  timestamp: Date;
  metadata?: any;
}

// Changelog entry
interface ChangelogEntry {
  id: string;
  type: 'ingestion' | 'enrichment' | 'config' | 'access';
  number?: number;
  timestamp: Date;
  author: UserAccess | 'System';
  filesAdded?: number;
  filesRemoved?: number;
  filesModified?: number;
  addedFiles?: string[];
  removedFiles?: string[];
  modifiedFiles?: Array<{path: string; linesAdded: number; linesRemoved: number}>;
  description?: string;
}
```

### T-1.2: Modal Component Structure
Create component hierarchy:
```
components/
  ContextDetailInspector/
    index.tsx                 # Main modal component
    ModalHeader.tsx           # Header with title + close
    TabNavigation.tsx         # Tab bar component
    ModalFooter.tsx           # Context-aware footer
    tabs/
      OverviewTab.tsx         # Placeholder
      CompressionTab.tsx      # Placeholder
      EnrichmentsTab.tsx      # Placeholder
      UsersTab.tsx            # Placeholder
      ChangelogTab.tsx        # Placeholder
    hooks/
      useModalKeyboard.ts     # Keyboard shortcuts
      useClickOutside.ts      # Click outside detection
```

### T-1.3: Base Styling Constants
Create design tokens in `styles/contextInspector.ts`:

```typescript
export const colors = {
  background: '#0f1419',
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  border: 'rgba(255,255,255,0.1)',
};

export const spacing = {
  xs: '12px',
  sm: '16px',
  md: '24px',
};

export const borderRadius = {
  card: '8px',
  button: '6px',
  input: '4px',
};

export const typography = {
  headerSize: '16-20px',
  bodySize: '14px',
  smallSize: '12px',
  fontMono: "'Monaco', 'Courier New', monospace",
};
```

### T-1.4: State Management Setup
Create modal state context/store:

```typescript
// contexts/ContextInspectorContext.tsx
interface ContextInspectorState {
  isOpen: boolean;
  contextItem: ContextItem | null;
  activeTab: TabType;
  isLoading: boolean;
}

type ContextInspectorAction =
  | { type: 'OPEN_MODAL'; payload: ContextItem }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'SET_LOADING'; payload: boolean };
```

### T-1.5: Loading & Error State Components
Create reusable UI components:
- `SkeletonLoader.tsx` - For initial data load
- `SpinnerButton.tsx` - Button with loading state
- `ProgressBar.tsx` - For progress visualization
- `ErrorToast.tsx` - Toast notification component
- `EmptyState.tsx` - Empty state with CTA

---

## Definition of Done
- [ ] All TypeScript interfaces defined and exported
- [ ] Modal opens/closes correctly with animations
- [ ] Tab navigation works with keyboard shortcuts
- [ ] Footer renders different buttons per tab (placeholders)
- [ ] Loading/error/empty state components created
- [ ] Unit tests for modal open/close logic
- [ ] Responsive behavior verified (modal adapts on smaller screens)

---

## Deliverables
1. `types/contextInspector.ts` - All interfaces
2. `components/ContextDetailInspector/` - Component structure
3. `styles/contextInspector.ts` - Design tokens
4. `contexts/ContextInspectorContext.tsx` - State management
5. Base UI components (skeleton, spinner, progress, toast, empty)

---

## Dependencies for Next Sprint
Sprint 2 requires:
- Working modal shell
- Tab navigation system
- State management context
- Loading/error components
