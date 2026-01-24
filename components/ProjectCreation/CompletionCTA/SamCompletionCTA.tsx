/**
 * Sam Persona Completion CTA
 * Sprint PC6: Technical-focused completion screen for API users
 */

import React from 'react';
import { CheckCircle2, BookOpen, Play, Key, Webhook, Github, Sparkles, Layers, Timer, Target, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { trackConversionSignal } from '@/services/analytics';
import type { SamCompletionMetrics, SamAdvancedOption } from '@/types/project';

interface SamCompletionCTAProps {
  projectId: string;
  projectName: string;
  metrics: SamCompletionMetrics;
  advancedOptions?: SamAdvancedOption[];
  onApiDocs: () => void;
  onQueryNow: () => void;
  onGetApiKey: () => void;
  onAdvancedOptionClick?: (option: SamAdvancedOption) => void;
  className?: string;
}

// Default advanced options
const DEFAULT_ADVANCED_OPTIONS: SamAdvancedOption[] = [
  {
    id: 'custom-chunking',
    label: 'Custom chunking webhook',
    description: 'Bring your own chunking logic',
    isNew: true,
    action: 'setup_webhook'
  },
  {
    id: 'github-integration',
    label: 'GitHub integration',
    description: 'Auto-sync on push events',
    action: 'setup_github'
  }
];

export function SamCompletionCTA({
  projectId,
  projectName,
  metrics,
  advancedOptions = DEFAULT_ADVANCED_OPTIONS,
  onApiDocs,
  onQueryNow,
  onGetApiKey,
  onAdvancedOptionClick,
  className
}: SamCompletionCTAProps) {
  const handleApiDocs = () => {
    trackConversionSignal('api_docs', { project_id: projectId });
    onApiDocs();
  };

  const handleQueryNow = () => {
    trackConversionSignal('query_now', { project_id: projectId });
    onQueryNow();
  };

  const handleGetApiKey = () => {
    trackConversionSignal('api_key', { project_id: projectId });
    onGetApiKey();
  };

  const handleAdvancedOption = (option: SamAdvancedOption) => {
    trackConversionSignal('setup_webhook', {
      project_id: projectId,
      option: option.id
    });
    onAdvancedOptionClick?.(option);
  };

  const getOptionIcon = (option: SamAdvancedOption) => {
    switch (option.action) {
      case 'setup_webhook':
        return <Webhook className="w-4 h-4" />;
      case 'setup_github':
        return <Github className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-background',
        'p-6 space-y-6',
        className
      )}
    >
      {/* Success Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-purple-500/10">
          <CheckCircle2 className="w-8 h-8 text-purple-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            Context map ready!
          </h2>
          <p className="text-muted-foreground mt-1">
            {projectName} is indexed and ready for queries.
          </p>
        </div>
      </div>

      {/* Technical Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Token Reduction */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-medium">Token reduction</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {metrics.tokenReductionPercent.toFixed(1)}%
          </p>
        </div>

        {/* Query Latency */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-medium">Query latency</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {metrics.queryLatencyMs}ms
          </p>
          <p className="text-xs text-muted-foreground">p95</p>
        </div>

        {/* Relevance */}
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Relevance</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {metrics.relevancePercent}%
          </p>
        </div>
      </div>

      {/* Additional Metric */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Chunks created</span>
        </div>
        <span className="text-sm font-mono font-medium text-foreground">
          {metrics.chunksCreated.toLocaleString()}
        </span>
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleApiDocs}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          <BookOpen className="w-4 h-4" />
          API docs
        </button>
        <button
          onClick={handleQueryNow}
          className={cn(
            'flex-1 min-w-[120px] flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-purple-600 text-white font-medium',
            'hover:bg-purple-700 transition-colors'
          )}
        >
          <Play className="w-4 h-4" />
          Query now
        </button>
        <button
          onClick={handleGetApiKey}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-muted text-foreground font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <Key className="w-4 h-4" />
          API key
        </button>
      </div>

      {/* Advanced Setup Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Advanced setup
        </h3>
        <div className="grid gap-2">
          {advancedOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAdvancedOption(option)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'border border-border hover:border-primary/30',
                'hover:bg-muted/50 transition-all text-left group'
              )}
            >
              <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                {getOptionIcon(option)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  {option.isNew && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {option.description}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Code Snippet Preview */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Quick start</h4>
        <div className="p-3 rounded-lg bg-zinc-900 dark:bg-zinc-950 font-mono text-xs overflow-x-auto">
          <pre className="text-zinc-300">
            <span className="text-purple-400">curl</span>{' '}
            <span className="text-emerald-400">-X POST</span>{' '}
            <span className="text-zinc-400">\</span>{'\n'}
            {'  '}<span className="text-zinc-400">-H</span>{' '}
            <span className="text-amber-400">"Authorization: Bearer $API_KEY"</span>{' '}
            <span className="text-zinc-400">\</span>{'\n'}
            {'  '}<span className="text-zinc-400">-d</span>{' '}
            <span className="text-amber-400">'{"{"}"query": "..."{"}"}'</span>{' '}
            <span className="text-zinc-400">\</span>{'\n'}
            {'  '}<span className="text-blue-400">https://api.kijko.ai/v1/query/{projectId}</span>
          </pre>
        </div>
      </div>
    </div>
  );
}
