/**
 * Ingestion Polling Service
 * HTTP polling fallback when WebSocket connection fails
 *
 * Sprint PC5c: WebSocket Infrastructure - Feature 7
 *
 * Features:
 * - Automatic fallback when WebSocket fails after 3 attempts
 * - Polls GET /api/projects/:id/progress every 2 seconds
 * - Same UI behavior regardless of transport
 * - Shows degraded real-time indicator
 * - Periodically attempts WebSocket reconnection in background
 */

import { getIngestionProgress } from './projectApi';
import type {
  IngestionPhase,
  IngestionMetrics,
  IngestionProgress,
} from '../types/project';

// =============================================================================
// Types
// =============================================================================

export type PollingState = 'idle' | 'polling' | 'stopped' | 'error';

export interface PollingUpdate {
  phase: IngestionPhase;
  progressPercent: number;
  message: string;
  metrics: IngestionMetrics;
  isComplete: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface PollingCallbacks {
  /** Called on each successful poll with updated progress */
  onProgress?: (update: PollingUpdate) => void;
  /** Called when ingestion completes */
  onComplete?: (finalProgress: IngestionProgress) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when polling state changes */
  onStateChange?: (state: PollingState) => void;
}

export interface PollingOptions {
  /** Polling interval in milliseconds (default: 2000) */
  interval?: number;
  /** Interval to check if WebSocket is available again (default: 30000) */
  wsRetryInterval?: number;
  /** Maximum consecutive errors before stopping (default: 5) */
  maxConsecutiveErrors?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<PollingOptions> = {
  interval: 2000,
  wsRetryInterval: 30000,
  maxConsecutiveErrors: 5,
};

// =============================================================================
// Ingestion Polling Service
// =============================================================================

class IngestionPollingService {
  private projectId: string | null = null;
  private state: PollingState = 'idle';
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private wsRetryInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: PollingCallbacks = {};
  private options: Required<PollingOptions> = DEFAULT_OPTIONS;
  private consecutiveErrors = 0;
  private lastProgress: IngestionProgress | null = null;
  private onWebSocketAvailable: (() => void) | null = null;

  /**
   * Start polling for a project
   */
  start(
    projectId: string,
    callbacks: PollingCallbacks,
    options: PollingOptions = {}
  ): void {
    // Stop any existing polling
    this.stop();

    this.projectId = projectId;
    this.callbacks = callbacks;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.consecutiveErrors = 0;

    this.updateState('polling');
    console.log(`[IngestionPolling] Started polling for project ${projectId} (interval: ${this.options.interval}ms)`);

    // Initial poll
    this.poll();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.poll();
    }, this.options.interval);

    // Set up WebSocket retry check
    this.wsRetryInterval = setInterval(() => {
      this.checkWebSocketAvailability();
    }, this.options.wsRetryInterval);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.wsRetryInterval) {
      clearInterval(this.wsRetryInterval);
      this.wsRetryInterval = null;
    }

    this.projectId = null;
    this.callbacks = {};
    this.lastProgress = null;
    this.updateState('stopped');
    console.log('[IngestionPolling] Stopped');
  }

  /**
   * Get current polling state
   */
  getState(): PollingState {
    return this.state;
  }

  /**
   * Check if currently polling
   */
  isPolling(): boolean {
    return this.state === 'polling';
  }

  /**
   * Set callback for when WebSocket becomes available again
   */
  setWebSocketAvailableCallback(callback: () => void): void {
    this.onWebSocketAvailable = callback;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private async poll(): Promise<void> {
    if (!this.projectId || this.state !== 'polling') return;

    try {
      const progress = await getIngestionProgress(this.projectId);

      // Reset error count on success
      this.consecutiveErrors = 0;

      if (!progress) {
        // No progress data - ingestion might not be started or was cancelled
        console.log('[IngestionPolling] No progress data found');
        return;
      }

      // Store for comparison
      this.lastProgress = progress;

      // Check if completed
      const isComplete = progress.completedAt !== null && progress.completedAt !== undefined;

      // Build update
      const update: PollingUpdate = {
        phase: progress.phase,
        progressPercent: progress.progressPercent,
        message: progress.message,
        metrics: progress.metrics,
        isComplete,
      };

      // Check for error
      if (progress.errorMessage) {
        update.error = {
          code: progress.errorCode || 'UNKNOWN_ERROR',
          message: progress.errorMessage,
        };
      }

      // Notify callback
      this.callbacks.onProgress?.(update);

      // Handle completion
      if (isComplete) {
        this.callbacks.onComplete?.(progress);
        this.stop();
      }
    } catch (error) {
      this.consecutiveErrors++;
      console.error('[IngestionPolling] Poll failed:', error);

      // Check if max errors reached
      if (this.consecutiveErrors >= this.options.maxConsecutiveErrors) {
        this.updateState('error');
        this.callbacks.onError?.(new Error(`Polling failed after ${this.consecutiveErrors} consecutive errors`));
        this.stop();
      }
    }
  }

  private async checkWebSocketAvailability(): Promise<void> {
    // This would typically check if the WebSocket server is responding
    // For now, we'll use a simple connectivity check

    try {
      // Try to fetch progress - if the API is working, WebSocket might be available
      if (this.projectId) {
        await getIngestionProgress(this.projectId);

        // If we get here, the API is working
        // In a real implementation, we'd also check WebSocket connectivity
        // For now, we'll notify the callback so it can attempt WebSocket reconnection

        console.log('[IngestionPolling] API responsive, WebSocket might be available');
        this.onWebSocketAvailable?.();
      }
    } catch {
      // API not available, keep polling
    }
  }

  private updateState(newState: PollingState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const ingestionPolling = new IngestionPollingService();

// =============================================================================
// Helper Hook for React
// =============================================================================

/**
 * Hook to use polling fallback in React components
 * This is a simplified version - for full features, use useIngestionSocket hook
 */
export function createPollingHook() {
  return {
    start: ingestionPolling.start.bind(ingestionPolling),
    stop: ingestionPolling.stop.bind(ingestionPolling),
    isPolling: ingestionPolling.isPolling.bind(ingestionPolling),
    getState: ingestionPolling.getState.bind(ingestionPolling),
  };
}

export default ingestionPolling;
