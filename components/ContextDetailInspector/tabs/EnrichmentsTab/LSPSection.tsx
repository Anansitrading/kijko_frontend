import { Code2, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { LanguageServerData } from '../../../../types/contextInspector';
import { StatusBadge, getStatusFromBoolean } from '../../../common/StatusBadge';
import { ProgressBar } from '../../../common/ProgressBar';
import { FeatureChecklist } from './FeatureChecklist';
import { LanguageDistribution } from './LanguageDistribution';

interface LSPSectionProps {
  data: LanguageServerData;
  onReindex: () => void;
  onConfigure: () => void;
  isReindexing: boolean;
}

export function LSPSection({
  data,
  onReindex,
  onConfigure,
  isReindexing,
}: LSPSectionProps) {
  const status = getStatusFromBoolean(data.active, data.coverage);

  const lspFeatures = [
    { name: 'Go-to-Definition', enabled: true, status: 'Enabled' },
    { name: 'Auto-completion', enabled: true, status: 'Enabled' },
    { name: 'Type Inference', enabled: true, status: 'Enabled' },
  ];

  return (
    <div className="px-6 py-4 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20">
            <Code2 className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Language Server Protocol (LSP)
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Coverage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Coverage</span>
          <span className="text-xs text-gray-500">
            {data.indexedFiles} / {data.totalFiles} files indexed
          </span>
        </div>
        <ProgressBar percentage={data.coverage} labelPosition="inline" size="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Indexed Files"
          value={`${data.indexedFiles}/${data.totalFiles}`}
        />
        <StatCard label="Symbols" value={data.symbols.toLocaleString()} />
      </div>

      {/* Features and Languages in two columns */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <FeatureChecklist features={lspFeatures} />
        <LanguageDistribution languages={data.languages} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReindex}
          disabled={isReindexing}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isReindexing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isReindexing ? 'Re-indexing...' : 'Re-index'}
        </button>
        <button
          onClick={onConfigure}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150'
          )}
        >
          <Settings className="w-3.5 h-3.5" />
          Configure LSP
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
