# Sprint PC5c: WebSocket Infrastructure

## Goal
Implement the complete WebSocket infrastructure for real-time ingestion updates, including client-side handlers, server-side event emitters, and connection management.

## Prerequisites Completed By This Sprint
- Real-time communication between server and client
- All ingestion events flowing to UI components
- Robust connection handling with reconnection

## Dependencies From Previous Sprints
- **Sprint PC1**: WebSocket infrastructure foundation
- **Sprint PC5a**: Ingestion API endpoint returns WebSocket URL
- **Sprint PC5b**: Phase UI components ready to receive events

## Deliverables

### Feature 1: WebSocket Event Types
- **Description**: Define all event types for ingestion communication
- **Acceptance Criteria**:
  - [ ] `phase_started` event type with phase info
  - [ ] `progress_update` event type with metrics
  - [ ] `ingestion_complete` event type with results
  - [ ] `error` event type with error details and recovery options
  - [ ] TypeScript interfaces for all event payloads
  - [ ] Event validation schemas (Zod or similar)
- **Technical Notes**:
  ```typescript
  // Event types
  type IngestionEventType =
    | 'phase_started'
    | 'progress_update'
    | 'ingestion_complete'
    | 'error';

  interface PhaseStartedEvent {
    type: 'phase_started';
    phase: 1 | 2 | 3 | 4;
    phaseName: string;
    message: string;
    timestamp: number;
  }

  interface ProgressUpdateEvent {
    type: 'progress_update';
    phase: 1 | 2 | 3 | 4;
    progressPercent: number;
    metrics: PhaseMetrics;
    timestamp: number;
  }

  interface IngestionCompleteEvent {
    type: 'ingestion_complete';
    result: IngestionResult;
    timestamp: number;
  }

  interface ErrorEvent {
    type: 'error';
    phase: 1 | 2 | 3 | 4;
    errorCode: string;
    message: string;
    recoverable: boolean;
    retryOptions?: RetryOptions;
  }
  ```

### Feature 2: Client-Side WebSocket Hook
- **Description**: React hook for managing WebSocket connection and events
- **Acceptance Criteria**:
  - [ ] `useIngestionSocket(projectId)` hook
  - [ ] Auto-connect on mount, cleanup on unmount
  - [ ] Expose connection state: connecting, connected, disconnected, error
  - [ ] Handle `phase_started` event - update current phase
  - [ ] Handle `progress_update` event - update metrics and progress
  - [ ] Handle `ingestion_complete` event - trigger completion callback
  - [ ] Handle `error` event - expose error for UI handling
  - [ ] Reconnection logic with exponential backoff
  - [ ] Offline indicator state
- **Technical Notes**:
  ```typescript
  const useIngestionSocket = (projectId: string) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [currentPhase, setCurrentPhase] = useState<number>(0);
    const [progress, setProgress] = useState<ProgressState>(initialProgress);
    const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
    const [error, setError] = useState<IngestionError | null>(null);

    useEffect(() => {
      const socket = io(`/api/projects/${projectId}/progress`);

      socket.on('connect', () => setConnectionState('connected'));
      socket.on('disconnect', () => setConnectionState('disconnected'));

      socket.on('phase_started', (data: PhaseStartedEvent) => {
        setCurrentPhase(data.phase);
      });

      socket.on('progress_update', (data: ProgressUpdateEvent) => {
        setProgress(prev => ({
          ...prev,
          [data.phase]: data.progressPercent
        }));
        setMetrics(data.metrics);
      });

      socket.on('ingestion_complete', (data: IngestionCompleteEvent) => {
        setConnectionState('completed');
        // Trigger callback
      });

      socket.on('error', (data: ErrorEvent) => {
        setError(data);
      });

      return () => socket.disconnect();
    }, [projectId]);

    return { connectionState, currentPhase, progress, metrics, error };
  };
  ```

### Feature 3: Reconnection Logic
- **Description**: Robust reconnection handling for dropped connections
- **Acceptance Criteria**:
  - [ ] Auto-reconnect on disconnect (unless completed or user-cancelled)
  - [ ] Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  - [ ] Maximum retry attempts (10) before giving up
  - [ ] State recovery on reconnect (fetch current progress from server)
  - [ ] UI indicator during reconnection attempts
  - [ ] Manual reconnect button after max retries
- **Technical Notes**:
  ```typescript
  const reconnectionConfig = {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 20000,
  };
  ```

### Feature 4: Server-Side Event Emitter Service
- **Description**: Backend service for emitting WebSocket events during ingestion
- **Acceptance Criteria**:
  - [ ] `IngestionEventEmitter` service class
  - [ ] `emitPhaseStarted(projectId, phase, message)` method
  - [ ] `emitProgressUpdate(projectId, phase, percent, metrics)` method
  - [ ] `emitComplete(projectId, result)` method
  - [ ] `emitError(projectId, phase, error)` method
  - [ ] Rate limiting to prevent flooding (max 2 events/second per project)
  - [ ] Batch similar updates within 500ms window
- **Technical Notes**:
  ```typescript
  class IngestionEventEmitter {
    private io: Server;
    private lastEmit: Map<string, number> = new Map();
    private minInterval = 500; // ms

    emitProgressUpdate(projectId: string, phase: number, percent: number, metrics: Metrics) {
      const namespace = `/api/projects/${projectId}/progress`;
      const now = Date.now();
      const lastTime = this.lastEmit.get(projectId) || 0;

      if (now - lastTime >= this.minInterval) {
        this.io.to(namespace).emit('progress_update', {
          type: 'progress_update',
          phase,
          progressPercent: percent,
          metrics,
          timestamp: now,
        });
        this.lastEmit.set(projectId, now);
      }
    }
  }
  ```

### Feature 5: Database Progress Persistence
- **Description**: Persist progress updates to database for recovery
- **Acceptance Criteria**:
  - [ ] Update `ingestion_progress` table on each phase start
  - [ ] Store current metrics snapshot every 5 seconds
  - [ ] Store final results on completion
  - [ ] API endpoint to fetch current progress (for reconnection)
  - [ ] `GET /api/projects/:id/progress` returns latest state
- **Technical Notes**:
  ```typescript
  // ingestion_progress table schema reminder
  interface IngestionProgress {
    id: string;
    project_id: string;
    current_phase: number;
    progress_percent: number;
    metrics_snapshot: JSON;
    started_at: timestamp;
    updated_at: timestamp;
    completed_at: timestamp | null;
    error: JSON | null;
  }
  ```

### Feature 6: Connection Authentication
- **Description**: Secure WebSocket connections with project access tokens
- **Acceptance Criteria**:
  - [ ] Require auth token in WebSocket handshake
  - [ ] Validate user has access to project
  - [ ] Reject unauthorized connection attempts
  - [ ] Token refresh mechanism for long-running ingestions
  - [ ] Log unauthorized access attempts
- **Technical Notes**:
  ```typescript
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const projectId = socket.handshake.query.projectId;

    validateProjectAccess(token, projectId)
      .then(() => next())
      .catch(err => next(new Error('Unauthorized')));
  });
  ```

### Feature 7: Polling Fallback
- **Description**: Fallback to HTTP polling if WebSocket fails
- **Acceptance Criteria**:
  - [ ] Detect WebSocket failure after 3 connection attempts
  - [ ] Switch to polling mode automatically
  - [ ] Poll `GET /api/projects/:id/progress` every 2 seconds
  - [ ] Same UI behavior regardless of transport
  - [ ] Show indicator that real-time is degraded
  - [ ] Attempt WebSocket reconnection periodically in background
- **Technical Notes**: Use same state interface for both transports

## Technical Considerations
- WebSocket namespace per project: `/api/projects/{id}/progress`
- Consider using Socket.IO for built-in reconnection and rooms
- Server should handle multiple concurrent ingestions
- Clean up socket connections on ingestion completion
- Monitor WebSocket memory usage in production
- Consider Redis adapter for multi-server deployments

## Definition of Done
- [ ] All acceptance criteria met
- [ ] WebSocket connection established successfully
- [ ] All event types handled correctly
- [ ] Reconnection works after network interruption
- [ ] Progress persisted to database
- [ ] Authentication prevents unauthorized access
- [ ] Polling fallback works when WebSocket fails
- [ ] Load testing: 100 concurrent ingestions
- [ ] Unit tests for event handlers
- [ ] Integration tests for full WebSocket flow

## Notes
- This sprint enables the real-time experience that makes ingestion feel fast
- WebSocket stability is critical - users should never "lose" their ingestion
- Consider adding a "watching" mode for users who navigate away and return
- Server memory management is important for long-running connections
- Log all events for debugging production issues
