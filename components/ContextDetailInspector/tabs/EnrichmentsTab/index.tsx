import { useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Zap,
  Settings,
  RotateCcw,
  GitBranch,
  Code2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useEnrichments } from './hooks/useEnrichments';
import { OverallProgress } from './OverallProgress';
import { EnrichmentColumn } from './EnrichmentColumn';
import { getStatusFromBoolean } from '../../../common/StatusBadge';
import { FeatureChecklist } from './FeatureChecklist';
import { LanguageDistribution } from './LanguageDistribution';

interface EnrichmentsTabProps {
  contextId: string;
}

export function EnrichmentsTab({ contextId }: EnrichmentsTabProps) {
  const {
    status,
    isLoading,
    error,
    operationInProgress,
    runAllEnrichments,
    rebuildKG,
    reindexLSP,
    generateEmbeddings,
    refetch,
  } = useEnrichments(contextId);

  // Action handlers
  const handleViewGraph = useCallback(() => {
    console.log('View graph for context:', contextId);
  }, [contextId]);

  const handleConfigureLSP = useCallback(() => {
    console.log('Configure LSP for context:', contextId);
  }, [contextId]);

  const handleConfigureCC = useCallback(() => {
    console.log('Configure ChromaCode for context:', contextId);
  }, [contextId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading enrichment status...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          onClick={refetch}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
            'text-gray-300 hover:text-white',
            'bg-white/5 hover:bg-white/10',
            'border border-white/10 rounded-md',
            'transition-colors duration-150'
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // No status data
  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <p className="text-sm text-gray-400">No enrichment data available</p>
      </div>
    );
  }

  // KG features content
  const kgFeaturesContent = status.knowledgeGraph.topEntities.length > 0 && (
    <div className="space-y-2">
      <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
        Top Entities
      </h4>
      <ul className="space-y-1">
        {status.knowledgeGraph.topEntities.slice(0, 5).map((entity) => (
          <li key={entity.name} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-mono truncate max-w-[120px]">
              {entity.name}
            </span>
            <span className="text-gray-500 tabular-nums text-[10px]">
              {entity.references} refs
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  // LSP features content
  const lspFeatures = [
    { name: 'Go-to-Definition', enabled: true, status: 'Enabled' },
    { name: 'Auto-completion', enabled: true, status: 'Enabled' },
    { name: 'Type Inference', enabled: true, status: 'Enabled' },
  ];

  const lspFeaturesContent = (
    <div className="space-y-3">
      <FeatureChecklist features={lspFeatures} />
      <LanguageDistribution languages={status.languageServer.languages} />
    </div>
  );

  // CC features content
  const ccFeatures = [
    { name: 'Similarity Index', enabled: true, status: 'Built' },
    { name: 'Semantic Search', enabled: true, status: 'Ready' },
  ];

  const ccFeaturesContent = (
    <div className="space-y-3">
      <FeatureChecklist features={ccFeatures} />
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Configuration
        </h4>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Model:</span>
            <span className="text-gray-300 font-mono text-[10px]">{status.chromaCode.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chunk:</span>
            <span className="text-gray-300 text-[10px]">{status.chromaCode.chunkStrategy}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Overall Progress */}
      <OverallProgress percentage={status.overall} />

      {/* Three Column Layout */}
      <div className="flex-1 overflow-y-auto px-6 py-4 border-t border-white/5">
        <div className="grid grid-cols-3 h-full">
          {/* KG Column */}
          <div className="pr-5">
            <EnrichmentColumn
              title="Knowledge Graph"
            icon={<GitBranch className="w-3.5 h-3.5 text-purple-400" />}
            iconBgClass="bg-purple-500/20"
            status={getStatusFromBoolean(status.knowledgeGraph.active, status.knowledgeGraph.coverage)}
            stats={[
              { label: 'Entities', value: status.knowledgeGraph.entities },
              { label: 'Relations', value: status.knowledgeGraph.relationships },
              { label: 'Clusters', value: status.knowledgeGraph.clusters },
              { label: 'Refs', value: status.knowledgeGraph.topEntities.reduce((sum, e) => sum + e.references, 0) },
            ]}
            featuresContent={kgFeaturesContent}
            coverage={{
              percentage: status.knowledgeGraph.coverage,
            }}
            actions={[
              {
                label: 'Rebuild KG',
                loadingLabel: 'Rebuilding...',
                icon: <RefreshCw className="w-3.5 h-3.5" />,
                onClick: rebuildKG,
                isLoading: operationInProgress === 'kg' || operationInProgress === 'all',
              },
              {
                label: 'View Graph',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: handleViewGraph,
              },
            ]}
            />
          </div>

          {/* LSP Column */}
          <div className="px-5 border-l border-white/10">
            <EnrichmentColumn
              title="LSP"
            icon={<Code2 className="w-3.5 h-3.5 text-blue-400" />}
            iconBgClass="bg-blue-500/20"
            status={getStatusFromBoolean(status.languageServer.active, status.languageServer.coverage)}
            stats={[
              { label: 'Indexed', value: `${status.languageServer.indexedFiles}/${status.languageServer.totalFiles}` },
              { label: 'Symbols', value: status.languageServer.symbols },
            ]}
            featuresContent={lspFeaturesContent}
            coverage={{
              percentage: status.languageServer.coverage,
              sublabel: `${status.languageServer.indexedFiles} / ${status.languageServer.totalFiles} files`,
            }}
            actions={[
              {
                label: 'Re-index',
                loadingLabel: 'Re-indexing...',
                icon: <RefreshCw className="w-3.5 h-3.5" />,
                onClick: reindexLSP,
                isLoading: operationInProgress === 'lsp' || operationInProgress === 'all',
              },
              {
                label: 'Configure LSP',
                icon: <Settings className="w-3.5 h-3.5" />,
                onClick: handleConfigureLSP,
              },
            ]}
            />
          </div>

          {/* CC Column */}
          <div className="pl-5 border-l border-white/10">
            <EnrichmentColumn
              title="ChromaCode"
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            iconBgClass="bg-amber-500/20"
            status={getStatusFromBoolean(status.chromaCode.active, status.chromaCode.coverage)}
            stats={[
              { label: 'Embeddings', value: `${status.chromaCode.embeddings}/${status.chromaCode.totalFiles}` },
              { label: 'Dimensions', value: status.chromaCode.dimensions },
            ]}
            featuresContent={ccFeaturesContent}
            coverage={{
              percentage: status.chromaCode.coverage,
              sublabel: `${status.chromaCode.embeddings} / ${status.chromaCode.totalFiles} embeddings`,
            }}
            actions={[
              {
                label: 'Generate',
                loadingLabel: 'Generating...',
                icon: <RefreshCw className="w-3.5 h-3.5" />,
                onClick: generateEmbeddings,
                isLoading: operationInProgress === 'cc' || operationInProgress === 'all',
              },
              {
                label: 'Configure CC',
                icon: <Settings className="w-3.5 h-3.5" />,
                onClick: handleConfigureCC,
              },
            ]}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <button
            onClick={runAllEnrichments}
            disabled={operationInProgress !== null}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium',
              'text-white bg-blue-600 hover:bg-blue-500',
              'border border-blue-500 rounded-md',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {operationInProgress === 'all' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {operationInProgress === 'all' ? 'Running...' : 'Run All Enrichments'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => console.log('Configure enrichments')}
              disabled={operationInProgress !== null}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium',
                'text-gray-300 hover:text-white',
                'bg-white/5 hover:bg-white/10',
                'border border-white/10 rounded-md',
                'transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
            <button
              onClick={() => console.log('Reset enrichments')}
              disabled={operationInProgress !== null}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium',
                'text-gray-300 hover:text-white',
                'bg-white/5 hover:bg-white/10',
                'border border-white/10 rounded-md',
                'transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {operationInProgress && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {operationInProgress === 'all' && 'Running all enrichments...'}
              {operationInProgress === 'kg' && 'Rebuilding Knowledge Graph...'}
              {operationInProgress === 'lsp' && 'Re-indexing LSP...'}
              {operationInProgress === 'cc' && 'Generating embeddings...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export hook for convenience
export { useEnrichments } from './hooks/useEnrichments';
