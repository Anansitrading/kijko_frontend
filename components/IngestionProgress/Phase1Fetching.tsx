import { Check, X, Loader2, Clock, FileText, Code, HardDrive, Lightbulb } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Phase1FetchingData, FetchingStatusState } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface Phase1FetchingProps {
  data: Phase1FetchingData;
  className?: string;
}

// =============================================================================
// Status Item Component
// =============================================================================

function StatusItem({ item }: { item: FetchingStatusState }) {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <Check size={14} className="text-emerald-400" />;
      case 'error':
        return <X size={14} className="text-red-400" />;
      case 'in_progress':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'text-slate-300';
      case 'error':
        return 'text-red-400';
      case 'in_progress':
        return 'text-blue-400';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-4 text-slate-600">├─</span>
      {getStatusIcon()}
      <span className={cn('text-sm', getStatusColor())}>
        {item.label}
        {item.status === 'completed' && item.duration && (
          <span className="text-slate-500 ml-1">({item.duration}s)</span>
        )}
      </span>
    </div>
  );
}

// =============================================================================
// Progress Bar Component
// =============================================================================

function CloneProgressBar({ progress }: { progress: Phase1FetchingData['cloneProgress'] }) {
  const percentage = Math.min(100, Math.max(0, progress.percentage));

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Cloning</span>
        <span>{progress.downloadedMB.toFixed(1)}/{progress.totalMB.toFixed(1)} MB</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right text-xs text-blue-400 font-medium">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
}

// =============================================================================
// Early Stats Panel
// =============================================================================

function EarlyStatsPanel({ stats }: { stats: Phase1FetchingData['earlyStats'] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
      <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">Early Stats</h4>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600">├─</span>
        <FileText size={14} className="text-slate-400" />
        <span className="text-sm text-slate-300">
          Files found: <span className="text-emerald-400 font-medium">{stats.filesFound.toLocaleString()}</span>
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600">├─</span>
        <Code size={14} className="text-slate-400" />
        <span className="text-sm text-slate-300">
          Languages: <span className="text-blue-400">{stats.languagesDetected.join(', ')}</span>
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <span className="w-4 text-slate-600">└─</span>
        <HardDrive size={14} className="text-slate-400" />
        <span className="text-sm text-slate-300">
          Size: <span className="text-amber-400">{stats.repositorySizeMB.toFixed(1)} MB</span>
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Phase1Fetching({ data, className }: Phase1FetchingProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Phase Header */}
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 size={18} className="animate-spin" />
          <h3 className="text-sm font-mono uppercase tracking-wide">
            Phase 1: Fetching Repository
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-mono truncate">
          Cloning: {data.repositoryUrl}
        </p>
      </div>

      {/* Status Checklist */}
      <div className="space-y-1">
        <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Status</h4>
        {data.statusItems.map((item) => (
          <StatusItem key={item.item} item={item} />
        ))}

        {/* ETA Display */}
        {data.estimatedSecondsRemaining !== undefined && data.estimatedSecondsRemaining > 0 && (
          <div className="flex items-center gap-3 py-1.5">
            <span className="w-4 text-slate-600">└─</span>
            <Clock size={14} className="text-amber-400" />
            <span className="text-sm text-amber-400">
              ETA: ~{data.estimatedSecondsRemaining} seconds remaining
            </span>
          </div>
        )}
      </div>

      {/* Clone Progress Bar */}
      {data.cloneProgress.totalMB > 0 && (
        <CloneProgressBar progress={data.cloneProgress} />
      )}

      {/* Early Stats */}
      {data.earlyStats.filesFound > 0 && (
        <EarlyStatsPanel stats={data.earlyStats} />
      )}

      {/* Pro Tip */}
      {data.proTip && (
        <div className="flex items-start gap-3 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
          <Lightbulb size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">{data.proTip}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data Generator
// =============================================================================

export function createMockPhase1Data(overrides?: Partial<Phase1FetchingData>): Phase1FetchingData {
  return {
    repositoryUrl: 'github.com/anthropic/anthropic-sdk-python',
    statusItems: [
      { item: 'authenticating', status: 'completed', label: 'Authenticating', duration: 2 },
      { item: 'cloning', status: 'in_progress', label: 'Cloning' },
      { item: 'file_discovery', status: 'pending', label: 'File discovery' },
    ],
    cloneProgress: {
      downloadedMB: 8,
      totalMB: 15,
      percentage: 53,
    },
    estimatedSecondsRemaining: 7,
    earlyStats: {
      filesFound: 127,
      languagesDetected: ['Python', 'YAML', 'Markdown'],
      repositorySizeMB: 15,
    },
    proTip: 'Your optimized context will load 3x faster than raw files',
    ...overrides,
  };
}
