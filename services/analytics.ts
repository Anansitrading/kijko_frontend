/**
 * Analytics Event Tracking Service
 * Sprint PC6: Track key funnel events for optimization
 */

import type {
  AnalyticsEventType,
  AnalyticsEvent,
  PersonaType,
  ConversionAction,
  IngestionPhase,
  ProjectCreationStep
} from '@/types/project';

// Session ID for tracking
let sessionId: string | null = null;

// Current persona (cached)
let currentPersona: PersonaType | null = null;

// Event queue for batching (fire-and-forget)
const eventQueue: AnalyticsEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Configuration
const ANALYTICS_CONFIG = {
  endpoint: '/api/analytics/events', // Backend endpoint
  batchSize: 10,
  flushIntervalMs: 5000,
  enabled: true
};

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (!sessionId) {
    try {
      sessionId = sessionStorage.getItem('kijko_analytics_session');
      if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('kijko_analytics_session', sessionId);
      }
    } catch {
      sessionId = generateSessionId();
    }
  }
  return sessionId;
}

/**
 * Set the current persona for tracking
 */
export function setAnalyticsPersona(persona: PersonaType): void {
  currentPersona = persona;
}

/**
 * Get the current persona
 */
export function getAnalyticsPersona(): PersonaType | null {
  return currentPersona;
}

/**
 * Flush event queue to backend (fire-and-forget)
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0;

  if (!ANALYTICS_CONFIG.enabled) {
    // Development mode - just log
    console.debug('[Analytics] Events:', events);
    return;
  }

  try {
    // Fire and forget - don't await
    fetch(ANALYTICS_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true // Ensure request completes even on page unload
    }).catch(() => {
      // Silently fail - analytics should never block user
    });
  } catch {
    // Silently fail
  }
}

/**
 * Schedule a flush
 */
function scheduleFlush(): void {
  if (flushTimeout) return;

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, ANALYTICS_CONFIG.flushIntervalMs);
}

/**
 * Core tracking function
 */
export function track(
  type: AnalyticsEventType,
  properties: Record<string, unknown> = {}
): void {
  const event: AnalyticsEvent = {
    type,
    timestamp: new Date(),
    persona: currentPersona,
    sessionId: getSessionId(),
    properties
  };

  eventQueue.push(event);

  // Flush immediately if batch size reached
  if (eventQueue.length >= ANALYTICS_CONFIG.batchSize) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

/**
 * Track project creation started
 */
export function trackProjectCreationStarted(projectType: string): void {
  track('project_creation_started', {
    project_type: projectType
  });
}

/**
 * Track step completed with timing
 */
export function trackStepCompleted(
  step: ProjectCreationStep | number | string,
  timeToCompleteSeconds: number
): void {
  track('project_step_completed', {
    step,
    time_to_complete: timeToCompleteSeconds
  });
}

/**
 * Track ingestion started
 */
export function trackIngestionStarted(projectId: string, repoCount: number): void {
  track('ingestion_started', {
    project_id: projectId,
    repo_count: repoCount
  });
}

/**
 * Track ingestion phase completed
 */
export function trackIngestionPhaseCompleted(
  projectId: string,
  phase: IngestionPhase,
  durationSeconds: number,
  metrics?: Record<string, unknown>
): void {
  track('ingestion_phase_completed', {
    project_id: projectId,
    phase,
    duration: durationSeconds,
    ...metrics
  });
}

/**
 * Track ingestion completed
 */
export function trackIngestionCompleted(
  projectId: string,
  totalDurationSeconds: number,
  metrics: {
    filesProcessed: number;
    tokensProcessed: number;
    chunksCreated: number;
    compressionRatio: number;
  }
): void {
  track('ingestion_completed', {
    project_id: projectId,
    total_duration: totalDurationSeconds,
    ...metrics
  });
}

/**
 * Track conversion signal (CTA clicks)
 */
export function trackConversionSignal(action: ConversionAction, context?: Record<string, unknown>): void {
  track('conversion_signal', {
    action,
    ...context
  });
}

/**
 * Track error occurred
 */
export function trackErrorOccurred(
  phase: IngestionPhase,
  errorCode: string,
  errorMessage: string,
  recoverable: boolean
): void {
  track('error_occurred', {
    phase,
    error_code: errorCode,
    error_message: errorMessage,
    recoverable
  });
}

/**
 * Track error recovered
 */
export function trackErrorRecovered(
  phase: IngestionPhase,
  recoveryAction: string,
  retryCount: number
): void {
  track('error_recovered', {
    phase,
    recovery_action: recoveryAction,
    retry_count: retryCount
  });
}

/**
 * Track persona detected
 */
export function trackPersonaDetected(
  persona: PersonaType,
  confidence: 'high' | 'medium' | 'low',
  signals: Record<string, unknown>
): void {
  setAnalyticsPersona(persona);
  track('persona_detected', {
    persona,
    confidence,
    signals
  });
}

/**
 * Track persona override
 */
export function trackPersonaOverride(fromPersona: PersonaType | null, toPersona: PersonaType): void {
  track('persona_override', {
    from_persona: fromPersona,
    to_persona: toPersona
  });
  setAnalyticsPersona(toPersona);
}

/**
 * Create a step timer for tracking time on each step
 */
export function createStepTimer(): {
  start: () => void;
  stop: () => number;
  getElapsed: () => number;
} {
  let startTime: number | null = null;

  return {
    start: () => {
      startTime = Date.now();
    },
    stop: () => {
      if (!startTime) return 0;
      const elapsed = (Date.now() - startTime) / 1000;
      startTime = null;
      return elapsed;
    },
    getElapsed: () => {
      if (!startTime) return 0;
      return (Date.now() - startTime) / 1000;
    }
  };
}

/**
 * Flush all pending events (call on page unload)
 */
export function flushPendingEvents(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  flushEvents();
}

/**
 * Set up page unload handler
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingEvents);
  window.addEventListener('pagehide', flushPendingEvents);
}

/**
 * Analytics hook for React components
 */
export function useAnalytics() {
  return {
    track,
    trackProjectCreationStarted,
    trackStepCompleted,
    trackIngestionStarted,
    trackIngestionPhaseCompleted,
    trackIngestionCompleted,
    trackConversionSignal,
    trackErrorOccurred,
    trackErrorRecovered,
    trackPersonaDetected,
    trackPersonaOverride,
    createStepTimer,
    setPersona: setAnalyticsPersona
  };
}

export default {
  track,
  trackProjectCreationStarted,
  trackStepCompleted,
  trackIngestionStarted,
  trackIngestionPhaseCompleted,
  trackIngestionCompleted,
  trackConversionSignal,
  trackErrorOccurred,
  trackErrorRecovered,
  trackPersonaDetected,
  trackPersonaOverride,
  setPersona: setAnalyticsPersona,
  flushPendingEvents
};
