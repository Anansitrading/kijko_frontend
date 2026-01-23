// Audit Filters Component
// Setting Sprint 10: Audit Log

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  X,
  Save,
  Star,
  Trash2,
  ChevronDown,
  User,
  Folder,
  Users,
  Shield,
  Link,
  Server,
} from 'lucide-react';
import type {
  AuditLogFilters,
  AuditLogSavedFilter,
  AuditEventCategory,
  AuditEventType,
  AuditDateRangePreset,
} from '../../../types/settings';
import { AUDIT_CATEGORY_CONFIG, AUDIT_EVENT_TYPE_LABELS } from '../../../types/settings';
import { getDateRangeFromPreset } from '../../../lib/audit-log';

interface AuditFiltersProps {
  filters: AuditLogFilters;
  savedFilters: AuditLogSavedFilter[];
  teamMembers: { id: string; name: string; email: string }[];
  onFiltersChange: (filters: AuditLogFilters) => void;
  onSaveFilter: (name: string, isShared: boolean) => Promise<void>;
  onApplySavedFilter: (filterId: string) => void;
  onDeleteSavedFilter: (filterId: string) => Promise<void>;
}

const categories: AuditEventCategory[] = ['user', 'context', 'team', 'security', 'integration', 'system'];

const eventTypesByCategory: Record<AuditEventCategory, AuditEventType[]> = {
  user: ['user.login', 'user.logout', 'user.profile_updated', 'user.password_changed', 'user.2fa_enabled', 'user.2fa_disabled'],
  context: ['context.created', 'context.updated', 'context.deleted', 'context.shared', 'context.exported'],
  team: ['team.member_invited', 'team.member_joined', 'team.member_removed', 'team.role_changed'],
  security: ['security.login_failed', 'security.session_terminated', 'security.api_key_created', 'security.api_key_revoked'],
  integration: ['integration.connected', 'integration.disconnected', 'integration.webhook_triggered'],
  system: ['system.export_completed', 'system.backup_created'],
};

const datePresets: { id: AuditDateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom range' },
];

function getCategoryIcon(category: AuditEventCategory) {
  const icons: Record<AuditEventCategory, React.ReactNode> = {
    user: <User className="w-4 h-4" />,
    context: <Folder className="w-4 h-4" />,
    team: <Users className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    integration: <Link className="w-4 h-4" />,
    system: <Server className="w-4 h-4" />,
  };
  return icons[category];
}

export function AuditFilters({
  filters,
  savedFilters,
  teamMembers,
  onFiltersChange,
  onSaveFilter,
  onApplySavedFilter,
  onDeleteSavedFilter,
}: AuditFiltersProps) {
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AuditDateRangePreset>('30days');
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.userId) count++;
    if (filters.eventCategory) count++;
    if (filters.eventTypes && filters.eventTypes.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query || undefined });
  };

  const handleCategoryChange = (category: AuditEventCategory | undefined) => {
    onFiltersChange({
      ...filters,
      eventCategory: category,
      eventTypes: undefined, // Clear event types when category changes
    });
  };

  const handleEventTypeToggle = (eventType: AuditEventType) => {
    const currentTypes = filters.eventTypes || [];
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter((t) => t !== eventType)
      : [...currentTypes, eventType];
    onFiltersChange({
      ...filters,
      eventTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleUserChange = (userId: string | undefined) => {
    onFiltersChange({ ...filters, userId });
  };

  const handlePresetChange = (preset: AuditDateRangePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const { from, to } = getDateRangeFromPreset(preset);
      onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
    }
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', dateStr: string) => {
    const date = dateStr ? new Date(dateStr) : undefined;
    onFiltersChange({ ...filters, [field]: date });
    setSelectedPreset('custom');
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    setSelectedPreset('30days');
  };

  const handleSaveFilter = async () => {
    if (filterName.trim()) {
      await onSaveFilter(filterName.trim(), isShared);
      setShowSaveModal(false);
      setFilterName('');
      setIsShared(false);
    }
  };

  const appliedEventTypes = filters.eventCategory
    ? eventTypesByCategory[filters.eventCategory]
    : [];

  return (
    <div className="space-y-4">
      {/* Search and quick actions row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFiltersPanel || activeFilterCount > 0
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Saved filters dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSavedFilters(!showSavedFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star className="w-4 h-4" />
            Saved
            <ChevronDown className="w-4 h-4" />
          </button>

          {showSavedFilters && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSavedFilters(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20">
                <div className="p-2">
                  {savedFilters.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      No saved filters
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {savedFilters.map((sf) => (
                        <div
                          key={sf.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md group"
                        >
                          <button
                            onClick={() => {
                              onApplySavedFilter(sf.id);
                              setShowSavedFilters(false);
                            }}
                            className="flex-1 text-left text-sm text-foreground"
                          >
                            {sf.name}
                            {sf.isShared && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Shared)
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteSavedFilter(sf.id)}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => {
                        setShowSaveModal(true);
                        setShowSavedFilters(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-md"
                    >
                      <Save className="w-4 h-4" />
                      Save current filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFiltersPanel && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                User
              </label>
              <select
                value={filters.userId || ''}
                onChange={(e) => handleUserChange(e.target.value || undefined)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All users</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Category
              </label>
              <select
                value={filters.eventCategory || ''}
                onChange={(e) =>
                  handleCategoryChange(
                    (e.target.value as AuditEventCategory) || undefined
                  )
                }
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {AUDIT_CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date preset filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Date Range
              </label>
              <select
                value={selectedPreset}
                onChange={(e) =>
                  handlePresetChange(e.target.value as AuditDateRangePreset)
                }
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                {datePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom date range */}
            {selectedPreset === 'custom' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    From
                  </label>
                  <input
                    type="date"
                    value={
                      filters.dateFrom
                        ? filters.dateFrom.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    To
                  </label>
                  <input
                    type="date"
                    value={
                      filters.dateTo
                        ? filters.dateTo.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleDateChange('dateTo', e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Event types filter (when category is selected) */}
          {filters.eventCategory && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Event Types
              </label>
              <div className="flex flex-wrap gap-2">
                {appliedEventTypes.map((eventType) => {
                  const isSelected = filters.eventTypes?.includes(eventType);
                  const label = AUDIT_EVENT_TYPE_LABELS[eventType] || eventType;
                  return (
                    <button
                      key={eventType}
                      onClick={() => handleEventTypeToggle(eventType)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filters and clear button */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={handleClearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save filter modal */}
      {showSaveModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-lg shadow-xl z-50 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Save Filter
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., Security events this week"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  Share with team members
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Filter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AuditFilters;
