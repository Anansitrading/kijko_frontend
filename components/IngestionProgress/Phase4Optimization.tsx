import { Zap, Check, Loader2, Clock, Target, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Phase4OptimizationData, OptimizationTechnique } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface Phase4OptimizationProps {
  data: Phase4OptimizationData;
  className?: string;
}

// =============================================================================
// Optimization Technique Row
// =============================================================================

function TechniqueRow({ technique, isLast }: { technique: OptimizationTechnique; isLast: boolean }) {
  const prefix = isLast ? '└─' : '├─';

  const getStatusIcon = () => {
    switch (technique.status) {
      case 'completed':
        return <Check size={14} className="text-emerald-400" />;
      case 'in_progress':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (technique.status) {
      case 'completed':
        return 'text-slate-300';
      case 'in_progress':
        return 'text-blue-400';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-4 text-slate-600 font-mono">{prefix}</span>
      {getStatusIcon()}
      <span className={cn('text-sm flex-1', getStatusColor())}>
        {technique.label}
      </span>
      {technique.status === 'completed' && technique.tokensRemoved > 0 && (
        <span className="text-sm font-medium text-red-400">
          -{technique.tokensRemoved.toLocaleString()} tokens
        </span>
      )}
      {technique.status === 'pending' && (
        <span className="text-xs text-slate-500">pending</span>
      )}
    </div>
  );
}

// =============================================================================
// Token Reduction Visualization
// =============================================================================

function TokenReductionVisualization({ reduction }: { reduction: Phase4OptimizationData['tokenReduction'] }) {
  const filledBlocks = Math.floor((1 - reduction.reductionPercent / 100) * 30);
  const emptyBlocks = 30 - filledBlocks;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
      <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
        <TrendingDown size={12} />
        Token Reduction
      </h4>

      {/* Before/After Display */}
      <div className="flex items-center justify-center gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-slate-400 line-through">
            {(reduction.originalTokens / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-slate-500 uppercase">Original</div>
        </div>
        <div className="text-2xl text-slate-600">→</div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">
            {(reduction.currentTokens / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-slate-500 uppercase">Optimized</div>
        </div>
        <div className="ml-4 px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded">
          <span className="text-lg font-bold text-emerald-400">-{reduction.reductionPercent}%</span>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="font-mono text-sm text-center">
        <span className="text-emerald-400">{'█'.repeat(filledBlocks)}</span>
        <span className="text-slate-700">{'░'.repeat(emptyBlocks)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// Predicted Performance
// =============================================================================

function PredictedPerformance({ performance }: { performance: Phase4OptimizationData['predictedPerformance'] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
      <h4 className="text-xs font-mono uppercase text-slate-400">Predicted Performance</h4>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600 font-mono">├─</span>
        <Clock size={14} className="text-blue-400" />
        <span className="text-sm text-slate-300 flex-1">Query latency:</span>
        <span className="text-sm font-medium text-blue-400">
          {'<'}{performance.queryLatencyMs}ms
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600 font-mono">└─</span>
        <Target size={14} className="text-emerald-400" />
        <span className="text-sm text-slate-300 flex-1">Relevance score:</span>
        <span className="text-sm font-medium text-emerald-400">
          {performance.relevanceScore}%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Phase4Optimization({ data, className }: Phase4OptimizationProps) {
  const completedTechniques = data.techniques.filter((t) => t.status === 'completed');
  const totalTokensRemoved = completedTechniques.reduce((sum, t) => sum + t.tokensRemoved, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Phase Header */}
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Zap size={18} />
          <h3 className="text-sm font-mono uppercase tracking-wide">
            Phase 4: Final Optimization
          </h3>
        </div>
      </div>

      {/* Optimization Techniques */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">Optimizations</h4>
        {data.techniques.map((technique, index) => (
          <TechniqueRow
            key={technique.id}
            technique={technique}
            isLast={index === data.techniques.length - 1}
          />
        ))}
      </div>

      {/* Token Reduction Visualization */}
      <TokenReductionVisualization reduction={data.tokenReduction} />

      {/* Predicted Performance */}
      <PredictedPerformance performance={data.predictedPerformance} />
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockPhase4Data(overrides?: Partial<Phase4OptimizationData>): Phase4OptimizationData {
  return {
    techniques: [
      { id: 'deduplication', label: 'Deduplication', status: 'completed', tokensRemoved: 12400 },
      { id: 'pattern_compression', label: 'Pattern compression', status: 'completed', tokensRemoved: 8200 },
      { id: 'whitespace', label: 'Whitespace normalization', status: 'in_progress', tokensRemoved: 2100 },
      { id: 'imports', label: 'Import consolidation', status: 'pending', tokensRemoved: 0 },
    ],
    tokenReduction: {
      originalTokens: 185400,
      currentTokens: 42500,
      reductionPercent: 77,
    },
    predictedPerformance: {
      queryLatencyMs: 200,
      relevanceScore: 96,
    },
    ...overrides,
  };
}
