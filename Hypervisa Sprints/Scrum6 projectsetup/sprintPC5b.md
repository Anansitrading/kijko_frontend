# Sprint PC5b: Ingestion Progress Container & Phase UIs

## Goal
Build the main progress container and all four phase UIs that display real-time ingestion progress with detailed metrics.

## Prerequisites Completed By This Sprint
- Complete progress visualization UI ready
- All 4 ingestion phases have dedicated displays
- Progress container ready for WebSocket integration

## Dependencies From Previous Sprints
- **Sprint PC5a**: Review screen complete, ingestion API triggers the flow
- **Sprint PC1**: Ingestion progress database schema

## Deliverables

### Feature 1: Ingestion Progress Container
- **Description**: Main container for displaying real-time ingestion progress
- **Acceptance Criteria**:
  - [ ] Full-screen or modal overlay during ingestion
  - [ ] Header showing project name and overall status
  - [ ] Phase indicator showing all 4 phases (current highlighted)
  - [ ] Main content area for current phase details
  - [ ] Metrics sidebar or footer for running totals
  - [ ] Cannot be closed during processing (show warning if attempted)
  - [ ] Minimize button to continue browsing (optional)
- **Technical Notes**:
  ```typescript
  interface IngestionProgressContainerProps {
    projectId: string;
    projectName: string;
    onComplete: (result: IngestionResult) => void;
    onError: (error: IngestionError) => void;
  }

  // Phase indicator states
  type PhaseStatus = 'pending' | 'active' | 'completed' | 'error';
  ```

### Feature 2: Phase Indicator Component
- **Description**: Visual indicator showing progress through all 4 phases
- **Acceptance Criteria**:
  - [ ] Horizontal or vertical layout option
  - [ ] Phase circles/badges with numbers 1-4
  - [ ] Phase labels: Fetching, Analyzing, Chunking, Optimizing
  - [ ] Active phase highlighted with animation
  - [ ] Completed phases show checkmark
  - [ ] Error state shows warning icon
  - [ ] Connecting lines between phases with fill animation
- **Technical Notes**:
  ```
  ○─────●─────○─────○
  1     2     3     4
  Fetch Analyze Chunk Optimize
        ↑ active
  ```

### Feature 3: Phase 1 - Repository Fetching UI
- **Description**: Display progress during repository cloning
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 1: FETCHING REPOSITORY"
  - [ ] Status checklist: Authenticating, Cloning, File discovery
  - [ ] Each status item shows: pending, in-progress (spinner), complete (✓), error (✗)
  - [ ] Clone progress bar with MB downloaded / total MB
  - [ ] ETA display: "~X seconds remaining"
  - [ ] Early stats panel: Files found, Languages detected, Repository size
  - [ ] Pro tip message shown during wait
- **Technical Notes**:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⏳ PHASE 1: FETCHING REPOSITORY
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cloning: github.com/anthropic/anthropic-sdk-python...

  Status:
  ├─ Authenticating: ✓ (2s)
  ├─ Cloning: ⏳ (8/15 MB) 53%
  └─ ETA: ~7 seconds remaining

  Early stats:
  ├─ Files found: 127
  ├─ Languages: Python, YAML, Markdown
  └─ Size: 15 MB

  💡 Pro tip: Your optimized context will load 3x faster than raw files
  ```

### Feature 4: Phase 2 - Token Analysis UI
- **Description**: Display progress during file parsing and analysis
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 2: ANALYZING & PARSING"
  - [ ] Overall progress bar with percentage
  - [ ] Detailed breakdown by file type with individual progress
  - [ ] File types: Python, YAML, Markdown, JSON, etc. (dynamic)
  - [ ] Extracted entities count (classes, functions, modules)
  - [ ] Real-time metrics panel: Tokens processed, Reduction %, Speed (files/sec)
  - [ ] Memory-saving insights discovered (shown as they're found)
- **Technical Notes**:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔍 PHASE 2: ANALYZING & PARSING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Progress: [████████░░░░░░░░░░] 43%

  Detailed breakdown:
  ├─ Python files: 67/89 analyzed (75%)
  │  └─ Extracted: 156 classes, 487 functions
  ├─ YAML configs: 12/15 scanned
  └─ Markdown docs: 23/23 processed ✓

  Metrics:
  ├─ Tokens processed: 98,400
  ├─ Current reduction: 23%
  └─ Speed: 12 files/sec
  ```

### Feature 5: Phase 3 - Semantic Chunking UI
- **Description**: Display progress during intelligent chunking
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 3: SEMANTIC CHUNKING"
  - [ ] Chunking strategy indicator (from advanced settings)
  - [ ] Chunk creation breakdown by type
  - [ ] Types: Module boundaries, Function groupings, Documentation, Config
  - [ ] Each type shows: count, average token size
  - [ ] Total chunks counter with running average
  - [ ] Optimization actions happening: deduplication, compression
  - [ ] Quality metrics: Semantic coherence score, Context preservation %
- **Technical Notes**:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✂️ PHASE 3: SEMANTIC CHUNKING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Strategy: SEMANTIC (recommended for AI)

  Chunks created:
  ├─ Module boundaries: 34 chunks (avg 2.8K tokens)
  ├─ Function groupings: 67 chunks (avg 1.2K tokens)
  ├─ Documentation: 23 chunks (avg 0.8K tokens)
  └─ Config files: 8 chunks (avg 0.4K tokens)

  Total: 132 chunks | Avg size: 1.4K tokens

  Quality:
  ├─ Semantic coherence: 94%
  └─ Context preserved: 98%
  ```

### Feature 6: Phase 4 - Final Optimization UI
- **Description**: Display progress during final optimization passes
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 4: FINAL OPTIMIZATION"
  - [ ] Optimization technique checklist with animated checkmarks
  - [ ] Techniques: Deduplication, Pattern compression, Whitespace, Imports
  - [ ] Real-time token removal counters per technique
  - [ ] Dramatic visual showing tokens removed
  - [ ] Projected final token count (updating live)
  - [ ] Performance predictions: Query latency estimate, Relevance score
- **Technical Notes**:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ PHASE 4: FINAL OPTIMIZATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Optimizations:
  ├─ ✓ Deduplication: -12,400 tokens
  ├─ ✓ Pattern compression: -8,200 tokens
  ├─ ⏳ Whitespace normalization: -2,100 tokens
  └─ ○ Import consolidation: pending

  Token reduction:
  185,400 → 42,500 tokens (-77%)
  ████████████████████░░░░░░░░░░

  Predicted performance:
  ├─ Query latency: <200ms
  └─ Relevance score: 96%
  ```

### Feature 7: Metrics Sidebar/Footer
- **Description**: Persistent metrics display during ingestion
- **Acceptance Criteria**:
  - [ ] Always visible regardless of current phase
  - [ ] Shows: Original tokens, Current tokens, Reduction %
  - [ ] Time elapsed counter
  - [ ] Estimated time remaining
  - [ ] Files processed / total
  - [ ] Current phase name
- **Technical Notes**: Use compact layout for sidebar, expanded for footer

## Technical Considerations
- All phase components should accept mock data for testing
- Phase transitions should be smooth (CSS transitions)
- Consider skeleton loading states for metrics that haven't arrived yet
- Progress percentages should never go backwards (cache highest value)
- Implement proper cleanup when component unmounts mid-ingestion
- Use CSS Grid or Flexbox for responsive layouts

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Progress container prevents accidental close
- [ ] Phase indicator accurately reflects current state
- [ ] All 4 phase UIs display correctly with mock data
- [ ] Smooth transitions between phases
- [ ] Metrics sidebar updates in real-time
- [ ] Responsive design for different screen sizes
- [ ] Unit tests for all phase components
- [ ] Storybook stories for each phase UI (if using Storybook)

## Notes
- This sprint focuses on UI only - WebSocket integration is in PC5c
- Use mock data generators for development and testing
- Consider adding screenshot/recording capability for user documentation
- Phase timing varies significantly - fetch can be 2s or 60s depending on repo size
- The visual drama of token reduction is key to perceived value
