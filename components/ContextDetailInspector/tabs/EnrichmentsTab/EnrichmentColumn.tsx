import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { StatusBadge, type StatusType } from '../../../common/StatusBadge';
import { ProgressBar } from '../../../common/ProgressBar';

interface StatItem {
  label: string;
  value: string | number;
}

interface ActionButton {
  label: string;
  loadingLabel?: string;
  icon: ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'primary';
}

interface EnrichmentColumnProps {
  title: string;
  icon: ReactNode;
  iconBgClass: string;
  status: StatusType;
  stats: StatItem[];
  coverage: {
    percentage: number;
    label?: string;
    sublabel?: string;
  };
  featuresContent?: ReactNode;
  actions: ActionButton[];
}

function StatCard({ label, value }: StatItem) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-center">
      <div className="text-base font-semibold text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] text-gray-400 uppercase">{label}</div>
    </div>
  );
}

export function EnrichmentColumn({
  title,
  icon,
  iconBgClass,
  status,
  stats,
  coverage,
  featuresContent,
  actions,
}: EnrichmentColumnProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg', iconBgClass)}>
            {icon}
          </div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Features/Entities Content */}
      {featuresContent && (
        <div className="mb-3 flex-1 min-h-0 overflow-y-auto">
          {featuresContent}
        </div>
      )}

      {/* Coverage Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 uppercase">{coverage.label || 'Coverage'}</span>
          {coverage.sublabel && (
            <span className="text-[10px] text-gray-500">{coverage.sublabel}</span>
          )}
        </div>
        <ProgressBar percentage={coverage.percentage} labelPosition="inline" size="sm" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 mt-auto">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.isLoading}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium',
              'border rounded-md transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              action.variant === 'primary'
                ? 'text-white bg-blue-600 hover:bg-blue-500 border-blue-500'
                : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
            )}
          >
            {action.isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              action.icon
            )}
            {action.isLoading ? (action.loadingLabel || 'Loading...') : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
