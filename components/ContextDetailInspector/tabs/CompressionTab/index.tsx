import { AlertCircle } from 'lucide-react';
import type { TabProps } from '../../../../types/contextInspector';
import { useCompressionData } from './hooks';
import { CompressionStats } from './CompressionStats';
import { CompressionProgress } from './CompressionProgress';
import { IngestionHistory } from './IngestionHistory';
import { CompressionDetails } from './CompressionDetails';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-24 bg-slate-800/50 rounded-lg" />
        ))}
      </div>
      <div className="h-16 bg-slate-800/50 rounded-lg" />
      <div className="h-8 w-48 bg-slate-800/50 rounded" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-800/30 rounded-lg" />
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
    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
      <CompressionStats metrics={metrics} />

      <CompressionProgress
        savingsPercent={metrics.savingsPercent}
        tokensSaved={tokensSaved}
        costSavings={metrics.costSavings}
      />

      <div className="border-t border-white/5 pt-6">
        <IngestionHistory
          totalIngestions={metrics.totalIngestions}
          lastIngestion={metrics.lastIngestion}
          avgInterval={metrics.avgInterval}
          history={history}
        />
      </div>

      <div className="border-t border-white/5 pt-6">
        <CompressionDetails algorithmInfo={algorithmInfo} />
      </div>
    </div>
  );
}
