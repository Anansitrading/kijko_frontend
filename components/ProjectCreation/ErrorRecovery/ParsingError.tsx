/**
 * Parsing Error Component
 * Sprint PC6: Handle file parsing failures gracefully
 */

import React, { useState } from 'react';
import { AlertTriangle, FileX, ChevronDown, ChevronUp, Upload, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { RetryIndicator } from './RetryIndicator';
import type { ParsingErrorProps } from './types';

export function ParsingError({
  error,
  failedFiles,
  onExcludeFiles,
  onRetryWithMemory,
  onManualUpload,
  onRetry,
  onCancel,
  retryState,
  className
}: ParsingErrorProps) {
  const [showFailedFiles, setShowFailedFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(failedFiles));

  const toggleFile = (file: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(file)) {
      newSelected.delete(file);
    } else {
      newSelected.add(file);
    }
    setSelectedFiles(newSelected);
  };

  const handleExcludeSelected = () => {
    onExcludeFiles(Array.from(selectedFiles));
  };

  const selectAll = () => {
    setSelectedFiles(new Set(failedFiles));
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-500/30 bg-amber-500/5',
        'p-4 space-y-4',
        className
      )}
    >
      {/* Error Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{error.errorMessage}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {failedFiles.length} file{failedFiles.length !== 1 ? 's' : ''} could not be parsed.
            This may be due to unsupported formats, encoding issues, or file corruption.
          </p>
        </div>
      </div>

      {/* Retry Indicator */}
      {retryState?.isRetrying && (
        <RetryIndicator state={retryState} onCancel={onCancel} />
      )}

      {/* Failed Files List (Collapsible) */}
      {failedFiles.length > 0 && !retryState?.isRetrying && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowFailedFiles(!showFailedFiles)}
            className={cn(
              'w-full flex items-center gap-3 p-3',
              'hover:bg-muted/50 transition-colors text-left'
            )}
          >
            <FileX className="w-4 h-4 text-amber-500" />
            <span className="flex-1 text-sm font-medium">
              Failed files ({failedFiles.length})
            </span>
            {showFailedFiles ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showFailedFiles && (
            <div className="border-t border-border bg-muted/30">
              {/* Selection controls */}
              <div className="flex items-center gap-2 p-2 border-b border-border">
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-primary hover:underline"
                >
                  Select none
                </button>
                <span className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {selectedFiles.size} selected
                </span>
              </div>

              {/* File list */}
              <div className="max-h-48 overflow-y-auto">
                {failedFiles.map((file) => (
                  <label
                    key={file}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer',
                      'hover:bg-muted/50 transition-colors',
                      'border-b border-border last:border-b-0'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file)}
                      onChange={() => toggleFile(file)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground truncate font-mono">
                      {file}
                    </span>
                  </label>
                ))}
              </div>

              {/* Exclude button */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={handleExcludeSelected}
                  disabled={selectedFiles.size === 0}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  Exclude {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} and continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recovery Options */}
      {!retryState?.isRetrying && (
        <div className="grid gap-2">
          {/* Option 1: Retry with more memory */}
          <button
            onClick={onRetryWithMemory}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-border',
              'hover:bg-muted/50 transition-colors text-left'
            )}
          >
            <div className="p-1.5 rounded-md bg-purple-500/10">
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">Retry with more memory</span>
              <p className="text-xs text-muted-foreground">
                Allocate additional resources for processing large files
              </p>
            </div>
          </button>

          {/* Option 2: Manual upload */}
          <button
            onClick={onManualUpload}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-border',
              'hover:bg-muted/50 transition-colors text-left'
            )}
          >
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <Upload className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">Use manual upload</span>
              <p className="text-xs text-muted-foreground">
                Upload files directly with custom preprocessing
              </p>
            </div>
          </button>
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
