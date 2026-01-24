/**
 * Ingestion WebSocket Service
 * Handles real-time updates for project ingestion progress
 *
 * Namespace pattern: /api/projects/:projectId/ws
 * Events: phase_started, progress_update, ingestion_complete, error
 */

import type {
  IngestionPhase,
  IngestionMetrics,
  PhaseStartedEvent,
  ProgressUpdateEvent,
  IngestionCompleteEvent,
  IngestionErrorEvent,
  IngestionWebSocketEvent,
  Project,
} from '../types/project';

// =============================================================================
// Types
// =============================================================================

export type IngestionEventType =
  | 'phase_started'
  | 'progress_update'
  | 'ingestion_complete'
  | 'error'
  | 'connection:open'
  | 'connection:close'
  | 'connection:error';

type EventCallback<T = unknown> = (data: T) => void;

interface ConnectionOptions {
  token?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  projectId: string | null;
  error: string | null;
}

const DEFAULT_OPTIONS: ConnectionOptions = {
  autoReconnect: true,
  maxReconnectAttempts: 10,  // Sprint PC5c: 10 retry attempts
  reconnectDelay: 1000,       // Initial delay 1s
  maxReconnectDelay: 30000,   // Sprint PC5c: Max delay 30s
};

// =============================================================================
// Ingestion WebSocket Service
// =============================================================================

class IngestionWebSocketService {
  private ws: WebSocket | null = null;
  private projectId: string | null = null;
  private listeners: Map<IngestionEventType, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private options: ConnectionOptions = DEFAULT_OPTIONS;
  private mockSimulationId: ReturnType<typeof setTimeout> | null = null;

  private status: ConnectionStatus = {
    connected: false,
    connecting: false,
    projectId: null,
    error: null,
  };

  // Status change callbacks
  private onStatusChange: ((status: ConnectionStatus) => void) | null = null;

  /**
   * Set callback for connection status changes
   */
  setStatusCallback(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Connect to ingestion WebSocket for a specific project
   */
  connect(projectId: string, options?: ConnectionOptions): Promise<void> {
    // Disconnect existing connection if any
    if (this.projectId && this.projectId !== projectId) {
      this.disconnect();
    }

    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.projectId = projectId;
    this.updateStatus({ connecting: true, projectId, error: null });

    return new Promise((resolve, reject) => {
      // In production, connect to real WebSocket:
      // const wsUrl = `wss://api.kijko.ai/projects/${projectId}/ws`;
      // if (this.options.token) {
      //   wsUrl += `?token=${this.options.token}`;
      // }
      // this.ws = new WebSocket(wsUrl);

      // Mock implementation for development
      this.simulateConnection(resolve, reject);
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopMockSimulation();
    this.projectId = null;
    this.reconnectAttempts = 0;
    this.updateStatus({ connected: false, connecting: false, projectId: null, error: null });
    this.emit('connection:close', {});
  }

  /**
   * Subscribe to an ingestion event
   */
  subscribe<T = unknown>(event: IngestionEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    listeners.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as EventCallback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to all ingestion events with typed handler
   */
  subscribeAll(callback: (event: IngestionWebSocketEvent) => void): () => void {
    const unsubscribers = [
      this.subscribe<PhaseStartedEvent>('phase_started', data =>
        callback({ type: 'phase_started', data })),
      this.subscribe<ProgressUpdateEvent>('progress_update', data =>
        callback({ type: 'progress_update', data })),
      this.subscribe<IngestionCompleteEvent>('ingestion_complete', data =>
        callback({ type: 'ingestion_complete', data })),
      this.subscribe<IngestionErrorEvent>('error', data =>
        callback({ type: 'error', data })),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    this.onStatusChange?.(this.status);
  }

  private emit<T>(event: IngestionEventType, data: T): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ingestion WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  // =============================================================================
  // Mock Implementation for Development
  // =============================================================================

  private simulateConnection(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    // Simulate connection delay
    setTimeout(() => {
      // 95% success rate
      if (Math.random() > 0.05) {
        this.updateStatus({ connected: true, connecting: false });
        this.emit('connection:open', { projectId: this.projectId });
        resolve();
      } else {
        this.handleConnectionFailure(resolve, reject);
      }
    }, 300 + Math.random() * 200);
  }

  private handleConnectionFailure(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    this.reconnectAttempts++;

    const maxAttempts = this.options.maxReconnectAttempts ?? 10;
    const maxDelay = this.options.maxReconnectDelay ?? 30000;

    if (
      this.options.autoReconnect &&
      this.reconnectAttempts < maxAttempts
    ) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, capped at maxDelay (30s)
      const calculatedDelay = (this.options.reconnectDelay ?? 1000) * Math.pow(2, this.reconnectAttempts - 1);
      const delay = Math.min(calculatedDelay, maxDelay);
      console.log(`Ingestion WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${maxAttempts})`);

      setTimeout(() => {
        this.simulateConnection(resolve, reject);
      }, delay);
    } else {
      this.updateStatus({
        connected: false,
        connecting: false,
        error: 'Failed to connect to ingestion service'
      });
      this.emit('connection:error', {
        message: 'Connection failed after max retries',
        attempts: this.reconnectAttempts,
        maxAttempts
      });
      reject(new Error('Failed to connect to ingestion WebSocket'));
    }
  }

  private stopMockSimulation(): void {
    if (this.mockSimulationId) {
      clearTimeout(this.mockSimulationId);
      this.mockSimulationId = null;
    }
  }

  /**
   * Simulate a complete ingestion process for development/testing
   * Call this after connecting to see mock events
   */
  simulateIngestion(projectId: string): void {
    if (!this.status.connected || this.projectId !== projectId) {
      console.warn('Cannot simulate ingestion: not connected to project', projectId);
      return;
    }

    const phases: IngestionPhase[] = [
      'repository_fetch',
      'parsing',
      'chunking',
      'optimization',
      'indexing',
    ];

    let currentPhaseIndex = 0;
    let progress = 0;

    const runPhase = () => {
      if (currentPhaseIndex >= phases.length) {
        // Complete
        const completeEvent: IngestionCompleteEvent = {
          projectId,
          success: true,
          totalDurationSeconds: 45,
          finalMetrics: {
            filesProcessed: 156,
            totalFiles: 156,
            tokensProcessed: 524288,
            bytesProcessed: 2097152,
            chunksCreated: 89,
            errorsEncountered: 0,
          },
          project: {
            id: projectId,
            userId: 'user-001',
            organizationId: 'org-001',
            name: 'Test Project',
            type: 'repository',
            status: 'active',
            privacy: 'private',
            chunkingStrategy: 'semantic',
            includeMetadata: true,
            anonymizeSecrets: true,
            totalRepos: 2,
            totalFiles: 156,
            originalTokens: 524288,
            optimizedTokens: 26214,
            ingestionTimeSeconds: 45,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        this.emit('ingestion_complete', completeEvent);
        return;
      }

      const phase = phases[currentPhaseIndex];

      // Emit phase started
      const startEvent: PhaseStartedEvent = {
        projectId,
        phase,
        message: getPhaseMessage(phase, 'starting'),
        startTime: new Date(),
        totalPhases: phases.length,
        currentPhaseIndex,
      };
      this.emit('phase_started', startEvent);

      // Simulate progress updates
      progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10 + Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
          currentPhaseIndex++;
          this.mockSimulationId = setTimeout(runPhase, 500);
        }

        const progressEvent: ProgressUpdateEvent = {
          projectId,
          phase,
          progressPercent: Math.min(progress, 100),
          message: getPhaseMessage(phase, 'progress'),
          metrics: {
            filesProcessed: Math.floor(156 * (progress / 100)),
            totalFiles: 156,
            tokensProcessed: Math.floor(524288 * (progress / 100)),
            bytesProcessed: Math.floor(2097152 * (progress / 100)),
            chunksCreated: Math.floor(89 * (progress / 100)),
            errorsEncountered: 0,
          },
        };
        this.emit('progress_update', progressEvent);
      }, 300 + Math.random() * 200);
    };

    // Start the simulation
    this.mockSimulationId = setTimeout(runPhase, 500);
  }

  /**
   * Simulate an ingestion error for testing
   */
  simulateError(projectId: string, phase: IngestionPhase = 'parsing'): void {
    const errorEvent: IngestionErrorEvent = {
      projectId,
      phase,
      errorCode: 'PARSE_ERROR',
      errorMessage: 'Failed to parse file: invalid syntax',
      recoverable: true,
      retryCount: 1,
    };
    this.emit('error', errorEvent);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPhaseMessage(phase: IngestionPhase, type: 'starting' | 'progress'): string {
  const messages: Record<IngestionPhase, { starting: string; progress: string }> = {
    repository_fetch: {
      starting: 'Fetching repository contents...',
      progress: 'Downloading files from repository...',
    },
    parsing: {
      starting: 'Parsing source files...',
      progress: 'Analyzing code structure and syntax...',
    },
    chunking: {
      starting: 'Chunking content...',
      progress: 'Splitting content into semantic chunks...',
    },
    optimization: {
      starting: 'Optimizing tokens...',
      progress: 'Compressing and optimizing token usage...',
    },
    indexing: {
      starting: 'Indexing for search...',
      progress: 'Building search indices and embeddings...',
    },
  };

  return messages[phase][type];
}

// =============================================================================
// Export Singleton
// =============================================================================

export const ingestionWebSocket = new IngestionWebSocketService();

export default ingestionWebSocket;
