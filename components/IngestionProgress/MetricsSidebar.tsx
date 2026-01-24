import { Clock, FileText, TrendingDown, Layers, Timer } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { IngestionMetricsSidebar } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface MetricsSidebarProps {
  metrics: IngestionMetricsSidebar;
  layout?: 'sidebar' | 'footer';
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

// =============================================================================
// Metric Card Component (for sidebar)
// =============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'blue',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-xs font-mono uppercase">{label}</span>
      </div>
      <div className={cn('text-lg font-bold tabular-nums', colorClasses[color])}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-slate-500">{subValue}</div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Metric (for footer)
// =============================================================================

function CompactMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center', className)}>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-sm font-bold text-slate-200 tabular-nums">{value}</div>
    </div>
  );
}

// =============================================================================
// Sidebar Layout
// =============================================================================

function SidebarLayout({ metrics }: { metrics: IngestionMetricsSidebar }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-mono uppercase text-slate-400 px-1">Live Metrics</h4>

      <MetricCard
        icon={Layers}
        label="Original Tokens"
        value={formatTokens(metrics.originalTokens)}
        color="blue"
      />

      <MetricCard
        icon={TrendingDown}
        label="Current Tokens"
        value={formatTokens(metrics.currentTokens)}
        subValue={`-${metrics.reductionPercent}% reduction`}
        color="emerald"
      />

      <MetricCard
        icon={FileText}
        label="Files Processed"
        value={`${metrics.filesProcessed}/${metrics.totalFiles}`}
        color="amber"
      />

      <MetricCard
        icon={Clock}
        label="Time Elapsed"
        value={formatTime(metrics.timeElapsedSeconds)}
        subValue={
          metrics.estimatedSecondsRemaining
            ? `~${formatTime(metrics.estimatedSecondsRemaining)} remaining`
            : undefined
        }
        color="blue"
      />

      {/* Current Phase Badge */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs text-blue-400 font-mono uppercase">
            {metrics.currentPhaseName}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Footer Layout
// =============================================================================

function FooterLayout({ metrics }: { metrics: IngestionMetricsSidebar }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 border-t border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs text-blue-400 font-mono uppercase">
          {metrics.currentPhaseName}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <CompactMetric
          label="Original"
          value={formatTokens(metrics.originalTokens)}
        />

        <div className="text-slate-600">→</div>

        <CompactMetric
          label="Optimized"
          value={formatTokens(metrics.currentTokens)}
        />

        <div className="px-2 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded">
          <span className="text-sm font-bold text-emerald-400">-{metrics.reductionPercent}%</span>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        <CompactMetric
          label="Files"
          value={`${metrics.filesProcessed}/${metrics.totalFiles}`}
        />

        <div className="w-px h-6 bg-slate-700" />

        <div className="flex items-center gap-2">
          <Timer size={14} className="text-slate-400" />
          <span className="text-sm text-slate-200 tabular-nums">
            {formatTime(metrics.timeElapsedSeconds)}
          </span>
          {metrics.estimatedSecondsRemaining && (
            <span className="text-xs text-slate-500">
              (~{formatTime(metrics.estimatedSecondsRemaining)} left)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MetricsSidebar({ metrics, layout = 'sidebar', className }: MetricsSidebarProps) {
  if (layout === 'footer') {
    return (
      <div className={className}>
        <FooterLayout metrics={metrics} />
      </div>
    );
  }

  return (
    <div className={cn('w-64 p-4 border-l border-slate-700 bg-slate-900/50', className)}>
      <SidebarLayout metrics={metrics} />
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockMetrics(overrides?: Partial<IngestionMetricsSidebar>): IngestionMetricsSidebar {
  return {
    originalTokens: 185400,
    currentTokens: 42500,
    reductionPercent: 77,
    timeElapsedSeconds: 45,
    estimatedSecondsRemaining: 30,
    filesProcessed: 89,
    totalFiles: 127,
    currentPhaseName: 'Analyzing & Parsing',
    ...overrides,
  };
}
