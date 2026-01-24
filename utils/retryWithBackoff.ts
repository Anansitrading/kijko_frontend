/**
 * Retry Logic with Exponential Backoff
 * Sprint PC6: Automatic retry for transient failures
 */

import type { RetryState, IngestionPhase } from '@/types/project';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, delay: number, error?: Error) => void;
  onMaxRetriesExceeded?: (error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
  abortSignal?: AbortSignal;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Default retry configuration by error type/phase
 */
export const RETRY_CONFIGS: Record<IngestionPhase, Partial<RetryOptions>> = {
  repository_fetch: {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 16000
  },
  parsing: {
    maxRetries: 2,
    baseDelayMs: 3000,
    maxDelayMs: 12000
  },
  chunking: {
    maxRetries: 2,
    baseDelayMs: 2000,
    maxDelayMs: 8000
  },
  optimization: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 8000
  },
  indexing: {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 16000
  }
};

/**
 * Non-retryable error codes
 */
const NON_RETRYABLE_ERRORS = [
  'AUTH_FAILED',
  'PERMISSION_DENIED',
  'INVALID_CREDENTIALS',
  'REPO_NOT_FOUND',
  'BRANCH_NOT_FOUND',
  'INVALID_FORMAT',
  'QUOTA_EXCEEDED',
  'RATE_LIMITED' // Rate limits should use different strategy
];

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const errorCode = (error as Error & { code?: string }).code;
  if (errorCode && NON_RETRYABLE_ERRORS.includes(errorCode)) {
    return false;
  }

  // Network errors are retryable
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }

  // 5xx errors are retryable
  if (error.message.includes('500') || error.message.includes('502') ||
      error.message.includes('503') || error.message.includes('504')) {
    return true;
  }

  return true; // Default to retryable for unknown errors
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = 2000,
  maxDelayMs: number = 16000
): number {
  // Exponential backoff: 2^attempt * baseDelay
  const exponentialDelay = Math.pow(2, attempt - 1) * baseDelayMs;

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±10%) to prevent thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep utility that can be cancelled
 */
export function sleep(ms: number, abortSignal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (abortSignal) {
      if (abortSignal.aborted) {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 2000,
    maxDelayMs = 16000,
    onRetry,
    onMaxRetriesExceeded,
    shouldRetry = isRetryableError,
    abortSignal
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if aborted
      if (abortSignal?.aborted) {
        throw new DOMException('Retry cancelled', 'AbortError');
      }

      const data = await fn();

      return {
        success: true,
        data,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should stop retrying
      if (!shouldRetry(lastError)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime
        };
      }

      // Check if this was the last attempt
      if (attempt === maxRetries) {
        onMaxRetriesExceeded?.(lastError);
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);

      // Notify retry callback
      onRetry?.(attempt, delay, lastError);

      // Wait before retrying
      try {
        await sleep(delay, abortSignal);
      } catch (abortError) {
        if ((abortError as Error).name === 'AbortError') {
          return {
            success: false,
            error: new Error('Retry cancelled by user'),
            attempts: attempt,
            totalTimeMs: Date.now() - startTime
          };
        }
        throw abortError;
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Max retries exceeded'),
    attempts: maxRetries,
    totalTimeMs: Date.now() - startTime
  };
}

/**
 * Create a retry state object for UI
 */
export function createRetryState(
  maxAttempts: number = 3,
  currentAttempt: number = 0
): RetryState {
  return {
    isRetrying: false,
    currentAttempt,
    maxAttempts,
    canCancel: true
  };
}

/**
 * Update retry state during retry
 */
export function updateRetryState(
  state: RetryState,
  attempt: number,
  nextRetryAt?: Date,
  error?: string
): RetryState {
  return {
    ...state,
    isRetrying: true,
    currentAttempt: attempt,
    nextRetryAt,
    lastError: error
  };
}

/**
 * Format retry message for UI
 */
export function formatRetryMessage(attempt: number, maxAttempts: number): string {
  return `Retrying (attempt ${attempt}/${maxAttempts})...`;
}

/**
 * Format time until next retry
 */
export function formatTimeUntilRetry(nextRetryAt: Date): string {
  const seconds = Math.max(0, Math.ceil((nextRetryAt.getTime() - Date.now()) / 1000));
  return `Retrying in ${seconds}s`;
}

/**
 * Higher-order function to wrap an async function with retry logic
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
  return async (...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args) as Promise<Awaited<ReturnType<T>>>, options);
  };
}

/**
 * Get retry configuration for a specific phase
 */
export function getRetryConfig(phase: IngestionPhase): RetryOptions {
  return RETRY_CONFIGS[phase] || { maxRetries: 3, baseDelayMs: 2000, maxDelayMs: 16000 };
}
