import { useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Eye,
  Network,
  Box,
  Link2,
  Layers,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useEnrichments } from '../EnrichmentsTab/hooks/useEnrichments';
import { getStatusFromBoolean } from '../../../common/StatusBadge';
import { StatusBadge } from '../../../common/StatusBadge';
import { ProgressBar } from '../../../common/ProgressBar';

interface KnowledgeGraphTabProps {
  contextId: string;
  onViewFullGraph?: () => void;
}

function StatCard({ label, value, icon: Icon, iconColor }: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
}) {
  return (
    <div className="bg-slate-800/40 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={iconColor} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export function KnowledgeGraphTab({ contextId, onViewFullGraph }: KnowledgeGraphTabProps) {
  const {
    status,
    isLoading,
    error,
    operationInProgress,
    rebuildKG,
    refetch,
  } = useEnrichments(contextId);

  const handleViewGraph = useCallback(() => {
    onViewFullGraph?.();
  }, [onViewFullGraph]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading knowledge graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to load knowledge graph</h3>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <p className="text-sm text-gray-400">No knowledge graph data available</p>
      </div>
    );
  }

  const kg = status.knowledgeGraph;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Knowledge Graph</h2>
              <p className="text-[11px] text-gray-500">Entity relationships and code structure analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={getStatusFromBoolean(kg.active, kg.coverage)} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Entities" value={kg.entities} icon={Box} iconColor="text-purple-400" />
          <StatCard label="Relationships" value={kg.relationships} icon={Link2} iconColor="text-blue-400" />
          <StatCard label="Clusters" value={kg.clusters} icon={Layers} iconColor="text-cyan-400" />
          <StatCard
            label="References"
            value={kg.topEntities.reduce((sum, e) => sum + e.references, 0)}
            icon={Network}
            iconColor="text-amber-400"
          />
        </div>
      </div>

      {/* Coverage */}
      <div className="shrink-0 px-6 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Coverage</span>
          <span className="text-xs text-gray-400 font-mono">{kg.coverage.toFixed(1)}%</span>
        </div>
        <ProgressBar percentage={kg.coverage} labelPosition="inline" size="sm" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
        {/* Top Entities */}
        {kg.topEntities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Top Entities
            </h3>
            <div className="space-y-1.5">
              {kg.topEntities.map((entity) => {
                const maxRefs = Math.max(...kg.topEntities.map((e) => e.references));
                const barWidth = (entity.references / maxRefs) * 100;
                return (
                  <div
                    key={entity.name}
                    className="py-2 px-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-mono truncate">{entity.name}</span>
                      <span className="text-xs text-gray-500 tabular-nums shrink-0 ml-3">
                        {entity.references} refs
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500/60 rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Graph Visualization Placeholder */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Graph Visualization
          </h3>
          <div className="border border-white/10 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-slate-800/20">
            <Network className="w-12 h-12 text-purple-400/40 mb-3" />
            <p className="text-sm text-gray-500 mb-1">Interactive graph visualization</p>
            <p className="text-[11px] text-gray-600">
              {kg.entities} entities &middot; {kg.relationships} relationships
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-6 py-3 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={rebuildKG}
            disabled={operationInProgress !== null}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium',
              'text-white bg-purple-600 hover:bg-purple-500',
              'border border-purple-500 rounded-md',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {operationInProgress === 'kg' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {operationInProgress === 'kg' ? 'Rebuilding...' : 'Rebuild Graph'}
          </button>
          <button
            onClick={handleViewGraph}
            disabled={operationInProgress !== null}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium',
              'text-gray-300 hover:text-white',
              'bg-white/5 hover:bg-white/10',
              'border border-white/10 rounded-md',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Eye className="w-4 h-4" />
            View Full Graph
          </button>

          {operationInProgress === 'kg' && (
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Rebuilding Knowledge Graph...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
