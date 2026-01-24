/**
 * Repository Fetch Error Component
 * Sprint PC6: Handle repository cloning/access failures
 */

import React, { useState } from 'react';
import { AlertCircle, GitBranch, Upload, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { RetryIndicator } from './RetryIndicator';
import type { RepositoryFetchErrorProps } from './types';

export function RepositoryFetchError({
  error,
  branches = [],
  onRetryBranch,
  onSwitchToUpload,
  onChangeRepo,
  onRetry,
  onCancel,
  retryState,
  className
}: RepositoryFetchErrorProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  const handleBranchRetry = () => {
    if (selectedBranch) {
      onRetryBranch(selectedBranch);
    }
  };

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
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{error.errorMessage}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn't access the repository. This could be due to permissions,
            network issues, or the repository not existing.
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
            {/* Option 1: Try different branch */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowBranchSelector(!showBranchSelector)}
                className={cn(
                  'w-full flex items-center gap-3 p-3',
                  'hover:bg-muted/50 transition-colors text-left'
                )}
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <GitBranch className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">Use alternate branch</span>
                  <p className="text-xs text-muted-foreground">
                    Try accessing a different branch of the repository
                  </p>
                </div>
                <ArrowRight className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  showBranchSelector && 'rotate-90'
                )} />
              </button>

              {showBranchSelector && (
                <div className="p-3 pt-0 space-y-2 border-t border-border bg-muted/30">
                  {branches.length > 0 ? (
                    <>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className={cn(
                          'w-full p-2 rounded-md border border-border bg-background',
                          'text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                      >
                        <option value="">Select a branch...</option>
                        {branches.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBranchRetry}
                        disabled={!selectedBranch}
                        className={cn(
                          'w-full px-3 py-2 rounded-md text-sm font-medium',
                          'bg-primary text-primary-foreground',
                          'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
                          'transition-colors'
                        )}
                      >
                        Retry with {selectedBranch || 'selected branch'}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        placeholder="Enter branch name (e.g., develop, staging)"
                        className={cn(
                          'w-full p-2 rounded-md border border-border bg-background',
                          'text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                      />
                      <button
                        onClick={handleBranchRetry}
                        disabled={!selectedBranch}
                        className={cn(
                          'w-full px-3 py-2 rounded-md text-sm font-medium',
                          'bg-primary text-primary-foreground',
                          'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
                          'transition-colors'
                        )}
                      >
                        Retry with this branch
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Option 2: Upload as ZIP */}
            <button
              onClick={onSwitchToUpload}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <Upload className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Upload as ZIP instead</span>
                <p className="text-xs text-muted-foreground">
                  Download your code and upload it directly
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Option 3: Try different repo */}
            <button
              onClick={onChangeRepo}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Try different repo</span>
                <p className="text-xs text-muted-foreground">
                  Enter a different repository URL
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
    </div>
  );
}
