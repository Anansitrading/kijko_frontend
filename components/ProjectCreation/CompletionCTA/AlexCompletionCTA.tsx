/**
 * Alex Persona Completion CTA
 * Sprint PC6: Cost-focused completion screen for solo developers
 */

import React from 'react';
import { CheckCircle2, Copy, Eye, Share2, Zap, FolderGit2, Briefcase, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { trackConversionSignal } from '@/services/analytics';
import type { AlexCompletionMetrics, AlexQuickWin } from '@/types/project';

interface AlexCompletionCTAProps {
  projectId: string;
  projectName: string;
  metrics: AlexCompletionMetrics;
  quickWins?: AlexQuickWin[];
  onCopyToCursor: () => void;
  onView: () => void;
  onShare: () => void;
  onQuickWinClick?: (win: AlexQuickWin) => void;
  className?: string;
}

// Default quick wins
const DEFAULT_QUICK_WINS: AlexQuickWin[] = [
  {
    id: 'largest-repo',
    label: 'Your largest repo',
    description: 'Process your biggest project',
    potentialSavings: 'Save 40% more',
    action: 'process_largest'
  },
  {
    id: 'work-projects',
    label: 'Team/work projects',
    description: 'Demonstrate ROI to your team',
    potentialSavings: 'Show team value',
    action: 'add_work_project'
  }
];

export function AlexCompletionCTA({
  projectId,
  projectName,
  metrics,
  quickWins = DEFAULT_QUICK_WINS,
  onCopyToCursor,
  onView,
  onShare,
  onQuickWinClick,
  className
}: AlexCompletionCTAProps) {
  const formatCost = (cost: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cost);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toLocaleString();
  };

  const handleCopyToCursor = () => {
    trackConversionSignal('copy_to_cursor', { project_id: projectId });
    onCopyToCursor();
  };

  const handleView = () => {
    trackConversionSignal('view_project', { project_id: projectId });
    onView();
  };

  const handleShare = () => {
    trackConversionSignal('share_project', { project_id: projectId });
    onShare();
  };

  const handleQuickWin = (win: AlexQuickWin) => {
    trackConversionSignal('process_more_repos', {
      project_id: projectId,
      quick_win: win.id
    });
    onQuickWinClick?.(win);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-background',
        'p-6 space-y-6',
        className
      )}
    >
      {/* Success Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-emerald-500/10">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            Project ready!
          </h2>
          <p className="text-muted-foreground mt-1">
            {projectName} has been processed and is ready to use.
          </p>
        </div>
      </div>

      {/* Cost Savings Highlight */}
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Savings
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          You saved {formatTokens(metrics.tokensSaved)} tokens
        </p>
        <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">
          ({formatCost(metrics.costSaved, metrics.currency)} in API costs)
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Processed in {metrics.processingTimeSeconds}s
        </p>
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopyToCursor}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          <Copy className="w-4 h-4" />
          Copy to Cursor
        </button>
        <button
          onClick={handleView}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-muted text-foreground font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <button
          onClick={handleShare}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-muted text-foreground font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Quick Wins Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Quick wins
        </h3>
        <div className="space-y-2">
          {quickWins.map((win) => (
            <button
              key={win.id}
              onClick={() => handleQuickWin(win)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'border border-border hover:border-primary/30',
                'hover:bg-muted/50 transition-all text-left group'
              )}
            >
              <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                {win.id === 'largest-repo' ? (
                  <FolderGit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                ) : (
                  <Briefcase className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {win.label}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {win.potentialSavings}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {win.description}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade prompt */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => trackConversionSignal('upgrade_plan', { project_id: projectId })}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'px-4 py-2 rounded-md text-sm',
            'text-primary hover:bg-primary/5 transition-colors'
          )}
        >
          Process 3 more repos free with Pro
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
