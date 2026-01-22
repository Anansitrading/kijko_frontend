import { ChevronDown, Download } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChangelogEntryType, TimeRange } from '../../../../types/contextInspector';

interface FilterToolbarProps {
  typeFilter: ChangelogEntryType | 'all';
  timeFilter: TimeRange;
  onTypeChange: (type: ChangelogEntryType | 'all') => void;
  onTimeChange: (range: TimeRange) => void;
  onExport: () => void;
  totalCount: number;
}

const TYPE_OPTIONS: { value: ChangelogEntryType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Changes' },
  { value: 'ingestion', label: 'Ingestions' },
  { value: 'enrichment', label: 'Enrichments' },
  { value: 'config', label: 'Configuration' },
  { value: 'access', label: 'Access Changes' },
];

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function FilterToolbar({
  typeFilter,
  timeFilter,
  onTypeChange,
  onTimeChange,
  onExport,
  totalCount,
}: FilterToolbarProps) {
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label || 'All Changes';
  const timeLabel = TIME_OPTIONS.find((o) => o.value === timeFilter)?.label || 'Last 30 days';

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      {/* Left side: Filters */}
      <div className="flex items-center gap-3">
        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value as ChangelogEntryType | 'all')}
            className={cn(
              'appearance-none bg-white/5 border border-white/10 rounded-md',
              'pl-3 pr-8 py-1.5 text-sm text-white',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'cursor-pointer hover:bg-white/10 transition-colors'
            )}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Time Filter */}
        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => onTimeChange(e.target.value as TimeRange)}
            className={cn(
              'appearance-none bg-white/5 border border-white/10 rounded-md',
              'pl-3 pr-8 py-1.5 text-sm text-white',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'cursor-pointer hover:bg-white/10 transition-colors'
            )}
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Count indicator */}
        <span className="text-xs text-gray-500">
          {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Right side: Export */}
      <button
        onClick={onExport}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm',
          'bg-white/5 hover:bg-white/10 border border-white/10',
          'text-gray-300 hover:text-white rounded-md',
          'transition-colors duration-150'
        )}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>
    </div>
  );
}
