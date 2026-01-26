// Filter Sidebar for Integrations Tab
// Left sidebar with collapsible filter sections

import { Filter } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { IntegrationCategory } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';

export interface SidebarFilters {
  selectedCategories: IntegrationCategory[];
  selectedStatuses: ('connected' | 'warning' | 'disconnected' | 'default')[];
  selectedTypes: ('pre-built' | 'custom')[];
}

export const DEFAULT_SIDEBAR_FILTERS: SidebarFilters = {
  selectedCategories: [],
  selectedStatuses: [],
  selectedTypes: [],
};

interface FilterSidebarProps {
  filters: SidebarFilters;
  onFiltersChange: (filters: SidebarFilters) => void;
}

// Filter section definitions
const STATUS_OPTIONS: { value: SidebarFilters['selectedStatuses'][number]; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'connected', label: 'Connected' },
  { value: 'warning', label: 'Warning' },
  { value: 'disconnected', label: 'Disconnected' },
];

const TYPE_OPTIONS: { value: SidebarFilters['selectedTypes'][number]; label: string }[] = [
  { value: 'pre-built', label: 'Pre-built' },
  { value: 'custom', label: 'Custom' },
];

const CATEGORY_OPTIONS: { value: IntegrationCategory; label: string }[] = Object.entries(
  INTEGRATION_CATEGORIES
).map(([value, label]) => ({
  value: value as IntegrationCategory,
  label,
}));

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const hasActiveFilters =
    filters.selectedCategories.length > 0 ||
    filters.selectedStatuses.length > 0 ||
    filters.selectedTypes.length > 0;

  return (
    <aside className="w-52 shrink-0 pr-6 border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter size={14} />
          Filter by
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange(DEFAULT_SIDEBAR_FILTERS)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status Section */}
      <FilterSection title="Status">
        {STATUS_OPTIONS.map((option) => (
          <FilterItem
            key={option.value}
            label={option.label}
            isActive={filters.selectedStatuses.includes(option.value)}
            onClick={() =>
              onFiltersChange({
                ...filters,
                selectedStatuses: toggleItem(filters.selectedStatuses, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      {/* Type Section */}
      <FilterSection title="Type">
        {TYPE_OPTIONS.map((option) => (
          <FilterItem
            key={option.value}
            label={option.label}
            isActive={filters.selectedTypes.includes(option.value)}
            onClick={() =>
              onFiltersChange({
                ...filters,
                selectedTypes: toggleItem(filters.selectedTypes, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      {/* Categories Section */}
      <FilterSection title="Categories">
        {CATEGORY_OPTIONS.map((option) => (
          <FilterItem
            key={option.value}
            label={option.label}
            isActive={filters.selectedCategories.includes(option.value)}
            onClick={() =>
              onFiltersChange({
                ...filters,
                selectedCategories: toggleItem(filters.selectedCategories, option.value),
              })
            }
          />
        ))}
      </FilterSection>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function FilterItem({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          isActive ? 'bg-primary' : 'bg-muted-foreground/40'
        )}
      />
      {label}
    </button>
  );
}

export default FilterSidebar;
