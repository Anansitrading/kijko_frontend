# Sprint 5: Enrichments Tab

## Sprint Goal
Implement the Enrichments tab displaying status dashboards for Knowledge Graph, Language Server Protocol, and ChromaCode enrichment systems with actionable controls.

## Prerequisites (from Sprint 1-4)
- Modal shell with tab navigation
- TypeScript interfaces (EnrichmentStatus)
- Progress bar component
- Status badge component
- Loading/error state patterns

---

## User Stories

### US-5.1: Overall Enrichment Progress
**As a** user
**I want** to see overall enrichment progress
**So that** I can quickly understand the enrichment status

**Acceptance Criteria:**
- [ ] Overall progress percentage displayed prominently
- [ ] Progress bar showing enrichment completion
- [ ] Visual indicator of overall health

### US-5.2: Knowledge Graph Status
**As a** user
**I want** to see Knowledge Graph enrichment details
**So that** I can understand entity/relationship extraction status

**Acceptance Criteria:**
- [ ] Section header "KNOWLEDGE GRAPH (KG)" with icon
- [ ] Status badge: Active (green), Partial (yellow), Inactive (red)
- [ ] Coverage progress bar with percentage
- [ ] Stats: Entities Extracted, Relationships Mapped, Semantic Clusters
- [ ] Top Entities list with reference counts
- [ ] Action buttons: "View Graph", "Rebuild KG"

### US-5.3: LSP Status
**As a** user
**I want** to see Language Server Protocol enrichment details
**So that** I can understand code indexing status

**Acceptance Criteria:**
- [ ] Section header "LANGUAGE SERVER PROTOCOL (LSP)" with icon
- [ ] Status badge showing active state
- [ ] Coverage bar: "X / Y files indexed"
- [ ] Stats: Indexed Files, Symbols Indexed
- [ ] Feature checklist: Go-to-Definition, Auto-completion, Type Inference
- [ ] Language breakdown (pie chart or list)
- [ ] Action buttons: "Re-index", "Configure LSP"

### US-5.4: ChromaCode Status
**As a** user
**I want** to see ChromaCode embedding status
**So that** I can understand vector embedding coverage

**Acceptance Criteria:**
- [ ] Section header "CHROMACODE (CC)" with icon
- [ ] Status badge showing state
- [ ] Coverage bar: "X / Y embeddings generated"
- [ ] Stats: Embeddings Generated, Vector Dimensions
- [ ] Feature checklist: Similarity Index, Semantic Search
- [ ] Configuration info: Model, Chunk Strategy
- [ ] Action buttons: "Generate Embeddings", "Configure CC"

### US-5.5: Run Enrichments
**As a** user
**I want** to trigger enrichment processes
**So that** I can update the enrichment data

**Acceptance Criteria:**
- [ ] "Run All Enrichments" primary button in footer
- [ ] Individual run buttons per enrichment type
- [ ] Progress updates during enrichment runs
- [ ] Success/error feedback

---

## Technical Tasks

### T-5.1: API Endpoints
Implement or mock:

```
GET    /api/context/:id/enrichments         # Enrichment status
POST   /api/context/:id/enrichments/run     # Run all enrichments
POST   /api/context/:id/enrichments/kg      # Rebuild Knowledge Graph
POST   /api/context/:id/enrichments/lsp     # Re-index LSP
POST   /api/context/:id/enrichments/cc      # Generate embeddings
```

### T-5.2: Overall Progress Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/OverallProgress.tsx`:

```typescript
interface OverallProgressProps {
  percentage: number;
}
```

**Layout:**
```
Overall Enrichment: 67.3%
████████████░░░░░░
```

### T-5.3: Status Badge Component
Create `components/common/StatusBadge.tsx`:

```typescript
interface StatusBadgeProps {
  status: 'active' | 'partial' | 'inactive';
  label?: string;
}
```

**Variants:**
- Active: Green background, checkmark icon
- Partial: Yellow background, warning icon
- Inactive: Red background, X icon

### T-5.4: Knowledge Graph Section Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/KnowledgeGraphSection.tsx`:

```typescript
interface KnowledgeGraphSectionProps {
  data: EnrichmentStatus['knowledgeGraph'];
  onViewGraph: () => void;
  onRebuild: () => void;
  isRebuilding: boolean;
}
```

**Layout:**
```
📊 KNOWLEDGE GRAPH (KG)                    ✓ Active
Coverage: 84.2% ████████████████░░░

┌───────────┐ ┌───────────┐ ┌───────────┐
│  1,247    │ │   3,891   │ │    23     │
│ Entities  │ │Relations  │ │ Clusters  │
└───────────┘ └───────────┘ └───────────┘

Top Entities:
• PanopticonClient (326 references)
• MonitoringService (198 references)
• DataProcessor (157 references)

[View Graph]  [Rebuild KG]
```

### T-5.5: LSP Section Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/LSPSection.tsx`:

```typescript
interface LSPSectionProps {
  data: EnrichmentStatus['languageServer'];
  onReindex: () => void;
  onConfigure: () => void;
  isReindexing: boolean;
}
```

**Layout:**
```
🔧 LANGUAGE SERVER PROTOCOL (LSP)          ✓ Active
Coverage: 91.7% ██████████████████░

┌───────────┐ ┌───────────┐
│  776/847  │ │  12,458   │
│  Indexed  │ │  Symbols  │
└───────────┘ └───────────┘

Features:
✓ Go-to-Definition: Enabled
✓ Auto-completion: Enabled
✓ Type Inference: Enabled

Languages:
• TypeScript (68%)
• JavaScript (24%)
• JSON (8%)

[Re-index]  [Configure LSP]
```

### T-5.6: ChromaCode Section Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/ChromaCodeSection.tsx`:

```typescript
interface ChromaCodeSectionProps {
  data: EnrichmentStatus['chromaCode'];
  onGenerate: () => void;
  onConfigure: () => void;
  isGenerating: boolean;
}
```

**Layout:**
```
🎨 CHROMACODE (CC)                         ⚠️ Partial
Coverage: 26.1% █████░░░░░░░░░░░░░

┌───────────┐ ┌───────────┐
│  221/847  │ │   1536    │
│Embeddings │ │Dimensions │
└───────────┘ └───────────┘

Features:
✓ Similarity Index: Built
✓ Semantic Search: Ready

Configuration:
• Model: text-embedding-3-small
• Chunk Strategy: Sliding window (512 tokens)

[Generate Embeddings]  [Configure CC]
```

### T-5.7: Feature Checklist Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/FeatureChecklist.tsx`:

```typescript
interface FeatureChecklistProps {
  features: Array<{
    name: string;
    enabled: boolean;
    status?: string;
  }>;
}
```

### T-5.8: Language Distribution Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/LanguageDistribution.tsx`:

```typescript
interface LanguageDistributionProps {
  languages: Array<{
    name: string;
    percentage: number;
  }>;
}
```

Options: Simple list with percentages or mini pie chart

### T-5.9: Main Enrichments Tab Component
Create `components/ContextDetailInspector/tabs/EnrichmentsTab/index.tsx`:

```typescript
interface EnrichmentsTabProps {
  contextId: string;
}

function EnrichmentsTab({ contextId }: EnrichmentsTabProps) {
  const {
    status,
    isLoading,
    error,
    runAllEnrichments,
    rebuildKG,
    reindexLSP,
    generateEmbeddings,
    operationInProgress
  } = useEnrichments(contextId);

  // Render all sections with dividers
}
```

### T-5.10: Custom Hook for Enrichments
Create `hooks/useEnrichments.ts`:

```typescript
interface UseEnrichmentsReturn {
  status: EnrichmentStatus | null;
  isLoading: boolean;
  error: string | null;
  operationInProgress: 'all' | 'kg' | 'lsp' | 'cc' | null;
  runAllEnrichments: () => Promise<void>;
  rebuildKG: () => Promise<void>;
  reindexLSP: () => Promise<void>;
  generateEmbeddings: () => Promise<void>;
}

function useEnrichments(contextId: string): UseEnrichmentsReturn {
  // Fetch status on mount
  // Provide action handlers
  // Track operation progress
}
```

### T-5.11: Footer Buttons for Enrichments Tab
Update `ModalFooter.tsx`:

```typescript
const enrichmentsFooterButtons = [
  { icon: '⚡', label: 'Run All Enrichments', onClick: handleRunAll, variant: 'primary' },
  { icon: '⚙️', label: 'Configure', onClick: handleConfigure, variant: 'secondary' },
  { icon: '🔄', label: 'Reset Enrichments', onClick: handleReset, variant: 'secondary' },
];
```

### T-5.12: Warning States
Implement warning styling for low coverage:

```typescript
function getCoverageStatus(percentage: number): 'good' | 'warning' | 'critical' {
  if (percentage >= 75) return 'good';
  if (percentage >= 50) return 'warning';
  return 'critical';
}
```

- Good (>= 75%): Green progress bar
- Warning (50-74%): Yellow progress bar
- Critical (< 50%): Red progress bar with warning icon

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
│  Overall Enrichment: 67.3%                                 │
│  ████████████░░░░░░                                        │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  📊 KNOWLEDGE GRAPH (KG)                     ✓ Active      │
│  Coverage: 84.2% ████████████████░░░                       │
│  [Stats] [Top Entities]                                    │
│  [View Graph]  [Rebuild KG]                                │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  🔧 LANGUAGE SERVER PROTOCOL (LSP)           ✓ Active      │
│  Coverage: 91.7% ██████████████████░                       │
│  [Stats] [Features] [Languages]                            │
│  [Re-index]  [Configure LSP]                               │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  🎨 CHROMACODE (CC)                          ⚠️ Partial    │
│  Coverage: 26.1% █████░░░░░░░░░░░░░                        │
│  [Stats] [Features] [Config]                               │
│  [Generate Embeddings]  [Configure CC]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [⚡ Run All Enrichments]  [⚙️ Configure]  [🔄 Reset]       │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- Section headers: Bold, with emoji icons
- Status badges: Rounded, colored backgrounds
- Progress bars: Colored based on percentage
- Stats cards: Subtle background, centered numbers
- Feature checkmarks: Green for enabled
- Dividers between sections

---

## Definition of Done
- [ ] Overall progress bar displays correctly
- [ ] Knowledge Graph section with all stats and actions
- [ ] LSP section with all stats, features, and languages
- [ ] ChromaCode section with all stats and config
- [ ] Status badges show correct state (Active/Partial/Inactive)
- [ ] Warning states for low coverage (< 50%)
- [ ] Action buttons trigger API calls
- [ ] Loading states during operations
- [ ] Progress updates during enrichment runs
- [ ] Error handling with retry options

---

## Deliverables
1. `tabs/EnrichmentsTab/` - All enrichment components
2. `StatusBadge` reusable component
3. `useEnrichments` hook
4. Coverage status utilities
5. Section components (KG, LSP, CC)

---

## Dependencies for Next Sprint
Sprint 6 requires:
- User list component patterns
- Permission dropdown component
- Activity log patterns (similar to changelog)
