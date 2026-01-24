# Sprint PC6: Persona Routing, Error Handling & Conversion

## Goal
Implement intelligent persona detection with flow routing, graceful error handling with recovery options, and persona-specific conversion CTAs.

## Prerequisites Completed By This Sprint
- Persona detection and scoring algorithm
- Dynamic flow routing based on persona
- Graceful error handling with recovery options
- Retry logic with exponential backoff
- Persona-specific completion CTAs
- Analytics tracking for funnel optimization

## Dependencies From Previous Sprints
- **Sprint PC1**: Database schema, TypeScript types
- **Sprint PC2-PC4**: All wizard steps built
- **Sprint PC5**: Ingestion feedback and completion screen

## Deliverables

### Feature 1: Persona Detection Algorithm
- **Description**: Analyze user behavior signals to determine persona type
- **Acceptance Criteria**:
  - [ ] Score calculation for Alex, Maya, Sam personas
  - [ ] Alex signals: Team size = 1, lightweight tools, cost-focused
  - [ ] Maya signals: Team size > 50, security docs, compliance questions
  - [ ] Sam signals: Frequent API use, reads documentation, community participation
  - [ ] Returns highest-scoring persona
  - [ ] Fallback to 'alex' if no clear signals
  - [ ] Caches persona result per session
- **Technical Notes**:
  ```typescript
  interface PersonaSignals {
    teamSize: number;
    usesLightweightTools: boolean;
    focusOnCost: boolean;
    downloadsSecurityDocs: boolean;
    asksAboutCompliance: boolean;
    usesAPIFrequently: boolean;
    readsDocumentation: boolean;
    participatesInCommunity: boolean;
  }

  const detectPersona = (signals: PersonaSignals): PersonaType => {
    let alexScore = 0, mayaScore = 0, samScore = 0;

    if (signals.teamSize === 1) alexScore += 30;
    if (signals.usesLightweightTools) alexScore += 20;
    if (signals.focusOnCost) alexScore += 25;

    if (signals.teamSize > 50) mayaScore += 40;
    if (signals.downloadsSecurityDocs) mayaScore += 30;
    if (signals.asksAboutCompliance) mayaScore += 25;

    if (signals.usesAPIFrequently) samScore += 35;
    if (signals.readsDocumentation) samScore += 20;
    if (signals.participatesInCommunity) samScore += 25;

    // Return highest scoring persona
    return getHighestScoring([
      { type: 'alex', score: alexScore },
      { type: 'maya', score: mayaScore },
      { type: 'sam', score: samScore }
    ]);
  };
  ```

### Feature 2: Flow Configuration by Persona
- **Description**: Define which steps each persona sees
- **Acceptance Criteria**:
  - [ ] Alex flow: Steps 1 → 2A → 5 (skip 3, 4)
  - [ ] Maya flow: Steps 1 → 2B → 3 → 4 → 5 (full flow)
  - [ ] Sam flow: Steps 1 → 2A → 3 → 5 (skip 4)
  - [ ] Hidden steps array per persona
  - [ ] Default form values per persona
  - [ ] Emphasis areas per persona (cost, team, technical)
- **Technical Notes**:
  ```typescript
  interface PersonaFlow {
    steps: (number | string)[];
    hiddenSteps: number[];
    defaults: Partial<ProjectCreationForm>;
    emphasis: 'cost_savings' | 'team_productivity' | 'technical_metrics';
  }

  const flows: Record<PersonaType, PersonaFlow> = {
    alex: {
      steps: [1, '2a', 5],
      hiddenSteps: [3, 4],
      defaults: { type: 'repository', chunkingStrategy: 'semantic' },
      emphasis: 'cost_savings'
    },
    maya: {
      steps: [1, '2b', 3, 4, 5],
      hiddenSteps: [],
      defaults: { type: 'repository', privacy: 'shared' },
      emphasis: 'team_productivity'
    },
    sam: {
      steps: [1, '2a', 3, 5],
      hiddenSteps: [4],
      defaults: { type: 'repository', showAdvanced: true },
      emphasis: 'technical_metrics'
    }
  };
  ```

### Feature 3: Dynamic Step Navigation
- **Description**: Navigate through wizard based on persona flow
- **Acceptance Criteria**:
  - [ ] `getNextStep(currentStep, persona)` function
  - [ ] `getPreviousStep(currentStep, persona)` function
  - [ ] Skip hidden steps automatically
  - [ ] Step indicator shows only visible steps
  - [ ] "Skip this step" option for optional steps
  - [ ] Progress percentage based on visible steps
- **Technical Notes**: Consider step navigation hook for reusability

### Feature 4: Error Recovery - Repository Fetch Failures
- **Description**: Handle repository cloning/access failures
- **Acceptance Criteria**:
  - [ ] Detect fetch failure errors
  - [ ] Show error message: "Failed to access repository"
  - [ ] Recovery options:
    - "Use alternate branch" → Branch selector
    - "Upload as ZIP instead" → Switch to Step 2C
    - "Try different repo" → Return to Step 2A
  - [ ] Track error occurrences for analytics
- **Technical Notes**:
  ```typescript
  interface ErrorRecovery {
    error: string;
    options: RecoveryOption[];
  }

  const repositoryFetchRecovery: ErrorRecovery = {
    error: 'Failed to access repository',
    options: [
      { label: 'Use alternate branch', action: 'retry_branch' },
      { label: 'Upload as ZIP instead', action: 'switch_to_upload' },
      { label: 'Try different repo', action: 'change_repo' }
    ]
  };
  ```

### Feature 5: Error Recovery - Parsing Failures
- **Description**: Handle file parsing failures gracefully
- **Acceptance Criteria**:
  - [ ] Detect parsing errors (unsupported format, memory issues)
  - [ ] Show error message: "Failed to parse some files"
  - [ ] Recovery options:
    - "Exclude problem files" → Filter configuration
    - "Retry with more memory" → Server-side retry
    - "Use manual upload" → Switch mode
  - [ ] Show which files failed (collapsible list)
- **Technical Notes**: Log detailed error info for debugging

### Feature 6: Error Recovery - Chunking Failures
- **Description**: Handle chunking strategy failures
- **Acceptance Criteria**:
  - [ ] Detect chunking errors (strategy incompatibility)
  - [ ] Show error message: "Chunking strategy failed"
  - [ ] Recovery options:
    - "Switch to fixed-size chunks" → Change strategy
    - "Retry with aggressive filtering" → Apply more filters
    - "Contact support" → Support link
  - [ ] Preserve processed progress where possible
- **Technical Notes**: Chunking failures are rare but should be handled

### Feature 7: Retry Logic with Exponential Backoff
- **Description**: Automatic retry for transient failures
- **Acceptance Criteria**:
  - [ ] Retry up to 3 times on failure
  - [ ] Exponential backoff: 2s, 4s, 8s delays
  - [ ] User notification during retry: "Retrying (attempt 2/3)..."
  - [ ] Option to cancel retries
  - [ ] Different retry behavior for different error types
  - [ ] After max retries, show manual recovery options
- **Technical Notes**:
  ```typescript
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    onRetry?: (attempt: number) => void
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        const backoffTime = Math.pow(2, attempt) * 1000;
        onRetry?.(attempt);
        await sleep(backoffTime);
      }
    }
    throw new Error('Max retries exceeded');
  };
  ```

### Feature 8: Alex Persona - Completion CTA
- **Description**: Cost-focused completion screen for solo developers
- **Acceptance Criteria**:
  - [ ] Emphasize token/cost savings prominently
  - [ ] Show: "You saved X tokens (€Y in API costs)"
  - [ ] Primary CTA: "Copy to Cursor"
  - [ ] Secondary CTAs: "Process 3 more repos", "Upgrade plan"
  - [ ] Quick wins section: Largest repo, Most complex project, Work projects
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────┐
  │ ✅ Project ready!                    │
  ├──────────────────────────────────────┤
  │ You saved 2,450 tokens (€1.23)      │
  │                                      │
  │ [Copy to Cursor] [View] [Share]      │
  │                                      │
  │ Quick wins:                          │
  │ ├─ Your largest repo (save 40% more)│
  │ └─ Team/work projects (show ROI)    │
  └──────────────────────────────────────┘
  ```

### Feature 9: Maya Persona - Completion CTA
- **Description**: Team-focused completion screen for enterprise users
- **Acceptance Criteria**:
  - [ ] Emphasize team workspace and collaboration
  - [ ] Show: "X repositories processing", "Y members invited"
  - [ ] Show: "Projected impact: Z hrs/mo saved", "ROI: Xx return"
  - [ ] Primary CTAs: "Invite more", "View results"
  - [ ] Setup next: Team permissions, Team demo, ROI report
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────┐
  │ ✅ Team workspace created!           │
  ├──────────────────────────────────────┤
  │ 8 repositories processing             │
  │ Team: 12 members invited              │
  │ Projected impact: 120 hrs/mo saved    │
  │ ROI: 25x return on investment         │
  │                                      │
  │ [Invite more] [View results] [Report]│
  └──────────────────────────────────────┘
  ```

### Feature 10: Sam Persona - Completion CTA
- **Description**: Technical-focused completion screen for API users
- **Acceptance Criteria**:
  - [ ] Emphasize technical metrics and integration
  - [ ] Show: Token reduction %, Query latency (p95), Relevance %
  - [ ] Primary CTAs: "API docs", "Query now", "API key"
  - [ ] Advanced setup: Custom chunking webhook, GraphQL API, Real-time sync
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────┐
  │ ✅ Context map ready!                │
  ├──────────────────────────────────────┤
  │ Token reduction: 77.1%                │
  │ Query latency: 45ms (p95)             │
  │ Relevance: 94%                        │
  │                                      │
  │ [API docs] [Query now] [API key]      │
  │ [Setup webhooks] [GitHub integration] │
  └──────────────────────────────────────┘
  ```

### Feature 11: Analytics Event Tracking
- **Description**: Track key funnel events for optimization
- **Acceptance Criteria**:
  - [ ] `project_creation_started` - When wizard opens
  - [ ] `project_step_completed` - For each step (with timing)
  - [ ] `ingestion_started` - When ingestion begins
  - [ ] `ingestion_phase_completed` - For each phase
  - [ ] `ingestion_completed` - With full metrics
  - [ ] `conversion_signal` - CTA clicks (copy_to_cursor, invite_team, etc.)
  - [ ] All events include persona type
- **Technical Notes**:
  ```typescript
  const track = (event: string, properties: Record<string, any>) => {
    analytics.track(event, {
      ...properties,
      persona: currentPersona,
      timestamp: Date.now()
    });
  };

  // Usage
  track('project_creation_started', { project_type: 'repository' });
  track('project_step_completed', { step: 1, time_to_complete: 35 });
  track('conversion_signal', { action: 'copy_to_cursor' });
  ```

### Feature 12: Persona Override Option
- **Description**: Allow users to manually switch persona/flow
- **Acceptance Criteria**:
  - [ ] "Show all options" toggle in wizard
  - [ ] When enabled, shows all steps regardless of persona
  - [ ] Persists preference for future sessions
  - [ ] Does not affect analytics persona attribution
- **Technical Notes**: Power users may want full control

## Technical Considerations
- Persona detection should run on wizard open, not on every step
- Cache persona result in session storage
- Error recovery should preserve user's entered data
- Analytics should not block user interactions (fire-and-forget)
- Consider A/B testing different CTA layouts
- Retry logic should be cancellable

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Persona detection working with real signals
- [ ] Flow routing shows correct steps per persona
- [ ] Error recovery options functional
- [ ] Retry logic working with proper backoff
- [ ] Persona-specific completion screens showing
- [ ] Analytics events firing correctly
- [ ] Manual persona override working
- [ ] Unit tests for persona detection
- [ ] Integration tests for flow routing

## Notes
- This sprint ties together all previous sprints into a cohesive experience
- Persona detection can start simple (team size only) and add signals over time
- Error recovery is critical for user trust - make it helpful, not frustrating
- CTAs should be tracked to measure conversion effectiveness
- Consider personalized onboarding tips based on persona
- The "Show all options" toggle is important for power users
