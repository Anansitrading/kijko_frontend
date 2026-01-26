import { AlertCircle } from 'lucide-react';
import type { TabProps } from '../../../../types/contextInspector';
import { useCompressionData } from './hooks';
import { CompressionStats } from './CompressionStats';
import { CompressionProgress } from './CompressionProgress';
import { CompressionDetails } from './CompressionDetails';
import { CompressionFileLists } from './CompressionFileLists';

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4 max-w-2xl">
        <div className="h-14 bg-slate-800/50 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-slate-800/50 rounded-lg" />
          ))}
        </div>
        <div className="h-28 bg-slate-800/50 rounded-lg" />
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
    algorithmInfo,
    compressedFiles,
    pendingFiles,
    neverCompressFiles,
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
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-5">
        <CompressionProgress
          savingsPercent={metrics.savingsPercent}
          ratio={metrics.ratio}
          costSavings={metrics.costSavings}
        />

        <CompressionStats metrics={metrics} tokensSaved={tokensSaved} />

        <div className="border-t border-white/5 pt-5">
          <CompressionFileLists
            compressedFiles={compressedFiles}
            pendingFiles={pendingFiles}
            neverCompressFiles={neverCompressFiles}
          />
        </div>

        <div className="border-t border-white/5 pt-5">
          <CompressionDetails algorithmInfo={algorithmInfo} />
        </div>
      </div>
    </div>
  );
}
