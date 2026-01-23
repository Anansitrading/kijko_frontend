// Generic Error Boundary Component
// Provides graceful error handling with retry functionality

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../utils/cn';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  /** Optional name to identify the section for error logging */
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const sectionName = this.props.sectionName || 'Unknown section';
    console.error(`Error Boundary [${sectionName}] caught an error:`, error, errorInfo);
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
        <ErrorState
          error={this.state.error}
          onRetry={this.handleReset}
          sectionName={this.props.sectionName}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error State Component
// ============================================

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  sectionName?: string;
  showHomeLink?: boolean;
}

export function ErrorState({ error, onRetry, sectionName, showHomeLink = true }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-[#0a0e1a]">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <h3 className="text-lg font-medium text-white mb-2">
        {sectionName ? `Error in ${sectionName}` : 'Something went wrong'}
      </h3>

      <p className="text-sm text-gray-400 mb-6 max-w-md text-center">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'bg-blue-600 hover:bg-blue-500',
            'text-white rounded-lg',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>

        {showHomeLink && (
          <a
            href="/"
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'bg-white/5 hover:bg-white/10',
              'border border-white/10 hover:border-white/20',
              'text-white rounded-lg',
              'transition-colors duration-150'
            )}
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
        )}
      </div>

      {error && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 w-full max-w-md">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Error details (dev only)
          </summary>
          <pre className="mt-2 p-3 bg-slate-800 rounded text-xs text-red-400 overflow-auto max-h-48">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// ============================================
// Panel Error Boundary (compact version)
// ============================================

interface PanelErrorBoundaryProps {
  children: ReactNode;
  panelName: string;
}

interface PanelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends Component<PanelErrorBoundaryProps, PanelErrorBoundaryState> {
  constructor(props: PanelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PanelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`Panel Error [${this.props.panelName}]:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-xs text-gray-400 mb-3">
            Error loading {this.props.panelName}
          </p>
          <button
            onClick={this.handleReset}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
