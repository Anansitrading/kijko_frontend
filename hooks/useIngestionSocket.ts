/**
 * useIngestionSocket Hook
 * Manages WebSocket connection for real-time ingestion updates
 *
 * Sprint PC5c: WebSocket Infrastructure - Feature 2 & 3
 *
 * Features:
 * - Auto-connect on mount, cleanup on unmount
 * - Connection state tracking
 * - Event handling for all ingestion events
 * - Exponential backoff reconnection
 * - Polling fallback when WebSocket fails
 * - Manual reconnect after max retries
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ingestionWebSocket } from '../services/ingestionWebSocket';
import { getIngestionProgress } from '../services/projectApi';
import type {
  IngestionPhase,
  IngestionMetrics,
  PhaseStartedEvent,
  ProgressUpdateEvent,
  IngestionCompleteEvent,
  IngestionErrorEvent,
  IngestionProgress,
  Project,
} from '../types/project';
import {
  validatePhaseStartedEvent,
  validateProgressUpdateEvent,
  validateIngestionCompleteEvent,
  validateIngestionErrorEvent,
} from '../types/websocketEvents';

// =============================================================================
// Types
// =============================================================================

/** Connection state for the WebSocket */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'completed'
  | 'polling';

/** Ingestion error with recovery options */
export interface IngestionError {
  phase: IngestionPhase;
  errorCode: string;
  errorMessage: string;
  recoverable: boolean;
  retryCount: number;
}

/** Progress state for each phase */
export interface PhaseProgress {
  phase: IngestionPhase;
  progressPercent: number;
  message: string;
}

/** Hook options */
export interface UseIngestionSocketOptions {
  /** Auth token for WebSocket connection */
  token?: string;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Callback when ingestion completes */
  onComplete?: (project: Project) => void;
  /** Callback when an error occurs */
  onError?: (error: IngestionError) => void;
  /** Enable polling fallback */
  enablePollingFallback?: boolean;
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
}

/** Hook return value */
export interface UseIngestionSocketReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Current ingestion phase (0 = not started) */
  currentPhase: IngestionPhase | null;
  /** Current phase index (0-based) */
  currentPhaseIndex: number;
  /** Total number of phases */
  totalPhases: number;
  /** Progress percentage for current phase */
  progressPercent: number;
  /** Current phase message */
  message: string;
  /** Current metrics */
  metrics: IngestionMetrics;
  /** Current error (if any) */
  error: IngestionError | null;
  /** Whether currently reconnecting */
  isReconnecting: boolean;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts: number;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Disconnect and cleanup */
  disconnect: () => void;
  /** Whether using polling fallback */
  isPolling: boolean;
  /** Completed project data */
  completedProject: Project | null;
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_METRICS: IngestionMetrics = {
  filesProcessed: 0,
  totalFiles: 0,
  tokensProcessed: 0,
  bytesProcessed: 0,
  chunksCreated: 0,
  errorsEncountered: 0,
};

const DEFAULT_PHASES: IngestionPhase[] = [
  'repository_fetch',
  'parsing',
  'chunking',
  'optimization',
  'indexing',
];

// Reconnection config per sprint requirements
const RECONNECTION_CONFIG = {
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

// Number of WebSocket failures before switching to polling
const POLLING_THRESHOLD = 3;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useIngestionSocket(
  projectId: string | null | undefined,
  options: UseIngestionSocketOptions = {}
): UseIngestionSocketReturn {
  const {
    token,
    autoConnect = true,
    onComplete,
    onError,
    enablePollingFallback = true,
    pollingInterval = 2000,
  } = options;

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  // Ingestion state
  const [currentPhase, setCurrentPhase] = useState<IngestionPhase | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [totalPhases, setTotalPhases] = useState(DEFAULT_PHASES.length);
  const [progressPercent, setProgressPercent] = useState(0);
  const [message, setMessage] = useState('');
  const [metrics, setMetrics] = useState<IngestionMetrics>(INITIAL_METRICS);
  const [error, setError] = useState<IngestionError | null>(null);
  const [completedProject, setCompletedProject] = useState<Project | null>(null);

  // Refs for cleanup and intervals
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsFailureCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // =============================================================================
  // Polling Fallback
  // =============================================================================

  const startPolling = useCallback(() => {
    if (!projectId || pollingIntervalRef.current) return;

    console.log('[useIngestionSocket] Starting polling fallback');
    setIsPolling(true);
    setConnectionState('polling');

    const poll = async () => {
      if (!isMountedRef.current) return;

      try {
        const progress = await getIngestionProgress(projectId);
        if (!progress || !isMountedRef.current) return;

        // Update state from polling response
        setCurrentPhase(progress.phase);
        setCurrentPhaseIndex(DEFAULT_PHASES.indexOf(progress.phase));
        setProgressPercent(progress.progressPercent);
        setMessage(progress.message);
        setMetrics(progress.metrics);

        // Check if completed
        if (progress.completedAt) {
          stopPolling();
          setConnectionState('completed');
        }

        // Check for error
        if (progress.errorMessage) {
          setError({
            phase: progress.phase,
            errorCode: progress.errorCode || 'UNKNOWN_ERROR',
            errorMessage: progress.errorMessage,
            recoverable: true,
            retryCount: 0,
          });
        }
      } catch (err) {
        console.error('[useIngestionSocket] Polling error:', err);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollingIntervalRef.current = setInterval(poll, pollingInterval);
  }, [projectId, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // =============================================================================
  // WebSocket Event Handlers
  // =============================================================================

  const handlePhaseStarted = useCallback((data: PhaseStartedEvent) => {
    const result = validatePhaseStartedEvent(data);
    if (!result.success) {
      console.error('[useIngestionSocket] Invalid phase_started event:', result.error);
      return;
    }

    const event = result.data!;
    setCurrentPhase(event.phase);
    setCurrentPhaseIndex(event.currentPhaseIndex);
    setTotalPhases(event.totalPhases);
    setProgressPercent(0);
    setMessage(event.message);
    setError(null);
  }, []);

  const handleProgressUpdate = useCallback((data: ProgressUpdateEvent) => {
    const result = validateProgressUpdateEvent(data);
    if (!result.success) {
      console.error('[useIngestionSocket] Invalid progress_update event:', result.error);
      return;
    }

    const event = result.data!;
    setCurrentPhase(event.phase);
    setProgressPercent(event.progressPercent);
    setMessage(event.message);
    setMetrics(event.metrics);
  }, []);

  const handleIngestionComplete = useCallback((data: IngestionCompleteEvent) => {
    const result = validateIngestionCompleteEvent(data);
    if (!result.success) {
      console.error('[useIngestionSocket] Invalid ingestion_complete event:', result.error);
      return;
    }

    const event = result.data!;
    setConnectionState('completed');
    setProgressPercent(100);
    setMetrics(event.finalMetrics);
    setCompletedProject(event.project);

    // Call completion callback
    onComplete?.(event.project);

    // Disconnect after completion
    ingestionWebSocket.disconnect();
  }, [onComplete]);

  const handleError = useCallback((data: IngestionErrorEvent) => {
    const result = validateIngestionErrorEvent(data);
    if (!result.success) {
      console.error('[useIngestionSocket] Invalid error event:', result.error);
      return;
    }

    const event = result.data!;
    const ingestionError: IngestionError = {
      phase: event.phase,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      recoverable: event.recoverable,
      retryCount: event.retryCount,
    };

    setError(ingestionError);
    setConnectionState('error');

    // Call error callback
    onError?.(ingestionError);
  }, [onError]);

  // =============================================================================
  // Connection Management
  // =============================================================================

  const connect = useCallback(async () => {
    if (!projectId) return;

    setConnectionState('connecting');
    setError(null);

    try {
      await ingestionWebSocket.connect(projectId, {
        token,
        autoReconnect: false, // We handle reconnection ourselves
        maxReconnectAttempts: 1,
        reconnectDelay: 1000,
      });

      // Reset failure count on successful connection
      wsFailureCountRef.current = 0;
      setConnectionState('connected');
      setIsReconnecting(false);
      setReconnectAttempts(0);

      // Stop polling if we were using it
      stopPolling();

      // Subscribe to events
      unsubscribeRef.current = ingestionWebSocket.subscribeAll((event) => {
        switch (event.type) {
          case 'phase_started':
            handlePhaseStarted(event.data);
            break;
          case 'progress_update':
            handleProgressUpdate(event.data);
            break;
          case 'ingestion_complete':
            handleIngestionComplete(event.data);
            break;
          case 'error':
            handleError(event.data);
            break;
        }
      });

      // Set up status callback for disconnect detection
      ingestionWebSocket.setStatusCallback((status) => {
        if (!status.connected && !status.connecting && isMountedRef.current) {
          // Connection lost - attempt reconnection
          handleDisconnect();
        }
      });

      // Try to recover state on reconnection
      await recoverState();

    } catch (err) {
      console.error('[useIngestionSocket] Connection failed:', err);
      wsFailureCountRef.current++;

      // Check if we should switch to polling
      if (enablePollingFallback && wsFailureCountRef.current >= POLLING_THRESHOLD) {
        console.log('[useIngestionSocket] Switching to polling fallback');
        startPolling();
        return;
      }

      // Attempt reconnection
      handleDisconnect();
    }
  }, [projectId, token, handlePhaseStarted, handleProgressUpdate, handleIngestionComplete, handleError, enablePollingFallback, startPolling, stopPolling]);

  const handleDisconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (connectionState === 'completed') return;

    // Unsubscribe from events
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Check if max retries reached
    if (reconnectAttempts >= RECONNECTION_CONFIG.maxAttempts) {
      setConnectionState('error');
      setIsReconnecting(false);

      // Switch to polling if enabled
      if (enablePollingFallback) {
        startPolling();
      }
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      RECONNECTION_CONFIG.initialDelay * Math.pow(RECONNECTION_CONFIG.backoffMultiplier, reconnectAttempts),
      RECONNECTION_CONFIG.maxDelay
    );

    console.log(`[useIngestionSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${RECONNECTION_CONFIG.maxAttempts})`);

    setConnectionState('reconnecting');
    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    // Schedule reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, delay);
  }, [connectionState, reconnectAttempts, enablePollingFallback, startPolling, connect]);

  const recoverState = useCallback(async () => {
    if (!projectId) return;

    try {
      const progress = await getIngestionProgress(projectId);
      if (!progress || !isMountedRef.current) return;

      // Restore state from server
      setCurrentPhase(progress.phase);
      setCurrentPhaseIndex(DEFAULT_PHASES.indexOf(progress.phase));
      setProgressPercent(progress.progressPercent);
      setMessage(progress.message);
      setMetrics(progress.metrics);

      if (progress.errorMessage) {
        setError({
          phase: progress.phase,
          errorCode: progress.errorCode || 'UNKNOWN_ERROR',
          errorMessage: progress.errorMessage,
          recoverable: true,
          retryCount: 0,
        });
      }
    } catch (err) {
      console.error('[useIngestionSocket] State recovery failed:', err);
    }
  }, [projectId]);

  const disconnect = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop polling
    stopPolling();

    // Unsubscribe from events
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Disconnect WebSocket
    ingestionWebSocket.disconnect();

    // Reset state
    setConnectionState('disconnected');
    setIsReconnecting(false);
    setReconnectAttempts(0);
  }, [stopPolling]);

  const reconnect = useCallback(() => {
    // Reset failure count for manual reconnect
    wsFailureCountRef.current = 0;
    setReconnectAttempts(0);

    // Stop polling if active
    stopPolling();

    // Attempt connection
    connect();
  }, [connect, stopPolling]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Auto-connect on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect && projectId) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [projectId]); // Only reconnect when projectId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    connectionState,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    progressPercent,
    message,
    metrics,
    error,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts: RECONNECTION_CONFIG.maxAttempts,
    reconnect,
    disconnect,
    isPolling,
    completedProject,
  };
}

export default useIngestionSocket;
