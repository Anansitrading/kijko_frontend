// Filter Sidebar for Integrations Tab
// Redesigned to match Projects sidebar style with + New, Search, and Filter buttons

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Filter, Search, X, Check, Github, Slack, Cloud, Zap, HardDrive, Network } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { IntegrationCategory, IntegrationCardData } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';

// Icon mapping for integrations (smaller version for sidebar)
const getIntegrationIcon = (iconName: string): React.ReactNode => {
  const iconClass = 'w-5 h-5';

  switch (iconName) {
    case 'kijko-file-storage':
      return <HardDrive className={iconClass} />;
    case 'kijko-knowledge-graph':
      return <Network className={iconClass} />;
    case 'github':
      return <Github className={iconClass} />;
    case 'slack':
      return <Slack className={iconClass} />;
    case 'zap':
    case 'custom':
      return <Zap className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
};

// Sidebar integration item
function SidebarIntegrationItem({
  integration,
  onClick,
  isSelected,
}: {
  integration: IntegrationCardData;
  onClick: () => void;
  isSelected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors group',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <span className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 bg-muted/50 text-muted-foreground group-hover:text-foreground">
        {integration.iconUrl ? (
          <img
            src={integration.iconUrl}
            alt={integration.name}
            className="w-4 h-4 object-contain"
          />
        ) : (
          getIntegrationIcon(integration.icon)
        )}
      </span>
      <span className="truncate flex-1">{integration.name}</span>
      {integration.isConnected && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            integration.connectionStatus === 'warning' || integration.connectionStatus === 'disconnected'
              ? 'bg-orange-500'
              : 'bg-green-500'
          )}
        />
      )}
    </button>
  );
}

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 240;

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
  onCreateNew?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  integrations: IntegrationCardData[];
  onIntegrationClick?: (id: string) => void;
  selectedIntegrationId?: string | null;
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

export function FilterSidebar({
  filters,
  onFiltersChange,
  onCreateNew,
  searchQuery,
  onSearchChange,
  integrations,
  onIntegrationClick,
  selectedIntegrationId,
}: FilterSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const activeFilterCount =
    filters.selectedCategories.length +
    filters.selectedStatuses.length +
    filters.selectedTypes.length;

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth]
  );

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth.current + delta)
      );
      setSidebarWidth(newWidth);
    };

    const handleResizeEnd = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  return (
    <aside className="shrink-0 relative" style={{ width: sidebarWidth }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
      />
      <div className="pr-4 border-r border-border h-full overflow-y-auto flex flex-col">
        {/* Create New Button, Search & Filter */}
        <div className="mb-4">
          <div className="flex gap-2">
            <button
              onClick={onCreateNew}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={16} />
              <span>New</span>
            </button>

            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'flex items-center justify-center p-2 border rounded-lg transition-colors',
                showSearch
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title="Search integrations"
            >
              <Search size={16} />
            </button>

            {/* Filter Button */}
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => {
                  if (!isFilterDropdownOpen && filterButtonRef.current) {
                    const rect = filterButtonRef.current.getBoundingClientRect();
                    setDropdownPosition({
                      top: rect.bottom + 8,
                      left: rect.left,
                    });
                  }
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                }}
                className={cn(
                  'flex items-center justify-center p-2 border rounded-lg transition-colors',
                  activeFilterCount > 0
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title="Filter integrations"
              >
                <Filter size={16} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {isFilterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFilterDropdownOpen(false)}
                  />
                  <div
                    className="fixed min-w-[220px] bg-card border border-border rounded-lg shadow-xl z-50 py-3 max-h-[70vh] overflow-y-auto"
                    style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                  >
                    {/* Header with clear button */}
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-border mb-3">
                      <span className="text-sm font-medium text-foreground">Filters</span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => onFiltersChange(DEFAULT_SIDEBAR_FILTERS)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X size={12} />
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Status Filters */}
                    <div className="px-4 mb-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Status
                      </span>
                      <div className="flex flex-col gap-1">
                        {STATUS_OPTIONS.map((option) => {
                          const isActive = filters.selectedStatuses.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                onFiltersChange({
                                  ...filters,
                                  selectedStatuses: toggleItem(
                                    filters.selectedStatuses,
                                    option.value
                                  ),
                                })
                              }
                              className={cn(
                                'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground hover:bg-muted'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                  isActive
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground/40'
                                )}
                              >
                                {isActive && <Check size={12} className="text-primary-foreground" />}
                              </span>
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Type Filters */}
                    <div className="px-4 mb-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Type
                      </span>
                      <div className="flex flex-col gap-1">
                        {TYPE_OPTIONS.map((option) => {
                          const isActive = filters.selectedTypes.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                onFiltersChange({
                                  ...filters,
                                  selectedTypes: toggleItem(filters.selectedTypes, option.value),
                                })
                              }
                              className={cn(
                                'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground hover:bg-muted'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                  isActive
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground/40'
                                )}
                              >
                                {isActive && <Check size={12} className="text-primary-foreground" />}
                              </span>
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category Filters */}
                    <div className="px-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Categories
                      </span>
                      <div className="flex flex-col gap-1">
                        {CATEGORY_OPTIONS.map((option) => {
                          const isActive = filters.selectedCategories.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                onFiltersChange({
                                  ...filters,
                                  selectedCategories: toggleItem(
                                    filters.selectedCategories,
                                    option.value
                                  ),
                                })
                              }
                              className={cn(
                                'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground hover:bg-muted'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                  isActive
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground/40'
                                )}
                              >
                                {isActive && <Check size={12} className="text-primary-foreground" />}
                              </span>
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Input (collapsible) */}
          {showSearch && (
            <div className="mt-3">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search integrations..."
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* Integrations List */}
        <div className="flex-1 min-h-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Integrations ({integrations.length})
          </div>
          <div className="flex flex-col gap-0.5">
            {integrations.map((integration) => (
              <SidebarIntegrationItem
                key={integration.id}
                integration={integration}
                onClick={() => onIntegrationClick?.(integration.id)}
                isSelected={selectedIntegrationId === integration.id}
              />
            ))}
            {integrations.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No integrations found
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
