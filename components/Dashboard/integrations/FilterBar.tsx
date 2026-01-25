// FilterBar Component for Integrations Tab
// Search, category filter, status filter, and sort options

import { Search, ChevronDown, Filter } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import type {
  IntegrationsFilterState,
  FilterBarProps,
  IntegrationCategory,
} from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';

const CATEGORY_OPTIONS: { value: IntegrationCategory | 'custom' | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...Object.entries(INTEGRATION_CATEGORIES).map(([value, label]) => ({
    value: value as IntegrationCategory,
    label,
  })),
  { value: 'custom', label: 'Custom' },
];

const SORT_OPTIONS: { value: IntegrationsFilterState['sortBy']; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'name', label: 'A-Z' },
  { value: 'recent', label: 'Recently Added' },
];

const STATUS_OPTIONS: { value: IntegrationsFilterState['statusFilter']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'connected', label: 'Connected' },
  { value: 'issues', label: 'Issues' },
];

export function FilterBar({
  filters,
  onFiltersChange,
  showStatusFilter = false,
  showConnectedToggle = false,
}: FilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const updateFilter = <K extends keyof IntegrationsFilterState>(
    key: K,
    value: IntegrationsFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value as typeof filters.category)}
          className="min-w-[160px] bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-card text-foreground">
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors min-w-[140px]"
          >
            <span>{SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}</span>
            <ChevronDown
              size={16}
              className={cn('ml-auto transition-transform', isSortOpen && 'rotate-180')}
            />
          </button>

          {isSortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
              <div className="absolute right-0 mt-2 w-full bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('sortBy', option.value);
                      setIsSortOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-sm text-left transition-colors',
                      filters.sortBy === option.value
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: Toggle filters */}
      <div className="flex items-center gap-4">
        {/* Status Filter (for My Integrations) */}
        {showStatusFilter && (
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter('statusFilter', option.value)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-all',
                  filters.statusFilter === option.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Show Connected Only Toggle */}
        {showConnectedToggle && (
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <div
              className={cn(
                'relative inline-flex w-9 h-5 rounded-full cursor-pointer transition-colors duration-200',
                filters.showConnectedOnly ? 'bg-primary' : 'bg-muted'
              )}
              onClick={() => updateFilter('showConnectedOnly', !filters.showConnectedOnly)}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                  filters.showConnectedOnly && 'translate-x-4'
                )}
              />
            </div>
            <span className="text-muted-foreground">Show connected only</span>
          </label>
        )}

        {/* Active filters indicator */}
        {(filters.search || filters.category !== 'all' || filters.showConnectedOnly) && (
          <button
            onClick={() =>
              onFiltersChange({
                ...filters,
                search: '',
                category: 'all',
                showConnectedOnly: false,
              })
            }
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Filter size={14} />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
