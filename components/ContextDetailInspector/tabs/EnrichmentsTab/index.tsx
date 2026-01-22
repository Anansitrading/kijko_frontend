import { useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Zap, Settings, RotateCcw } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useEnrichments } from './hooks/useEnrichments';
import { OverallProgress } from './OverallProgress';
import { KnowledgeGraphSection } from './KnowledgeGraphSection';
import { LSPSection } from './LSPSection';
import { ChromaCodeSection } from './ChromaCodeSection';

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

  // Action handlers for KG section
  const handleViewGraph = useCallback(() => {
    // Will be implemented in a future sprint
    console.log('View graph for context:', contextId);
  }, [contextId]);

  // Action handlers for LSP section
  const handleConfigureLSP = useCallback(() => {
    // Will be implemented in a future sprint
    console.log('Configure LSP for context:', contextId);
  }, [contextId]);

  // Action handlers for ChromaCode section
  const handleConfigureCC = useCallback(() => {
    // Will be implemented in a future sprint
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

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overall Progress */}
        <OverallProgress percentage={status.overall} />

        {/* Knowledge Graph Section */}
        <KnowledgeGraphSection
          data={status.knowledgeGraph}
          onViewGraph={handleViewGraph}
          onRebuild={rebuildKG}
          isRebuilding={operationInProgress === 'kg'}
        />

        {/* LSP Section */}
        <LSPSection
          data={status.languageServer}
          onReindex={reindexLSP}
          onConfigure={handleConfigureLSP}
          isReindexing={operationInProgress === 'lsp'}
        />

        {/* ChromaCode Section */}
        <ChromaCodeSection
          data={status.chromaCode}
          onGenerate={generateEmbeddings}
          onConfigure={handleConfigureCC}
          isGenerating={operationInProgress === 'cc'}
        />
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          </div>

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

        {/* Operation progress indicator */}
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
