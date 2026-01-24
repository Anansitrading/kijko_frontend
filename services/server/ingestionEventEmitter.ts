/**
 * Ingestion Event Emitter Service (Server-Side)
 * Backend service for emitting WebSocket events during ingestion
 *
 * Sprint PC5c: WebSocket Infrastructure - Feature 4
 *
 * NOTE: This is a server-side service meant to run on a Node.js backend.
 * It requires socket.io or a similar WebSocket server library.
 *
 * Features:
 * - Rate limiting to prevent flooding (max 2 events/second per project)
 * - Batch similar updates within 500ms window
 * - Typed event emission methods
 * - Project namespace management
 */

import type {
  IngestionPhase,
  IngestionMetrics,
  PhaseStartedEvent,
  ProgressUpdateEvent,
  IngestionCompleteEvent,
  IngestionErrorEvent,
  Project,
} from '../../types/project';

// =============================================================================
// Types
// =============================================================================

/** Server socket interface (compatible with socket.io Server) */
interface ServerSocket {
  to(room: string): {
    emit(event: string, data: unknown): void;
  };
  in(room: string): {
    fetchSockets(): Promise<{ id: string }[]>;
  };
}

/** Rate limit entry for a project */
interface RateLimitEntry {
  lastEmitTime: number;
  pendingUpdate: ProgressUpdateEvent | null;
  batchTimeout: ReturnType<typeof setTimeout> | null;
}

/** Emitter options */
export interface IngestionEventEmitterOptions {
  /** Minimum interval between progress updates per project (default: 500ms) */
  minUpdateInterval?: number;
  /** Maximum events per second per project (default: 2) */
  maxEventsPerSecond?: number;
  /** Batch window for similar updates (default: 500ms) */
  batchWindow?: number;
  /** Enable logging (default: true) */
  enableLogging?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<IngestionEventEmitterOptions> = {
  minUpdateInterval: 500,
  maxEventsPerSecond: 2,
  batchWindow: 500,
  enableLogging: true,
};

// =============================================================================
// Ingestion Event Emitter Class
// =============================================================================

export class IngestionEventEmitter {
  private io: ServerSocket | null = null;
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private options: Required<IngestionEventEmitterOptions>;

  constructor(options: IngestionEventEmitterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the emitter with a socket.io server instance
   */
  initialize(io: ServerSocket): void {
    this.io = io;
    this.log('IngestionEventEmitter initialized');
  }

  /**
   * Get the WebSocket namespace URL for a project
   */
  getNamespaceUrl(projectId: string): string {
    return `/api/projects/${projectId}/progress`;
  }

  /**
   * Get the room name for a project
   */
  private getRoom(projectId: string): string {
    return `ingestion:${projectId}`;
  }

  // =============================================================================
  // Public Emit Methods
  // =============================================================================

  /**
   * Emit phase started event
   */
  emitPhaseStarted(
    projectId: string,
    phase: IngestionPhase,
    message: string,
    options: {
      totalPhases?: number;
      currentPhaseIndex?: number;
    } = {}
  ): void {
    if (!this.io) {
      this.warn('Cannot emit: socket.io not initialized');
      return;
    }

    const event: PhaseStartedEvent = {
      projectId,
      phase,
      message,
      startTime: new Date(),
      totalPhases: options.totalPhases ?? 5,
      currentPhaseIndex: options.currentPhaseIndex ?? this.getPhaseIndex(phase),
    };

    // Phase started events are always sent immediately (not rate limited)
    this.io.to(this.getRoom(projectId)).emit('phase_started', event);
    this.log(`[${projectId}] Phase started: ${phase}`);

    // Reset rate limit for new phase
    this.resetRateLimit(projectId);
  }

  /**
   * Emit progress update event with rate limiting
   */
  emitProgressUpdate(
    projectId: string,
    phase: IngestionPhase,
    progressPercent: number,
    metrics: IngestionMetrics,
    message?: string
  ): void {
    if (!this.io) {
      this.warn('Cannot emit: socket.io not initialized');
      return;
    }

    const event: ProgressUpdateEvent = {
      projectId,
      phase,
      progressPercent: Math.min(Math.max(progressPercent, 0), 100),
      message: message ?? this.getDefaultProgressMessage(phase, progressPercent),
      metrics,
    };

    // Apply rate limiting
    this.emitWithRateLimit(projectId, event);
  }

  /**
   * Emit ingestion complete event
   */
  emitComplete(
    projectId: string,
    result: {
      success: boolean;
      totalDurationSeconds: number;
      finalMetrics: IngestionMetrics;
      project: Project;
    }
  ): void {
    if (!this.io) {
      this.warn('Cannot emit: socket.io not initialized');
      return;
    }

    // Flush any pending updates before completion
    this.flushPendingUpdate(projectId);

    const event: IngestionCompleteEvent = {
      projectId,
      success: result.success,
      totalDurationSeconds: result.totalDurationSeconds,
      finalMetrics: result.finalMetrics,
      project: result.project,
    };

    this.io.to(this.getRoom(projectId)).emit('ingestion_complete', event);
    this.log(`[${projectId}] Ingestion complete: ${result.success ? 'success' : 'failed'}`);

    // Cleanup rate limit entry
    this.cleanupProject(projectId);
  }

  /**
   * Emit error event
   */
  emitError(
    projectId: string,
    phase: IngestionPhase,
    error: {
      errorCode: string;
      errorMessage: string;
      recoverable?: boolean;
      retryCount?: number;
    }
  ): void {
    if (!this.io) {
      this.warn('Cannot emit: socket.io not initialized');
      return;
    }

    // Flush any pending updates before error
    this.flushPendingUpdate(projectId);

    const event: IngestionErrorEvent = {
      projectId,
      phase,
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      recoverable: error.recoverable ?? true,
      retryCount: error.retryCount ?? 0,
    };

    this.io.to(this.getRoom(projectId)).emit('error', event);
    this.log(`[${projectId}] Error in ${phase}: ${error.errorCode} - ${error.errorMessage}`);
  }

  // =============================================================================
  // Rate Limiting
  // =============================================================================

  private emitWithRateLimit(projectId: string, event: ProgressUpdateEvent): void {
    const now = Date.now();
    let entry = this.rateLimits.get(projectId);

    if (!entry) {
      entry = {
        lastEmitTime: 0,
        pendingUpdate: null,
        batchTimeout: null,
      };
      this.rateLimits.set(projectId, entry);
    }

    const timeSinceLastEmit = now - entry.lastEmitTime;

    if (timeSinceLastEmit >= this.options.minUpdateInterval) {
      // Enough time has passed, emit immediately
      this.doEmitProgress(projectId, event);
      entry.lastEmitTime = now;
      entry.pendingUpdate = null;

      if (entry.batchTimeout) {
        clearTimeout(entry.batchTimeout);
        entry.batchTimeout = null;
      }
    } else {
      // Store as pending update (will be batched)
      entry.pendingUpdate = event;

      // Set up batch timeout if not already set
      if (!entry.batchTimeout) {
        const delay = this.options.minUpdateInterval - timeSinceLastEmit;
        entry.batchTimeout = setTimeout(() => {
          this.flushPendingUpdate(projectId);
        }, delay);
      }
    }
  }

  private flushPendingUpdate(projectId: string): void {
    const entry = this.rateLimits.get(projectId);
    if (!entry || !entry.pendingUpdate) return;

    this.doEmitProgress(projectId, entry.pendingUpdate);
    entry.lastEmitTime = Date.now();
    entry.pendingUpdate = null;

    if (entry.batchTimeout) {
      clearTimeout(entry.batchTimeout);
      entry.batchTimeout = null;
    }
  }

  private doEmitProgress(projectId: string, event: ProgressUpdateEvent): void {
    if (!this.io) return;

    this.io.to(this.getRoom(projectId)).emit('progress_update', event);
    this.log(`[${projectId}] Progress: ${event.phase} ${event.progressPercent.toFixed(1)}%`);
  }

  private resetRateLimit(projectId: string): void {
    const entry = this.rateLimits.get(projectId);
    if (entry) {
      if (entry.batchTimeout) {
        clearTimeout(entry.batchTimeout);
      }
      entry.lastEmitTime = 0;
      entry.pendingUpdate = null;
      entry.batchTimeout = null;
    }
  }

  private cleanupProject(projectId: string): void {
    const entry = this.rateLimits.get(projectId);
    if (entry?.batchTimeout) {
      clearTimeout(entry.batchTimeout);
    }
    this.rateLimits.delete(projectId);
  }

  // =============================================================================
  // Utilities
  // =============================================================================

  private getPhaseIndex(phase: IngestionPhase): number {
    const phases: IngestionPhase[] = [
      'repository_fetch',
      'parsing',
      'chunking',
      'optimization',
      'indexing',
    ];
    return phases.indexOf(phase);
  }

  private getDefaultProgressMessage(phase: IngestionPhase, percent: number): string {
    const messages: Record<IngestionPhase, string> = {
      repository_fetch: 'Fetching repository contents...',
      parsing: 'Parsing source files...',
      chunking: 'Creating semantic chunks...',
      optimization: 'Optimizing tokens...',
      indexing: 'Building search index...',
    };
    return messages[phase] || `Processing... (${percent.toFixed(0)}%)`;
  }

  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[IngestionEventEmitter] ${message}`);
    }
  }

  private warn(message: string): void {
    console.warn(`[IngestionEventEmitter] ${message}`);
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  /**
   * Get number of clients connected to a project's ingestion updates
   */
  async getConnectedClients(projectId: string): Promise<number> {
    if (!this.io) return 0;

    try {
      const sockets = await this.io.in(this.getRoom(projectId)).fetchSockets();
      return sockets.length;
    } catch {
      return 0;
    }
  }

  /**
   * Cleanup all rate limits and pending updates
   */
  cleanup(): void {
    for (const [projectId, entry] of this.rateLimits) {
      if (entry.batchTimeout) {
        clearTimeout(entry.batchTimeout);
      }
    }
    this.rateLimits.clear();
    this.log('Cleanup complete');
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const ingestionEventEmitter = new IngestionEventEmitter();

export default ingestionEventEmitter;
