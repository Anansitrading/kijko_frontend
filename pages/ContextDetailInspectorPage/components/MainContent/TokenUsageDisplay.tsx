import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface TokenUsageDisplayProps {
  currentTokens: number;
  maxTokens?: number;
  className?: string;
}

// Warning threshold (when to show warning state)
const WARNING_THRESHOLD = 0.8; // 80%

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function TokenUsageDisplay({
  currentTokens,
  maxTokens = 128000,
  className,
}: TokenUsageDisplayProps) {
  // Calculate percentage and warning state
  const { percentage, isWarning, isNearLimit } = useMemo(() => {
    const pct = Math.min((currentTokens / maxTokens) * 100, 100);
    return {
      percentage: pct,
      isWarning: pct >= WARNING_THRESHOLD * 100,
      isNearLimit: pct >= 95,
    };
  }, [currentTokens, maxTokens]);

  // Determine progress bar color
  const progressColor = useMemo(() => {
    if (isNearLimit) return 'bg-red-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-blue-500';
  }, [isWarning, isNearLimit]);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Warning icon when near limit */}
      {isWarning && (
        <AlertTriangle
          className={cn(
            'w-4 h-4 flex-shrink-0',
            isNearLimit ? 'text-red-500' : 'text-amber-500'
          )}
        />
      )}

      {/* Token count text */}
      <div className="flex items-center gap-1.5 text-sm">
        <span
          className={cn(
            'font-medium',
            isNearLimit
              ? 'text-red-400'
              : isWarning
              ? 'text-amber-400'
              : 'text-gray-300'
          )}
        >
          {formatNumber(currentTokens)}
        </span>
        <span className="text-gray-500">/</span>
        <span className="text-gray-500">{formatNumber(maxTokens)}</span>
        <span className="text-gray-500 text-xs ml-0.5">tokens</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-[60px] max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', progressColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
