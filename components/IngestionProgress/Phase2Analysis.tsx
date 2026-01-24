import { Check, Search, Zap, FileCode, Lightbulb } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Phase2AnalysisData, FileTypeProgress } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface Phase2AnalysisProps {
  data: Phase2AnalysisData;
  className?: string;
}

// =============================================================================
// File Type Progress Row
// =============================================================================

function FileTypeRow({ fileType }: { fileType: FileTypeProgress }) {
  const isLast = false; // Determined by parent
  const prefix = '├─';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="w-4 text-slate-600 font-mono">{prefix}</span>
        <span className={cn(
          'text-sm',
          fileType.isComplete ? 'text-emerald-400' : 'text-slate-300'
        )}>
          {fileType.label}: {fileType.filesProcessed}/{fileType.totalFiles} analyzed
          {fileType.isComplete && <Check size={14} className="inline ml-1" />}
          {!fileType.isComplete && (
            <span className="text-slate-500 ml-1">({fileType.percentage}%)</span>
          )}
        </span>
      </div>

      {/* Extracted entities sub-item */}
      {fileType.extractedEntities && fileType.extractedEntities.classes > 0 && (
        <div className="flex items-center gap-3 ml-4">
          <span className="w-4 text-slate-700 font-mono">└─</span>
          <span className="text-xs text-slate-500">
            Extracted: {fileType.extractedEntities.classes} classes, {fileType.extractedEntities.functions} functions
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Overall Progress Bar
// =============================================================================

function OverallProgressBar({ progress }: { progress: number }) {
  const percentage = Math.min(100, Math.max(0, progress));
  const filledBlocks = Math.floor(percentage / 5); // 20 blocks total
  const emptyBlocks = 20 - filledBlocks;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono">Progress:</span>
        <span className="font-mono text-sm">
          <span className="text-blue-400">{'█'.repeat(filledBlocks)}</span>
          <span className="text-slate-700">{'░'.repeat(emptyBlocks)}</span>
        </span>
        <span className="text-sm font-medium text-blue-400">{percentage}%</span>
      </div>
    </div>
  );
}

// =============================================================================
// Metrics Panel
// =============================================================================

function MetricsPanel({ metrics }: { metrics: Phase2AnalysisData['metrics'] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
      <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">Metrics</h4>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600 font-mono">├─</span>
        <span className="text-sm text-slate-300">
          Tokens processed: <span className="text-emerald-400 font-medium tabular-nums">
            {metrics.tokensProcessed.toLocaleString()}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600 font-mono">├─</span>
        <span className="text-sm text-slate-300">
          Current reduction: <span className="text-blue-400 font-medium">{metrics.currentReduction}%</span>
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600 font-mono">└─</span>
        <Zap size={14} className="text-amber-400" />
        <span className="text-sm text-slate-300">
          Speed: <span className="text-amber-400 font-medium">{metrics.speedFilesPerSec} files/sec</span>
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Memory Insights
// =============================================================================

function MemoryInsights({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
        <Lightbulb size={12} />
        Insights Discovered
      </h4>
      <div className="space-y-1">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-xs text-blue-300 bg-blue-600/10 px-3 py-2 rounded"
          >
            <span className="text-blue-400">•</span>
            {insight}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Phase2Analysis({ data, className }: Phase2AnalysisProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Phase Header */}
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Search size={18} />
          <h3 className="text-sm font-mono uppercase tracking-wide">
            Phase 2: Analyzing & Parsing
          </h3>
        </div>
      </div>

      {/* Overall Progress */}
      <OverallProgressBar progress={data.overallProgress} />

      {/* File Type Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">Detailed Breakdown</h4>
        {data.fileTypeBreakdown.map((fileType, index) => (
          <FileTypeRow key={fileType.fileType} fileType={fileType} />
        ))}
      </div>

      {/* Metrics */}
      <MetricsPanel metrics={data.metrics} />

      {/* Memory Insights */}
      <MemoryInsights insights={data.memoryInsights} />
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockPhase2Data(overrides?: Partial<Phase2AnalysisData>): Phase2AnalysisData {
  return {
    overallProgress: 43,
    fileTypeBreakdown: [
      {
        fileType: 'python',
        label: 'Python files',
        filesProcessed: 67,
        totalFiles: 89,
        percentage: 75,
        isComplete: false,
        extractedEntities: { classes: 156, functions: 487, modules: 23 },
      },
      {
        fileType: 'yaml',
        label: 'YAML configs',
        filesProcessed: 12,
        totalFiles: 15,
        percentage: 80,
        isComplete: false,
      },
      {
        fileType: 'markdown',
        label: 'Markdown docs',
        filesProcessed: 23,
        totalFiles: 23,
        percentage: 100,
        isComplete: true,
      },
    ],
    metrics: {
      tokensProcessed: 98400,
      currentReduction: 23,
      speedFilesPerSec: 12,
    },
    memoryInsights: [
      'Detected 15 duplicate utility functions',
      'Found 8 redundant import patterns',
    ],
    ...overrides,
  };
}
