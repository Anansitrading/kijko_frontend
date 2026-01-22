import { Activity } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { ProgressBar, getCoverageStatus } from '../../../common';

interface OverallProgressProps {
  percentage: number;
}

export function OverallProgress({ percentage }: OverallProgressProps) {
  const status = getCoverageStatus(percentage);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            status === 'good' && 'bg-emerald-500/20',
            status === 'warning' && 'bg-amber-500/20',
            status === 'critical' && 'bg-red-500/20'
          )}
        >
          <Activity
            className={cn(
              'w-4 h-4',
              status === 'good' && 'text-emerald-400',
              status === 'warning' && 'text-amber-400',
              status === 'critical' && 'text-red-400'
            )}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">Overall Enrichment</h3>
          <p className="text-xs text-gray-400">Combined coverage across all enrichment systems</p>
        </div>
      </div>

      <ProgressBar
        percentage={percentage}
        showLabel
        labelPosition="right"
        size="lg"
        className="mt-2"
      />
    </div>
  );
}
