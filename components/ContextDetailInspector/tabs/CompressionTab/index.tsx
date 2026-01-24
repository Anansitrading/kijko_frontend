import { AlertCircle } from 'lucide-react';
import type { TabProps } from '../../../../types/contextInspector';
import { useCompressionData } from './hooks';
import { CompressionStats } from './CompressionStats';
import { CompressionProgress } from './CompressionProgress';
import { IngestionHistory } from './IngestionHistory';
import { CompressionDetails } from './CompressionDetails';

function LoadingSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      <div className="flex-1 space-y-4 max-w-md">
        <div className="h-14 bg-slate-800/50 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-slate-800/50 rounded-lg" />
          ))}
        </div>
        <div className="h-28 bg-slate-800/50 rounded-lg" />
      </div>
      <div className="w-80 space-y-2">
        <div className="h-8 w-48 bg-slate-800/50 rounded" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-slate-800/30 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Failed to load compression data</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function CompressionTab({ contextItem }: TabProps) {
  const {
    metrics,
    history,
    algorithmInfo,
    isLoading,
    error,
    refresh,
  } = useCompressionData(contextItem.id);

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !metrics || !algorithmInfo) {
    return (
      <div className="p-6">
        <ErrorState
          message={error || 'Unable to load compression data'}
          onRetry={refresh}
        />
      </div>
    );
  }

  const tokensSaved = metrics.originalTokens - metrics.compressedTokens;

  return (
    <div className="p-6 overflow-y-auto custom-scrollbar">
      <div className="flex gap-6">
        {/* Left column: Progress bar, token stats, algorithm details */}
        <div className="flex-1 space-y-5 min-w-0 max-w-md">
          <CompressionProgress
            savingsPercent={metrics.savingsPercent}
            ratio={metrics.ratio}
            costSavings={metrics.costSavings}
          />

          <CompressionStats metrics={metrics} tokensSaved={tokensSaved} />

          <div className="border-t border-white/5 pt-5">
            <CompressionDetails algorithmInfo={algorithmInfo} />
          </div>
        </div>

        {/* Right column: Ingestion history */}
        <div className="w-80 flex-shrink-0 border-l border-white/5 pl-6">
          <IngestionHistory
            totalIngestions={metrics.totalIngestions}
            lastIngestion={metrics.lastIngestion}
            avgInterval={metrics.avgInterval}
            history={history}
          />
        </div>
      </div>
    </div>
  );
}
