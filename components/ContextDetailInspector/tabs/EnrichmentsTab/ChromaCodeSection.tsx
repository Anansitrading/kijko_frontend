import { Sparkles, Play, Settings, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChromaCodeData } from '../../../../types/contextInspector';
import { StatusBadge, getStatusFromBoolean } from '../../../common/StatusBadge';
import { ProgressBar } from '../../../common/ProgressBar';
import { FeatureChecklist } from './FeatureChecklist';

interface ChromaCodeSectionProps {
  data: ChromaCodeData;
  onGenerate: () => void;
  onConfigure: () => void;
  isGenerating: boolean;
}

export function ChromaCodeSection({
  data,
  onGenerate,
  onConfigure,
  isGenerating,
}: ChromaCodeSectionProps) {
  const status = getStatusFromBoolean(data.active, data.coverage);

  const chromaFeatures = [
    { name: 'Similarity Index', enabled: true, status: 'Built' },
    { name: 'Semantic Search', enabled: true, status: 'Ready' },
  ];

  return (
    <div className="px-6 py-4 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            ChromaCode (CC)
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Coverage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Coverage</span>
          <span className="text-xs text-gray-500">
            {data.embeddings} / {data.totalFiles} embeddings generated
          </span>
        </div>
        <ProgressBar percentage={data.coverage} labelPosition="inline" size="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Embeddings"
          value={`${data.embeddings}/${data.totalFiles}`}
        />
        <StatCard label="Dimensions" value={data.dimensions.toLocaleString()} />
      </div>

      {/* Features and Configuration in two columns */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <FeatureChecklist features={chromaFeatures} />
        <ConfigInfo model={data.model} chunkStrategy={data.chunkStrategy} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Embeddings'}
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
          Configure CC
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

function ConfigInfo({
  model,
  chunkStrategy,
}: {
  model: string;
  chunkStrategy: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Configuration
      </h4>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-gray-500">Model:</span>
          <span className="text-gray-300 font-mono text-xs">{model}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-gray-500">Chunk:</span>
          <span className="text-gray-300 text-xs">{chunkStrategy}</span>
        </li>
      </ul>
    </div>
  );
}
