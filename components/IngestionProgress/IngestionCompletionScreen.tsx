import { useState, useEffect } from 'react';
import {
  TrendingDown,
  Clock,
  Target,
  Zap,
  MessageSquare,
  Download,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { AnimatedCounter, TokenCounter, PercentCounter, CurrencyCounter } from './AnimatedCounter';
import { CelebrationHeader, StaggeredReveal } from './CelebrationAnimation';
import { InsightDisplay } from './InsightDisplay';
import { NextStepsChecklist } from './NextStepsChecklist';
import {
  generateCompletionInsights,
  calculateCostImpact,
  type CompletionInsightMetrics,
  type Insight,
} from './InsightGenerator';

// =============================================================================
// Types
// =============================================================================

export interface TokenSavingsBreakdown {
  deduplication: number;
  patternCompression: number;
  whitespace: number;
  importConsolidation: number;
}

export interface PerformanceStats {
  ingestionTimeSeconds: number;
  queryLatencyMs: number;
  relevanceScore: number;
}

export interface IngestionCompletionData {
  projectId: string;
  projectName: string;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  savingsBreakdown: TokenSavingsBreakdown;
  performanceStats: PerformanceStats;
  filesProcessed: number;
  chunksCreated: number;
  languagesDetected?: string[];
}

interface IngestionCompletionScreenProps {
  data: IngestionCompletionData;
  onQueryCode: () => void;
  onExport: () => void;
  onInviteTeam: () => void;
  onEnableAutoRefresh: () => void;
  onShare?: () => void;
  className?: string;
}

// =============================================================================
// Metrics Section Component
// =============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  subLabel?: string;
  className?: string;
}

function MetricCard({ icon, label, children, subLabel, className }: MetricCardProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg bg-slate-800/50 border border-slate-700',
      className
    )}>
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs font-mono uppercase">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{children}</div>
      {subLabel && (
        <div className="text-xs text-slate-500 mt-1">{subLabel}</div>
      )}
    </div>
  );
}

// =============================================================================
// Compression Metrics Section
// =============================================================================

interface CompressionMetricsProps {
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
}

function CompressionMetrics({ originalTokens, optimizedTokens, reductionPercent }: CompressionMetricsProps) {
  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
      <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
        <TrendingDown size={14} />
        Compression Metrics
      </h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Original tokens:</span>
          <TokenCounter value={originalTokens} className="text-sm font-medium text-slate-300" showSuffix={false} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Optimized tokens:</span>
          <TokenCounter value={optimizedTokens} className="text-sm font-medium text-emerald-400" showSuffix={false} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <span className="text-sm font-medium text-slate-300">Reduction:</span>
          <div className="flex items-center gap-2">
            <PercentCounter value={reductionPercent} className="text-lg font-bold text-emerald-400" />
            <span className="text-emerald-400">✨</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Token Savings Breakdown
// =============================================================================

interface TokenSavingsBreakdownProps {
  breakdown: TokenSavingsBreakdown;
  totalSaved: number;
}

function TokenSavingsBreakdownSection({ breakdown, totalSaved }: TokenSavingsBreakdownProps) {
  const items = [
    { label: 'Deduplication', value: breakdown.deduplication },
    { label: 'Pattern compression', value: breakdown.patternCompression },
    { label: 'Whitespace', value: breakdown.whitespace },
    { label: 'Import consolidation', value: breakdown.importConsolidation },
  ];

  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
      <h4 className="text-xs font-mono uppercase text-slate-400">Token Savings Breakdown</h4>

      <div className="space-y-2">
        {items.map((item, index) => {
          const percentage = totalSaved > 0 ? Math.round((item.value / totalSaved) * 100) : 0;
          const isLast = index === items.length - 1;
          const prefix = isLast ? '└─' : '├─';

          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-4 text-slate-600 font-mono text-xs">{prefix}</span>
              <span className="flex-1 text-sm text-slate-400">{item.label}:</span>
              <span className="text-sm font-medium text-red-400">
                -<AnimatedCounter value={item.value / 1000} decimals={1} suffix="K" />
              </span>
              <span className="text-xs text-slate-500">({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Cost Impact Section
// =============================================================================

interface CostImpactProps {
  originalTokens: number;
  optimizedTokens: number;
}

function CostImpact({ originalTokens, optimizedTokens }: CostImpactProps) {
  const costData = calculateCostImpact(originalTokens, optimizedTokens, 30);

  return (
    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30 space-y-4">
      <h4 className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-2">
        <Zap size={14} />
        Cost Impact (Claude 3 Opus)
      </h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Per query:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 line-through">
              €{costData.originalCostPerQuery.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400">→</span>
            <CurrencyCounter
              value={costData.optimizedCostPerQuery}
              className="text-sm font-medium text-emerald-400"
            />
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              {costData.savingsPercent.toFixed(0)}% cheaper! 💰
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
          <span className="text-sm text-slate-400">Monthly est. (30 queries):</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 line-through">
              €{(costData.originalCostPerQuery * 30).toFixed(0)}
            </span>
            <span className="text-sm text-slate-400">→</span>
            <span className="text-sm font-medium text-emerald-400">
              €{costData.monthlySavings.toFixed(0)} saved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Performance Stats Section
// =============================================================================

interface PerformanceStatsProps {
  stats: PerformanceStats;
}

function PerformanceStatsSection({ stats }: PerformanceStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MetricCard
        icon={<Clock size={14} />}
        label="Ingestion Time"
      >
        <AnimatedCounter value={stats.ingestionTimeSeconds} suffix="s" />
      </MetricCard>

      <MetricCard
        icon={<Zap size={14} />}
        label="Query Latency"
      >
        <AnimatedCounter value={stats.queryLatencyMs} prefix="<" suffix="ms" />
      </MetricCard>

      <MetricCard
        icon={<Target size={14} />}
        label="Relevance Score"
      >
        <PercentCounter value={stats.relevanceScore} className="text-emerald-400" />
      </MetricCard>
    </div>
  );
}

// =============================================================================
// Context Window Comparison
// =============================================================================

interface ContextWindowComparisonProps {
  optimizedTokens: number;
}

function ContextWindowComparison({ optimizedTokens }: ContextWindowComparisonProps) {
  const contextWindows = [
    { name: 'Claude 3 Opus', tokens: 200000, color: 'bg-violet-500' },
    { name: 'GPT-4 Turbo', tokens: 128000, color: 'bg-green-500' },
    { name: 'GPT-4', tokens: 8192, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
      <h4 className="text-xs font-mono uppercase text-slate-400">Context Window Usage</h4>

      <div className="space-y-2">
        {contextWindows.map(model => {
          const fits = Math.floor(model.tokens / optimizedTokens);
          const percentage = Math.min((optimizedTokens / model.tokens) * 100, 100);

          return (
            <div key={model.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{model.name}</span>
                <span className="text-slate-300">
                  {fits}x fits ({model.tokens.toLocaleString()} tokens)
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', model.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// CTA Buttons Section
// =============================================================================

interface CTAButtonsProps {
  onQueryCode: () => void;
  onExport: () => void;
  onInviteTeam: () => void;
  onEnableAutoRefresh: () => void;
}

function CTAButtons({ onQueryCode, onExport, onInviteTeam, onEnableAutoRefresh }: CTAButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onQueryCode}
        className={cn(
          'flex-1 min-w-[140px] flex items-center justify-center gap-2',
          'px-4 py-3 rounded-lg font-medium',
          'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
        )}
      >
        <MessageSquare size={18} />
        Query Your Code
      </button>

      <button
        onClick={onExport}
        className={cn(
          'flex items-center justify-center gap-2',
          'px-4 py-3 rounded-lg font-medium',
          'bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors'
        )}
      >
        <Download size={18} />
        Export
      </button>

      <button
        onClick={onInviteTeam}
        className={cn(
          'flex items-center justify-center gap-2',
          'px-4 py-3 rounded-lg font-medium',
          'bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors'
        )}
      >
        <Users size={18} />
        Invite Team
      </button>

      <button
        onClick={onEnableAutoRefresh}
        className={cn(
          'flex items-center justify-center gap-2',
          'px-4 py-3 rounded-lg font-medium',
          'bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors'
        )}
      >
        <RefreshCw size={18} />
        Auto-Refresh
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function IngestionCompletionScreen({
  data,
  onQueryCode,
  onExport,
  onInviteTeam,
  onEnableAutoRefresh,
  className,
}: IngestionCompletionScreenProps) {
  const [insights, setInsights] = useState<Insight[]>([]);

  // Generate insights on mount
  useEffect(() => {
    const metrics: CompletionInsightMetrics = {
      originalTokens: data.originalTokens,
      optimizedTokens: data.optimizedTokens,
      reductionPercent: data.reductionPercent,
      filesProcessed: data.filesProcessed,
      totalFiles: data.filesProcessed,
      totalDurationSeconds: data.performanceStats.ingestionTimeSeconds,
      queryLatencyMs: data.performanceStats.queryLatencyMs,
      relevanceScore: data.performanceStats.relevanceScore,
      totalChunks: data.chunksCreated,
      languagesDetected: data.languagesDetected,
    };

    const generatedInsights = generateCompletionInsights(metrics);
    setInsights(generatedInsights);
  }, [data]);

  const totalSaved = data.originalTokens - data.optimizedTokens;

  return (
    <div className={cn('max-w-3xl mx-auto p-6 space-y-8', className)}>
      {/* Celebration Header */}
      <CelebrationHeader
        title="Project Ingestion Complete!"
        subtitle={`${data.projectName} has been processed and is ready to query.`}
        showConfetti={true}
      />

      {/* Insights */}
      <StaggeredReveal delay={600}>
        <InsightDisplay
          insights={insights}
          maxVisible={3}
          autoDismissMs={0} // Don't auto-dismiss on completion screen
        />
      </StaggeredReveal>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StaggeredReveal delay={800}>
          <CompressionMetrics
            originalTokens={data.originalTokens}
            optimizedTokens={data.optimizedTokens}
            reductionPercent={data.reductionPercent}
          />
        </StaggeredReveal>

        <StaggeredReveal delay={900}>
          <TokenSavingsBreakdownSection
            breakdown={data.savingsBreakdown}
            totalSaved={totalSaved}
          />
        </StaggeredReveal>
      </div>

      {/* Cost Impact */}
      <StaggeredReveal delay={1000}>
        <CostImpact
          originalTokens={data.originalTokens}
          optimizedTokens={data.optimizedTokens}
        />
      </StaggeredReveal>

      {/* Context Window Comparison */}
      <StaggeredReveal delay={1100}>
        <ContextWindowComparison optimizedTokens={data.optimizedTokens} />
      </StaggeredReveal>

      {/* Performance Stats */}
      <StaggeredReveal delay={1200}>
        <PerformanceStatsSection stats={data.performanceStats} />
      </StaggeredReveal>

      {/* CTA Buttons */}
      <StaggeredReveal delay={1300}>
        <CTAButtons
          onQueryCode={onQueryCode}
          onExport={onExport}
          onInviteTeam={onInviteTeam}
          onEnableAutoRefresh={onEnableAutoRefresh}
        />
      </StaggeredReveal>

      {/* Next Steps Checklist */}
      <StaggeredReveal delay={1400}>
        <NextStepsChecklist
          projectId={data.projectId}
          onQueryCode={onQueryCode}
          onInviteTeammates={onInviteTeam}
          onExportForAPI={onExport}
          onSetupAutoRefresh={onEnableAutoRefresh}
        />
      </StaggeredReveal>
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockCompletionData(): IngestionCompletionData {
  return {
    projectId: 'proj_123456',
    projectName: 'My Awesome Project',
    originalTokens: 185400,
    optimizedTokens: 42500,
    reductionPercent: 77.1,
    savingsBreakdown: {
      deduplication: 45200,
      patternCompression: 32100,
      whitespace: 12400,
      importConsolidation: 8200,
    },
    performanceStats: {
      ingestionTimeSeconds: 45,
      queryLatencyMs: 180,
      relevanceScore: 96,
    },
    filesProcessed: 127,
    chunksCreated: 89,
    languagesDetected: ['TypeScript', 'JavaScript', 'CSS', 'JSON'],
  };
}
