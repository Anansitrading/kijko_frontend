/**
 * Error Recovery Panel Component
 * Sprint PC6: Unified error recovery panel that routes to specific error handlers
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { RepositoryFetchError } from './RepositoryFetchError';
import { ParsingError } from './ParsingError';
import { ChunkingError } from './ChunkingError';
import type { ErrorRecoveryProps } from './types';

export function ErrorRecoveryPanel({
  error,
  retryState,
  handlers,
  className
}: ErrorRecoveryProps) {
  const {
    onRetryBranch = () => {},
    onSwitchToUpload = () => {},
    onChangeRepo = () => {},
    onExcludeFiles = () => {},
    onRetryWithMemory = () => {},
    onManualUpload = () => {},
    onSwitchChunking = () => {},
    onApplyFilters = () => {},
    onContactSupport = () => {},
    onRetry = () => {},
    onCancel = () => {}
  } = handlers;

  // Route to the appropriate error component based on phase
  switch (error.phase) {
    case 'repository_fetch':
      return (
        <RepositoryFetchError
          error={error}
          onRetryBranch={onRetryBranch}
          onSwitchToUpload={onSwitchToUpload}
          onChangeRepo={onChangeRepo}
          onRetry={onRetry}
          onCancel={onCancel}
          retryState={retryState}
          className={className}
        />
      );

    case 'parsing':
      return (
        <ParsingError
          error={error}
          failedFiles={error.failedItems || []}
          onExcludeFiles={onExcludeFiles}
          onRetryWithMemory={onRetryWithMemory}
          onManualUpload={onManualUpload}
          onRetry={onRetry}
          onCancel={onCancel}
          retryState={retryState}
          className={className}
        />
      );

    case 'chunking':
      return (
        <ChunkingError
          error={error}
          onSwitchChunking={onSwitchChunking}
          onApplyFilters={onApplyFilters}
          onContactSupport={onContactSupport}
          onRetry={onRetry}
          onCancel={onCancel}
          retryState={retryState}
          className={className}
        />
      );

    default:
      // Generic error fallback
      return (
        <div
          className={cn(
            'rounded-lg border border-destructive/30 bg-destructive/5',
            'p-4 space-y-3',
            className
          )}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <svg
                className="w-5 h-5 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{error.errorMessage}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred during {error.phase.replace('_', ' ')}.
              </p>
            </div>
          </div>

          {error.canRetry && error.retryCount < error.maxRetries && (
            <button
              onClick={onRetry}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'px-4 py-2 rounded-md',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          )}
        </div>
      );
  }
}
