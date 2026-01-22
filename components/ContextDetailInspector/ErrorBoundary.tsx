// Error Boundary for Context Detail Inspector Modal
// Provides graceful error handling with retry functionality

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service in production
    console.error('Modal Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ModalErrorState
          error={this.state.error}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error State Component
// ============================================

interface ModalErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

function ModalErrorState({ error, onRetry }: ModalErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <h3 className="text-lg font-medium text-white mb-2">
        Something went wrong
      </h3>

      <p className="text-sm text-gray-400 mb-6 max-w-md text-center">
        {error?.message || 'An unexpected error occurred while loading this content.'}
      </p>

      <button
        onClick={onRetry}
        className={cn(
          'flex items-center gap-2 px-4 py-2',
          'bg-white/5 hover:bg-white/10',
          'border border-white/10 hover:border-white/20',
          'text-white rounded-lg',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        )}
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>

      {error && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 w-full max-w-md">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Error details (dev only)
          </summary>
          <pre className="mt-2 p-3 bg-slate-800 rounded text-xs text-red-400 overflow-auto">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

export default ModalErrorBoundary;
