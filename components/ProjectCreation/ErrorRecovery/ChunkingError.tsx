/**
 * Chunking Error Component
 * Sprint PC6: Handle chunking strategy failures
 */

import React from 'react';
import { AlertOctagon, Layers, Filter, Headphones, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { RetryIndicator } from './RetryIndicator';
import type { ChunkingErrorProps } from './types';

export function ChunkingError({
  error,
  onSwitchChunking,
  onApplyFilters,
  onContactSupport,
  onRetry,
  onCancel,
  retryState,
  className
}: ChunkingErrorProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/30 bg-destructive/5',
        'p-4 space-y-4',
        className
      )}
    >
      {/* Error Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertOctagon className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{error.errorMessage}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            The selected chunking strategy couldn't process your code.
            This is usually due to code complexity or incompatible patterns.
          </p>
        </div>
      </div>

      {/* Retry Indicator */}
      {retryState?.isRetrying && (
        <RetryIndicator state={retryState} onCancel={onCancel} />
      )}

      {/* Recovery Options */}
      {!retryState?.isRetrying && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Choose a recovery option:
          </p>

          <div className="grid gap-2">
            {/* Option 1: Switch to fixed-size chunks */}
            <button
              onClick={() => onSwitchChunking('fixed')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Switch to fixed-size chunks</span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use simpler, more reliable chunking at 1000 tokens per chunk
                </p>
              </div>
            </button>

            {/* Option 2: Apply aggressive filtering */}
            <button
              onClick={onApplyFilters}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <Filter className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Retry with aggressive filtering</span>
                <p className="text-xs text-muted-foreground">
                  Exclude minified files, generated code, and lock files
                </p>
              </div>
            </button>

            {/* Option 3: Contact support */}
            <button
              onClick={onContactSupport}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Headphones className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Contact support</span>
                <p className="text-xs text-muted-foreground">
                  Get help from our team to resolve this issue
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Manual Retry */}
      {!retryState?.isRetrying && onRetry && error.canRetry && error.retryCount < error.maxRetries && (
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Retry attempts: {error.retryCount}/{error.maxRetries}
          </span>
          <button
            onClick={onRetry}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
              'bg-muted hover:bg-muted/80 transition-colors'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Now
          </button>
        </div>
      )}

      {/* Progress preserved message */}
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Previous progress has been preserved. Switching strategies won't lose already-processed data.
      </div>
    </div>
  );
}
