/**
 * WebSocket Event Validation Schemas
 * Runtime validation for ingestion WebSocket events
 *
 * Sprint PC5c: WebSocket Infrastructure
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
} from './project';

// =============================================================================
// Validation Result Types
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Ingestion Phase Validation
// =============================================================================

const VALID_PHASES: IngestionPhase[] = [
  'repository_fetch',
  'parsing',
  'chunking',
  'optimization',
  'indexing',
];

export function isValidPhase(value: unknown): value is IngestionPhase {
  return typeof value === 'string' && VALID_PHASES.includes(value as IngestionPhase);
}

// =============================================================================
// Metrics Validation
// =============================================================================

export function validateMetrics(data: unknown): ValidationResult<IngestionMetrics> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Metrics must be an object' };
  }

  const metrics = data as Record<string, unknown>;

  const requiredFields = [
    'filesProcessed',
    'totalFiles',
    'tokensProcessed',
    'bytesProcessed',
    'chunksCreated',
    'errorsEncountered',
  ];

  for (const field of requiredFields) {
    if (typeof metrics[field] !== 'number') {
      return { success: false, error: `Metrics.${field} must be a number` };
    }
    if (metrics[field] < 0) {
      return { success: false, error: `Metrics.${field} cannot be negative` };
    }
  }

  return {
    success: true,
    data: {
      filesProcessed: metrics.filesProcessed as number,
      totalFiles: metrics.totalFiles as number,
      tokensProcessed: metrics.tokensProcessed as number,
      bytesProcessed: metrics.bytesProcessed as number,
      chunksCreated: metrics.chunksCreated as number,
      errorsEncountered: metrics.errorsEncountered as number,
    },
  };
}

// =============================================================================
// PhaseStartedEvent Validation
// =============================================================================

export function validatePhaseStartedEvent(data: unknown): ValidationResult<PhaseStartedEvent> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'PhaseStartedEvent must be an object' };
  }

  const event = data as Record<string, unknown>;

  // Validate projectId
  if (typeof event.projectId !== 'string' || event.projectId.length === 0) {
    return { success: false, error: 'projectId must be a non-empty string' };
  }

  // Validate phase
  if (!isValidPhase(event.phase)) {
    return { success: false, error: `Invalid phase: ${event.phase}` };
  }

  // Validate message
  if (typeof event.message !== 'string') {
    return { success: false, error: 'message must be a string' };
  }

  // Validate startTime (can be Date or string/number for parsing)
  let startTime: Date;
  if (event.startTime instanceof Date) {
    startTime = event.startTime;
  } else if (typeof event.startTime === 'string' || typeof event.startTime === 'number') {
    startTime = new Date(event.startTime);
    if (isNaN(startTime.getTime())) {
      return { success: false, error: 'startTime must be a valid date' };
    }
  } else {
    return { success: false, error: 'startTime must be a Date or parseable string/number' };
  }

  // Validate totalPhases
  if (typeof event.totalPhases !== 'number' || event.totalPhases < 1) {
    return { success: false, error: 'totalPhases must be a positive number' };
  }

  // Validate currentPhaseIndex
  if (typeof event.currentPhaseIndex !== 'number' || event.currentPhaseIndex < 0) {
    return { success: false, error: 'currentPhaseIndex must be a non-negative number' };
  }

  return {
    success: true,
    data: {
      projectId: event.projectId,
      phase: event.phase,
      message: event.message,
      startTime,
      totalPhases: event.totalPhases,
      currentPhaseIndex: event.currentPhaseIndex,
    },
  };
}

// =============================================================================
// ProgressUpdateEvent Validation
// =============================================================================

export function validateProgressUpdateEvent(data: unknown): ValidationResult<ProgressUpdateEvent> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'ProgressUpdateEvent must be an object' };
  }

  const event = data as Record<string, unknown>;

  // Validate projectId
  if (typeof event.projectId !== 'string' || event.projectId.length === 0) {
    return { success: false, error: 'projectId must be a non-empty string' };
  }

  // Validate phase
  if (!isValidPhase(event.phase)) {
    return { success: false, error: `Invalid phase: ${event.phase}` };
  }

  // Validate progressPercent
  if (typeof event.progressPercent !== 'number') {
    return { success: false, error: 'progressPercent must be a number' };
  }
  if (event.progressPercent < 0 || event.progressPercent > 100) {
    return { success: false, error: 'progressPercent must be between 0 and 100' };
  }

  // Validate message
  if (typeof event.message !== 'string') {
    return { success: false, error: 'message must be a string' };
  }

  // Validate metrics
  const metricsResult = validateMetrics(event.metrics);
  if (!metricsResult.success) {
    return { success: false, error: metricsResult.error };
  }

  return {
    success: true,
    data: {
      projectId: event.projectId,
      phase: event.phase,
      progressPercent: event.progressPercent,
      message: event.message,
      metrics: metricsResult.data!,
    },
  };
}

// =============================================================================
// IngestionCompleteEvent Validation
// =============================================================================

export function validateIngestionCompleteEvent(data: unknown): ValidationResult<IngestionCompleteEvent> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'IngestionCompleteEvent must be an object' };
  }

  const event = data as Record<string, unknown>;

  // Validate projectId
  if (typeof event.projectId !== 'string' || event.projectId.length === 0) {
    return { success: false, error: 'projectId must be a non-empty string' };
  }

  // Validate success
  if (typeof event.success !== 'boolean') {
    return { success: false, error: 'success must be a boolean' };
  }

  // Validate totalDurationSeconds
  if (typeof event.totalDurationSeconds !== 'number' || event.totalDurationSeconds < 0) {
    return { success: false, error: 'totalDurationSeconds must be a non-negative number' };
  }

  // Validate finalMetrics
  const metricsResult = validateMetrics(event.finalMetrics);
  if (!metricsResult.success) {
    return { success: false, error: `finalMetrics: ${metricsResult.error}` };
  }

  // Validate project (basic check - should have id and name at minimum)
  if (!event.project || typeof event.project !== 'object') {
    return { success: false, error: 'project must be an object' };
  }
  const project = event.project as Record<string, unknown>;
  if (typeof project.id !== 'string' || typeof project.name !== 'string') {
    return { success: false, error: 'project must have id and name strings' };
  }

  return {
    success: true,
    data: {
      projectId: event.projectId,
      success: event.success,
      totalDurationSeconds: event.totalDurationSeconds,
      finalMetrics: metricsResult.data!,
      project: event.project as Project,
    },
  };
}

// =============================================================================
// IngestionErrorEvent Validation
// =============================================================================

export function validateIngestionErrorEvent(data: unknown): ValidationResult<IngestionErrorEvent> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'IngestionErrorEvent must be an object' };
  }

  const event = data as Record<string, unknown>;

  // Validate projectId
  if (typeof event.projectId !== 'string' || event.projectId.length === 0) {
    return { success: false, error: 'projectId must be a non-empty string' };
  }

  // Validate phase
  if (!isValidPhase(event.phase)) {
    return { success: false, error: `Invalid phase: ${event.phase}` };
  }

  // Validate errorCode
  if (typeof event.errorCode !== 'string' || event.errorCode.length === 0) {
    return { success: false, error: 'errorCode must be a non-empty string' };
  }

  // Validate errorMessage
  if (typeof event.errorMessage !== 'string') {
    return { success: false, error: 'errorMessage must be a string' };
  }

  // Validate recoverable
  if (typeof event.recoverable !== 'boolean') {
    return { success: false, error: 'recoverable must be a boolean' };
  }

  // Validate retryCount
  if (typeof event.retryCount !== 'number' || event.retryCount < 0) {
    return { success: false, error: 'retryCount must be a non-negative number' };
  }

  return {
    success: true,
    data: {
      projectId: event.projectId,
      phase: event.phase,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      recoverable: event.recoverable,
      retryCount: event.retryCount,
    },
  };
}

// =============================================================================
// Generic WebSocket Event Validation
// =============================================================================

export function validateWebSocketEvent(
  type: string,
  data: unknown
): ValidationResult<IngestionWebSocketEvent> {
  switch (type) {
    case 'phase_started': {
      const result = validatePhaseStartedEvent(data);
      if (result.success) {
        return { success: true, data: { type: 'phase_started', data: result.data! } };
      }
      return { success: false, error: result.error };
    }

    case 'progress_update': {
      const result = validateProgressUpdateEvent(data);
      if (result.success) {
        return { success: true, data: { type: 'progress_update', data: result.data! } };
      }
      return { success: false, error: result.error };
    }

    case 'ingestion_complete': {
      const result = validateIngestionCompleteEvent(data);
      if (result.success) {
        return { success: true, data: { type: 'ingestion_complete', data: result.data! } };
      }
      return { success: false, error: result.error };
    }

    case 'error': {
      const result = validateIngestionErrorEvent(data);
      if (result.success) {
        return { success: true, data: { type: 'error', data: result.data! } };
      }
      return { success: false, error: result.error };
    }

    default:
      return { success: false, error: `Unknown event type: ${type}` };
  }
}

// =============================================================================
// Type Guards
// =============================================================================

export function isPhaseStartedEvent(event: IngestionWebSocketEvent): event is { type: 'phase_started'; data: PhaseStartedEvent } {
  return event.type === 'phase_started';
}

export function isProgressUpdateEvent(event: IngestionWebSocketEvent): event is { type: 'progress_update'; data: ProgressUpdateEvent } {
  return event.type === 'progress_update';
}

export function isIngestionCompleteEvent(event: IngestionWebSocketEvent): event is { type: 'ingestion_complete'; data: IngestionCompleteEvent } {
  return event.type === 'ingestion_complete';
}

export function isIngestionErrorEvent(event: IngestionWebSocketEvent): event is { type: 'error'; data: IngestionErrorEvent } {
  return event.type === 'error';
}
