/**
 * Retry Indicator Component
 * Sprint PC6: Shows retry progress with ability to cancel
 */

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRetryMessage, formatTimeUntilRetry } from '@/utils/retryWithBackoff';
import type { RetryIndicatorProps } from './types';

export function RetryIndicator({ state, onCancel, className }: RetryIndicatorProps) {
  const [timeUntilRetry, setTimeUntilRetry] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!state.nextRetryAt) return;

    const updateTimer = () => {
      setTimeUntilRetry(formatTimeUntilRetry(state.nextRetryAt!));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [state.nextRetryAt]);

  if (!state.isRetrying) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 rounded-lg',
        'bg-amber-500/10 border border-amber-500/20',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {formatRetryMessage(state.currentAttempt, state.maxAttempts)}
          </span>
          {state.nextRetryAt && (
            <span className="text-xs text-muted-foreground">
              {timeUntilRetry}
            </span>
          )}
          {state.lastError && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {state.lastError}
            </span>
          )}
        </div>
      </div>

      {state.canCancel && onCancel && (
        <button
          onClick={onCancel}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
            'bg-background border border-border hover:bg-muted',
            'transition-colors'
          )}
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      )}
    </div>
  );
}
