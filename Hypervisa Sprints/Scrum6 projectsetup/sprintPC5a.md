# Sprint PC5a: Review & Confirmation Screen

## Goal
Build the Step 5 review screen that summarizes all project settings before starting ingestion, plus the API endpoint to trigger ingestion.

## Prerequisites Completed By This Sprint
- Review screen ready for user confirmation
- Ingestion API endpoint available
- Foundation for progress tracking established

## Dependencies From Previous Sprints
- **Sprint PC1**: Database schema (projects, ingestion_progress tables), TypeScript types
- **Sprint PC2**: Project basics data (name, type, description)
- **Sprint PC3**: Repository/file configuration data
- **Sprint PC4**: Advanced settings and team access data

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

### Feature 2: Review Section Components
- **Description**: Reusable section components for displaying settings summaries
- **Acceptance Criteria**:
  - [ ] `ReviewSection` component with collapsible content
  - [ ] `ReviewItem` component for key-value display
  - [ ] `EstimateBadge` component for file/token counts
  - [ ] `CostEstimate` component showing processing and storage costs
  - [ ] Edit button on each section to jump back to that step
- **Technical Notes**:
  ```typescript
  interface ReviewSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    onEdit?: () => void;
  }
  ```

### Feature 3: Ingestion API Endpoint
- **Description**: API endpoint to start project ingestion
- **Acceptance Criteria**:
  - [ ] `POST /api/projects/:id/ingest` endpoint
  - [ ] Validates project is in 'draft' status
  - [ ] Updates project status to 'processing'
  - [ ] Creates initial `ingestion_progress` record
  - [ ] Returns job ID and WebSocket namespace URL
  - [ ] Handles already-processing error (409 Conflict)
  - [ ] Handles project-not-found error (404)
- **Technical Notes**:
  ```typescript
  // Response structure
  interface IngestResponse {
    jobId: string;
    projectId: string;
    status: 'processing';
    websocketUrl: string; // e.g., /api/projects/{id}/progress
    estimatedDuration: number; // seconds
  }
  ```

### Feature 4: Cost Estimation Logic
- **Description**: Calculate and display estimated processing costs
- **Acceptance Criteria**:
  - [ ] Calculate token estimate from repository metadata
  - [ ] Apply plan-based pricing (free tier limits, pro rates)
  - [ ] Show storage cost estimate based on optimized token count
  - [ ] Display monthly recurring cost projection
  - [ ] Show potential savings vs. raw context usage
- **Technical Notes**:
  ```typescript
  interface CostEstimate {
    processingCost: number;      // One-time ingestion cost
    storageCostMonthly: number;  // Monthly storage
    estimatedSavings: number;    // Savings vs. raw tokens
    withinFreeTier: boolean;     // Whether covered by plan
  }
  ```

## Technical Considerations
- Review screen should aggregate data from all previous wizard steps
- Use React Query or similar for data fetching consistency
- API endpoint should be idempotent (repeated calls don't create duplicate jobs)
- Consider optimistic UI updates when clicking "Start"
- Store the review summary in session for recovery on page reload

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Review screen displays all project configuration data
- [ ] Costs are calculated and displayed accurately
- [ ] API endpoint creates ingestion job successfully
- [ ] Error states handled (draft validation, already processing)
- [ ] "Terug" navigation works correctly
- [ ] "Aanmaken & starten" triggers ingestion and transitions to progress view
- [ ] Unit tests for cost calculation logic
- [ ] API endpoint integration test

## Notes
- This is the final wizard step before ingestion begins
- Users should be able to review everything before committing
- The "Aanmaken & starten" button is a critical conversion point
- Consider adding a confirmation dialog for paid tier usage
- Review screen layout should handle varying amounts of data (1 repo vs 50 repos)
