# Sprint PC5: Real-Time Ingestion Feedback

## Goal
Build the complete real-time ingestion feedback system with WebSocket updates, progress visualization, and meaningful metrics display.

## Prerequisites Completed By This Sprint
- Step 5 (Review & Confirm) UI
- WebSocket-powered real-time progress updates
- 6-phase ingestion progress visualization
- Token metrics and cost savings display
- Completion screen with next steps

## Dependencies From Previous Sprints
- **Sprint PC1**: WebSocket infrastructure, database schema (ingestion_progress table)
- **Sprint PC2-PC4**: Complete project configuration data
- **Sprint PC4**: Advanced settings (affect ingestion behavior)

## Deliverables

### Feature 1: Step 5 - Review & Confirmation Screen
- **Description**: Summary of all project settings before starting ingestion
- **Acceptance Criteria**:
  - [ ] Project Details section: Name, Type, Description, Privacy
  - [ ] Repositories section: List of selected repos with estimates
  - [ ] Team Access section: Member count and roles summary
  - [ ] Advanced Settings section: Chunking strategy, metadata options
  - [ ] Estimated costs: Processing (plan-based), Storage
  - [ ] "Terug" button to return to previous steps
  - [ ] "Aanmaken & starten" button to begin ingestion
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────────────────┐
  │ Projectinstellingen controleren                   │
  ├──────────────────────────────────────────────────┤
  │ 📋 Project Details                                │
  │ ├─ Naam: Product Research Q4                     │
  │ ├─ Type: Repository                              │
  │ └─ Privacy: Private                              │
  │                                                  │
  │ 🔗 Repositories (1 selected)                     │
  │ ├─ github.com/anthropic/anthropic-sdk-python    │
  │ └─ Estimated: 127 files, 185K tokens            │
  │                                                  │
  │ [Terug] [Aanmaken & starten →]                  │
  └──────────────────────────────────────────────────┘
  ```

### Feature 2: Ingestion Progress Container
- **Description**: Main container for displaying real-time ingestion progress
- **Acceptance Criteria**:
  - [ ] Full-screen or modal overlay during ingestion
  - [ ] Header showing project name and status
  - [ ] Phase indicator (current phase highlighted)
  - [ ] Main progress area for current phase details
  - [ ] Metrics sidebar or footer
  - [ ] Cannot be closed during processing (show warning if attempted)
- **Technical Notes**: Consider allowing minimize to background

### Feature 3: Phase 1 - Repository Fetching UI
- **Description**: Display progress during repository cloning
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 1: FETCHING REPOSITORY"
  - [ ] Status items: Authenticating, Cloning, File discovery
  - [ ] Clone progress bar with MB downloaded
  - [ ] ETA display: "~X seconds remaining"
  - [ ] Early stats: Files found, Languages detected, Repository size
  - [ ] Pro tip message during wait
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
  ```

### Feature 4: Phase 2 - Token Analysis UI
- **Description**: Display progress during file parsing
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 2: ANALYZING & PARSING"
  - [ ] Overall progress bar with percentage
  - [ ] Detailed breakdown by file type (Python, YAML, Markdown, etc.)
  - [ ] Extracted entities count (classes, functions)
  - [ ] Real-time metrics: Tokens processed, Reduction so far, Processing speed
  - [ ] Memory-saving insights discovered
- **Technical Notes**:
  ```
  Progress: [████████░░░░░░░░░░] 43%

  Detailed breakdown:
  ├─ Python files: 67/89 analyzed (75%)
  │  └─ Extracted: 156 classes, 487 functions
  ├─ YAML configs: 12/15 scanned
  └─ Markdown docs: 23/23 processed
  ```

### Feature 5: Phase 3 - Semantic Chunking UI
- **Description**: Display progress during intelligent chunking
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 3: SEMANTIC CHUNKING & OPTIMIZATION"
  - [ ] Chunking strategy indicator
  - [ ] Chunk creation breakdown by type (Module, Function, Documentation, Config)
  - [ ] Total chunks count with average size
  - [ ] Optimization actions happening (deduplication, compression)
  - [ ] Quality metrics: Semantic coherence, Context preservation
- **Technical Notes**:
  ```
  Chunking strategy: SEMANTIC (recommended for AI)

  Current chunks created:
  ├─ Module boundaries: 34 chunks (avg 2.8K tokens)
  ├─ Function groupings: 67 chunks (avg 1.2K tokens)
  └─ Documentation sections: 23 chunks (avg 0.8K tokens)
  ```

### Feature 6: Phase 4 - Final Optimization UI
- **Description**: Display progress during final optimization passes
- **Acceptance Criteria**:
  - [ ] Phase header: "PHASE 4: FINAL OPTIMIZATION"
  - [ ] Optimization technique checklist (animated checkmarks)
  - [ ] Real-time token removal counters
  - [ ] Projected final token count
  - [ ] Performance predictions: Query latency, Relevance score
- **Technical Notes**: Show dramatic token reduction visually

### Feature 7: Completion Screen
- **Description**: Success screen with results summary and next steps
- **Acceptance Criteria**:
  - [ ] Success header with celebration
  - [ ] Compression metrics: Original tokens, Optimized tokens, Reduction %
  - [ ] Token savings breakdown (dedup, patterns, compression, etc.)
  - [ ] Context window impact (Claude, GPT-4 comparison)
  - [ ] Cost impact with monthly savings
  - [ ] Performance stats: Ingestion time, Query latency, Relevance
  - [ ] "What you can do now" checklist
  - [ ] CTA buttons: Query, Export, Invite team, Auto-refresh
- **Technical Notes**:
  ```
  🎉 PROJECT INGESTION COMPLETE!

  COMPRESSION METRICS:
  Original tokens:    185,400 tokens
  Optimized tokens:    42,500 tokens
  Reduction:           77.1% ✨

  COST IMPACT:
  Claude 3 Opus: €11.25 → €2.58 (77% cheaper! 💰)
  ```

### Feature 8: WebSocket Event Handlers
- **Description**: Client-side WebSocket handlers for all ingestion events
- **Acceptance Criteria**:
  - [ ] Connect to `/api/projects/:projectId` namespace
  - [ ] Handle `phase_started` event - update phase indicator
  - [ ] Handle `progress_update` event - update progress bars and metrics
  - [ ] Handle `ingestion_complete` event - show completion screen
  - [ ] Handle `error` event - show error recovery options
  - [ ] Reconnection logic on disconnect
  - [ ] Offline indicator if connection lost
- **Technical Notes**:
  ```typescript
  const useIngestionSocket = (projectId: string) => {
    useEffect(() => {
      const socket = io(`/api/projects/${projectId}`);

      socket.on('phase_started', (data: PhaseStartedEvent) => {
        setCurrentPhase(data.phase);
        setPhaseMessage(data.message);
      });

      socket.on('progress_update', (data: ProgressUpdateEvent) => {
        setProgress(data.progressPercent);
        setMetrics(data.metrics);
      });

      // ... cleanup
    }, [projectId]);
  };
  ```

### Feature 9: Server-Side Ingestion Events
- **Description**: Backend emits WebSocket events during ingestion
- **Acceptance Criteria**:
  - [ ] Emit `phase_started` at beginning of each phase
  - [ ] Emit `progress_update` at regular intervals (every 1-2 seconds)
  - [ ] Include relevant metrics in each update
  - [ ] Emit `ingestion_complete` with full results
  - [ ] Emit `error` with recovery options on failure
  - [ ] Update `ingestion_progress` table alongside emissions
- **Technical Notes**: Emit granular updates but not too frequently (avoid flooding)

### Feature 10: Progress Bar Animations
- **Description**: Smooth, engaging progress bar animations
- **Acceptance Criteria**:
  - [ ] Smooth fill animation (CSS transition)
  - [ ] Gradient animation for "processing" state
  - [ ] Color coding: Blue (in progress), Green (complete), Red (error)
  - [ ] Pulse animation for indeterminate states
  - [ ] Number counter animation for metrics
- **Technical Notes**:
  ```css
  .progress-bar {
    transition: width 0.3s ease-out;
    background: linear-gradient(90deg, #2080c7, #0fa589);
    background-size: 200% 100%;
    animation: gradient-shift 2s ease-in-out infinite;
  }
  ```

### Feature 11: Meaningful Insights Generation
- **Description**: Generate and display helpful insights during processing
- **Acceptance Criteria**:
  - [ ] Show insights based on current metrics
  - [ ] Positive insights (token savings, good chunk sizes)
  - [ ] Warning insights (large chunks, potential issues)
  - [ ] Context multiplier insight (how many more repos fit)
  - [ ] Display with appropriate icons (✨, ⚠️, 🚀)
- **Technical Notes**:
  ```typescript
  const generateInsight = (metrics: Metrics, phase: Phase): Insight => {
    if (phase === 'chunking' && metrics.avgChunkSize < 1500) {
      return {
        type: 'positive',
        message: `Perfect chunk size for optimal queries`,
        icon: '✨'
      };
    }
    // ...
  };
  ```

### Feature 12: Ingestion API Endpoint
- **Description**: API endpoint to start project ingestion
- **Acceptance Criteria**:
  - [ ] `POST /api/projects/:id/ingest`
  - [ ] Validates project is in 'draft' status
  - [ ] Updates status to 'processing'
  - [ ] Queues/starts ingestion job
  - [ ] Returns job ID and WebSocket URL
  - [ ] Handles already-processing error
- **Technical Notes**: Consider job queue for scalability (Bull, RabbitMQ)

## Technical Considerations
- WebSocket connections should authenticate using project access tokens
- Consider fallback to polling if WebSocket fails
- Progress updates should be batched server-side to reduce overhead
- Store intermediate progress in database for recovery on reconnect
- Completion results should be cached/stored for later retrieval
- Consider background job processing for scalability

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Step 5 review screen shows all project settings
- [ ] Ingestion starts on button click
- [ ] All 4 phases display with real-time updates
- [ ] Completion screen shows with accurate metrics
- [ ] WebSocket connection stable throughout
- [ ] Error handling working (disconnect, failure scenarios)
- [ ] Performance: Updates render within 100ms
- [ ] Unit tests for WebSocket handlers
- [ ] Integration tests for full ingestion flow

## Notes
- This is the most complex sprint - consider breaking into sub-sprints if needed
- Real ingestion logic (cloning, parsing, chunking) can be mocked initially
- Focus on the UI/UX feedback first, then integrate real processing
- The completion screen is critical for conversion - make it engaging
- Metrics shown should match what's stored in the database
- Consider A/B testing different completion screen layouts
