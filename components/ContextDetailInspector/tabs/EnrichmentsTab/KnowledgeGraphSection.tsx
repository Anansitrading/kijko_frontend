import { GitBranch, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { KnowledgeGraphData } from '../../../../types/contextInspector';
import { StatusBadge, getStatusFromBoolean } from '../../../common/StatusBadge';
import { ProgressBar } from '../../../common/ProgressBar';

interface KnowledgeGraphSectionProps {
  data: KnowledgeGraphData;
  onViewGraph: () => void;
  onRebuild: () => void;
  isRebuilding: boolean;
}

export function KnowledgeGraphSection({
  data,
  onViewGraph,
  onRebuild,
  isRebuilding,
}: KnowledgeGraphSectionProps) {
  const status = getStatusFromBoolean(data.active, data.coverage);

  return (
    <div className="px-6 py-4 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20">
            <GitBranch className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Knowledge Graph (KG)
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Coverage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Coverage</span>
        </div>
        <ProgressBar percentage={data.coverage} labelPosition="inline" size="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Entities" value={data.entities.toLocaleString()} />
        <StatCard label="Relationships" value={data.relationships.toLocaleString()} />
        <StatCard label="Clusters" value={data.clusters.toLocaleString()} />
      </div>

      {/* Top Entities */}
      {data.topEntities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Top Entities
          </h4>
          <ul className="space-y-1.5">
            {data.topEntities.slice(0, 5).map((entity) => (
              <li key={entity.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-mono text-xs truncate max-w-[200px]">
                  {entity.name}
                </span>
                <span className="text-gray-500 text-xs tabular-nums">
                  {entity.references} refs
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onViewGraph}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150'
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          View Graph
        </button>
        <button
          onClick={onRebuild}
          disabled={isRebuilding}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isRebuilding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isRebuilding ? 'Rebuilding...' : 'Rebuild KG'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-center">
      <div className="text-lg font-semibold text-white tabular-nums">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
