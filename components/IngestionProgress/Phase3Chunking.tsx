import { Scissors, Check, Loader2, Box, FileCode, FileText, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Phase3ChunkingData, ChunkTypeStats } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface Phase3ChunkingProps {
  data: Phase3ChunkingData;
  className?: string;
}

// =============================================================================
// Chunk Type Icon Mapping
// =============================================================================

const chunkTypeIcons = {
  module_boundaries: Box,
  function_groupings: FileCode,
  documentation: FileText,
  config: Settings,
};

// =============================================================================
// Chunk Type Row
// =============================================================================

function ChunkTypeRow({ chunkType, isLast }: { chunkType: ChunkTypeStats; isLast: boolean }) {
  const prefix = isLast ? '└─' : '├─';
  const Icon = chunkTypeIcons[chunkType.type] || Box;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-4 text-slate-600 font-mono">{prefix}</span>
      <Icon size={14} className="text-slate-400" />
      <span className="text-sm text-slate-300 flex-1">
        {chunkType.label}: <span className="text-blue-400 font-medium">{chunkType.count} chunks</span>
        <span className="text-slate-500 ml-1">
          (avg {(chunkType.avgTokenSize / 1000).toFixed(1)}K tokens)
        </span>
      </span>
    </div>
  );
}

// =============================================================================
// Strategy Badge
// =============================================================================

function StrategyBadge({ strategy, label }: { strategy: string; label: string }) {
  const isRecommended = strategy === 'semantic';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-mono uppercase">Strategy:</span>
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-medium rounded',
          isRecommended
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-700 text-slate-300 border border-slate-600'
        )}
      >
        {label.toUpperCase()}
        {isRecommended && ' (recommended for AI)'}
      </span>
    </div>
  );
}

// =============================================================================
// Totals Summary
// =============================================================================

function TotalsSummary({ totalChunks, avgChunkSize }: { totalChunks: number; avgChunkSize: number }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{totalChunks}</div>
            <div className="text-xs text-slate-500 uppercase">Total Chunks</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{(avgChunkSize / 1000).toFixed(1)}K</div>
            <div className="text-xs text-slate-500 uppercase">Avg Size</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Quality Metrics
// =============================================================================

function QualityMetrics({ metrics }: { metrics: Phase3ChunkingData['qualityMetrics'] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
      <h4 className="text-xs font-mono uppercase text-slate-400">Quality</h4>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-4 text-slate-600 font-mono">├─</span>
          <span className="text-sm text-slate-300 flex-1">Semantic coherence:</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${metrics.semanticCoherence}%` }}
              />
            </div>
            <span className="text-sm font-medium text-emerald-400 tabular-nums w-10">
              {metrics.semanticCoherence}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 text-slate-600 font-mono">└─</span>
          <span className="text-sm text-slate-300 flex-1">Context preserved:</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${metrics.contextPreserved}%` }}
              />
            </div>
            <span className="text-sm font-medium text-blue-400 tabular-nums w-10">
              {metrics.contextPreserved}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Optimization Actions
// =============================================================================

function OptimizationActions({ actions }: { actions: Phase3ChunkingData['optimizationActions'] }) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-mono uppercase text-slate-400">Optimization Actions</h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <span
            key={index}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded',
              action.status === 'completed' && 'bg-emerald-600/20 text-emerald-400',
              action.status === 'in_progress' && 'bg-blue-600/20 text-blue-400',
              action.status === 'pending' && 'bg-slate-700 text-slate-400'
            )}
          >
            {action.status === 'completed' && <Check size={12} />}
            {action.status === 'in_progress' && <Loader2 size={12} className="animate-spin" />}
            {action.action}
          </span>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Phase3Chunking({ data, className }: Phase3ChunkingProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Phase Header */}
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Scissors size={18} />
          <h3 className="text-sm font-mono uppercase tracking-wide">
            Phase 3: Semantic Chunking
          </h3>
        </div>
      </div>

      {/* Strategy Badge */}
      <StrategyBadge strategy={data.strategy} label={data.strategyLabel} />

      {/* Chunks Created Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">Chunks Created</h4>
        {data.chunkTypes.map((chunkType, index) => (
          <ChunkTypeRow
            key={chunkType.type}
            chunkType={chunkType}
            isLast={index === data.chunkTypes.length - 1}
          />
        ))}
      </div>

      {/* Totals Summary */}
      <TotalsSummary totalChunks={data.totalChunks} avgChunkSize={data.avgChunkSize} />

      {/* Quality Metrics */}
      <QualityMetrics metrics={data.qualityMetrics} />

      {/* Optimization Actions */}
      <OptimizationActions actions={data.optimizationActions} />
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockPhase3Data(overrides?: Partial<Phase3ChunkingData>): Phase3ChunkingData {
  return {
    strategy: 'semantic',
    strategyLabel: 'Semantic',
    chunkTypes: [
      { type: 'module_boundaries', label: 'Module boundaries', count: 34, avgTokenSize: 2800 },
      { type: 'function_groupings', label: 'Function groupings', count: 67, avgTokenSize: 1200 },
      { type: 'documentation', label: 'Documentation', count: 23, avgTokenSize: 800 },
      { type: 'config', label: 'Config files', count: 8, avgTokenSize: 400 },
    ],
    totalChunks: 132,
    avgChunkSize: 1400,
    qualityMetrics: {
      semanticCoherence: 94,
      contextPreserved: 98,
    },
    optimizationActions: [
      { action: 'Deduplication', status: 'completed' },
      { action: 'Compression', status: 'in_progress' },
    ],
    ...overrides,
  };
}
