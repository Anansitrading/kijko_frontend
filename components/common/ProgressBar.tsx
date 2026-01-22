import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type CoverageStatus = 'good' | 'warning' | 'critical';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  labelPosition?: 'left' | 'right' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showWarningIcon?: boolean;
  className?: string;
}

export function getCoverageStatus(percentage: number): CoverageStatus {
  if (percentage >= 75) return 'good';
  if (percentage >= 50) return 'warning';
  return 'critical';
}

const statusColors: Record<CoverageStatus, { bar: string; bg: string }> = {
  good: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-500/20',
  },
  warning: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-500/20',
  },
  critical: {
    bar: 'bg-red-500',
    bg: 'bg-red-500/20',
  },
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  percentage,
  showLabel = true,
  labelPosition = 'left',
  size = 'md',
  animated = true,
  showWarningIcon = true,
  className,
}: ProgressBarProps) {
  const status = getCoverageStatus(percentage);
  const colors = statusColors[status];
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const label = (
    <span
      className={cn(
        'text-sm font-medium tabular-nums',
        status === 'good' && 'text-emerald-400',
        status === 'warning' && 'text-amber-400',
        status === 'critical' && 'text-red-400'
      )}
    >
      {clampedPercentage.toFixed(1)}%
    </span>
  );

  const warningIcon = showWarningIcon && status === 'critical' && (
    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
  );

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLabel && labelPosition === 'left' && (
        <div className="flex items-center gap-1.5 shrink-0">
          {warningIcon}
          {label}
        </div>
      )}

      <div className={cn('flex-1 rounded-full overflow-hidden', colors.bg, sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full',
            colors.bar,
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      {showLabel && labelPosition === 'right' && (
        <div className="flex items-center gap-1.5 shrink-0">
          {label}
          {warningIcon}
        </div>
      )}

      {showLabel && labelPosition === 'inline' && (
        <div className="flex items-center gap-1.5 shrink-0 min-w-[60px] justify-end">
          {warningIcon}
          {label}
        </div>
      )}
    </div>
  );
}
