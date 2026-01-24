/**
 * Error Recovery Types
 * Sprint PC6: Types for error recovery components
 */

import type { RecoveryAction, RecoveryOption, ErrorRecovery, RetryState } from '@/types/project';

export interface RecoveryHandler {
  onRetryBranch: (branch: string) => void;
  onSwitchToUpload: () => void;
  onChangeRepo: () => void;
  onExcludeFiles: (files: string[]) => void;
  onRetryWithMemory: () => void;
  onManualUpload: () => void;
  onSwitchChunking: (strategy: string) => void;
  onApplyFilters: () => void;
  onContactSupport: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export interface ErrorRecoveryProps {
  error: ErrorRecovery;
  retryState?: RetryState;
  handlers: Partial<RecoveryHandler>;
  className?: string;
}

export interface RepositoryFetchErrorProps {
  error: ErrorRecovery;
  branches?: string[];
  onRetryBranch: (branch: string) => void;
  onSwitchToUpload: () => void;
  onChangeRepo: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  retryState?: RetryState;
  className?: string;
}

export interface ParsingErrorProps {
  error: ErrorRecovery;
  failedFiles: string[];
  onExcludeFiles: (files: string[]) => void;
  onRetryWithMemory: () => void;
  onManualUpload: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  retryState?: RetryState;
  className?: string;
}

export interface ChunkingErrorProps {
  error: ErrorRecovery;
  onSwitchChunking: (strategy: string) => void;
  onApplyFilters: () => void;
  onContactSupport: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  retryState?: RetryState;
  className?: string;
}

export interface RetryIndicatorProps {
  state: RetryState;
  onCancel?: () => void;
  className?: string;
}
