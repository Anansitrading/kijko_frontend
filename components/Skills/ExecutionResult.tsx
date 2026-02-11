/**
 * ExecutionResult Component
 * Displays skill execution output with metadata
 */

import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  Copy,
  Check,
  FileText,
  Code,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { SkillOutputFormat, ExecutionStatus } from '../../types/skills';
import { cn } from '../../utils/cn';
import DOMPurify from 'dompurify';

interface ExecutionResultProps {
  status: ExecutionStatus;
  output?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  durationMs?: number;
  costCents?: number;
  outputFormat?: SkillOutputFormat;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export function ExecutionResult({
  status,
  output,
  error,
  usage,
  durationMs,
  costCents,
  outputFormat = 'markdown',
  isStreaming = false,
  onRetry,
}: ExecutionResultProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  if (status === 'pending' || status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground mt-4">
          {isStreaming ? 'Generating response...' : 'Processing...'}
        </p>
        {isStreaming && output && (
          <p className="text-xs text-muted-foreground mt-2">
            {output.length} characters received
          </p>
        )}
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Execution Failed</p>
            <p className="text-sm text-destructive/80 mt-1">
              {error || 'An unknown error occurred during execution.'}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-muted border border-border rounded-lg text-sm font-medium text-foreground transition-colors"
          >
            <RefreshCw size={16} />
            Retry Execution
          </button>
        )}

        {durationMs && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>Failed after {formatDuration(durationMs)}</span>
          </div>
        )}
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
        <XCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Execution Cancelled</p>
          <p className="text-sm text-muted-foreground mt-1">
            The execution was cancelled before completion.
          </p>
        </div>
      </div>
    );
  }

  // Completed status
  return (
    <div className="space-y-4">
      {/* Success header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={18} />
          <span className="font-medium">Execution Complete</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle raw view for markdown */}
          {outputFormat === 'markdown' && output && (
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              {showRaw ? <FileText size={14} /> : <Code size={14} />}
              {showRaw ? 'Rendered' : 'Raw'}
            </button>
          )}

          {/* Copy button */}
          {output && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Metadata stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {durationMs !== undefined && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{formatDuration(durationMs)}</span>
          </div>
        )}

        {usage && (
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            <span>{usage.totalTokens.toLocaleString()} tokens</span>
            <span className="text-muted-foreground/50">
              ({usage.inputTokens.toLocaleString()} in / {usage.outputTokens.toLocaleString()} out)
            </span>
          </div>
        )}

        {costCents !== undefined && costCents > 0 && (
          <div className="flex items-center gap-1.5">
            <Coins size={12} />
            <span>{formatCost(costCents)}</span>
          </div>
        )}
      </div>

      {/* Output content */}
      {output && (
        <div className="border border-border rounded-lg overflow-hidden">
          <OutputContent
            content={output}
            format={outputFormat}
            showRaw={showRaw}
          />
        </div>
      )}
    </div>
  );
}

interface OutputContentProps {
  content: string;
  format: SkillOutputFormat;
  showRaw: boolean;
}

function OutputContent({ content, format, showRaw }: OutputContentProps) {
  const [expanded, setExpanded] = useState(true);
  const isLongContent = content.length > 2000;

  const displayContent = isLongContent && !expanded
    ? content.substring(0, 2000)
    : content;

  const renderContent = () => {
    if (showRaw || format === 'text') {
      return (
        <pre className="p-4 bg-[#1a1f26] text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          {displayContent}
        </pre>
      );
    }

    switch (format) {
      case 'markdown':
        return (
          <div className="p-4 bg-card">
            <MarkdownRenderer content={displayContent} />
          </div>
        );

      case 'json':
        try {
          const formatted = JSON.stringify(JSON.parse(content), null, 2);
          return (
            <pre className="p-4 bg-[#1a1f26] text-sm font-mono text-foreground overflow-x-auto">
              {formatted}
            </pre>
          );
        } catch {
          return (
            <pre className="p-4 bg-[#1a1f26] text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
              {displayContent}
            </pre>
          );
        }

      case 'code':
        return (
          <pre className="p-4 bg-[#1a1f26] text-sm font-mono text-foreground overflow-x-auto">
            <code>{displayContent}</code>
          </pre>
        );

      case 'html':
        return (
          <div className="p-4 bg-card">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayContent) }}
            />
          </div>
        );

      default:
        return (
          <div className="p-4 bg-card">
            <MarkdownRenderer content={displayContent} />
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}

      {isLongContent && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Show full output ({(content.length / 1000).toFixed(1)}k chars)
            </>
          )}
        </button>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function formatCost(cents: number): string {
  if (cents < 1) {
    return '<$0.01';
  }
  if (cents < 100) {
    return `$${(cents / 100).toFixed(2)}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

export default ExecutionResult;
