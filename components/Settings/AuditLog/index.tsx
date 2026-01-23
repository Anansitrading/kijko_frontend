// Audit Log Section - Main Entry Point
// Setting Sprint 10: Audit Log

export { AuditTimeline } from './AuditTimeline';
export { AuditEventCard } from './AuditEventCard';
export { AuditFilters } from './AuditFilters';
export { ExportModal } from './ExportModal';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, AlertTriangle, Shield } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSavedFilter,
  AuditExportRequest,
  PlanTier,
} from '../../../types/settings';
import {
  generateMockAuditEntries,
  filterAuditEntries,
  exportToCSV,
  exportToJSON,
  getRetentionMessage,
  isFullAuditAvailable,
  getDateRangeFromPreset,
} from '../../../lib/audit-log';
import { AuditTimeline } from './AuditTimeline';
import { AuditFilters } from './AuditFilters';
import { ExportModal } from './ExportModal';

interface AuditLogSectionProps {
  currentPlan?: PlanTier;
}

// Page size for pagination
const PAGE_SIZE = 20;

export function AuditLogSection({ currentPlan = 'pro' }: AuditLogSectionProps) {
  const { state } = useSettings();

  // State - all hooks must be called before any conditional return
  const [allEntries, setAllEntries] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>(() => {
    const { from, to } = getDateRangeFromPreset('30days');
    return { dateFrom: from, dateTo: to };
  });
  const [savedFilters, setSavedFilters] = useState<AuditLogSavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [showExportModal, setShowExportModal] = useState(false);

  const teamMembers = useMemo(() => [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com' },
  ], []);

  const filteredEntries = useMemo(() => {
    return filterAuditEntries(allEntries, filters);
  }, [allEntries, filters]);

  const displayedEntries = useMemo(() => {
    return filteredEntries.slice(0, displayCount);
  }, [filteredEntries, displayCount]);

  const hasMore = displayCount < filteredEntries.length;

  const handleLoadMore = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredEntries.length));
  }, [filteredEntries.length]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockEntries = generateMockAuditEntries(100);
    setAllEntries(mockEntries);
    setDisplayCount(PAGE_SIZE);
    setIsLoading(false);
  }, []);

  const handleFiltersChange = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setDisplayCount(PAGE_SIZE);
  }, []);

  const handleSaveFilter = useCallback(async (name: string, isShared: boolean) => {
    const newFilter: AuditLogSavedFilter = {
      id: `filter-${Date.now()}`,
      teamId: 'team-1',
      userId: 'user-1',
      name,
      filters: { ...filters },
      isShared,
      createdAt: new Date(),
    };
    setSavedFilters((prev) => [...prev, newFilter]);
  }, [filters]);

  const handleApplySavedFilter = useCallback((filterId: string) => {
    const savedFilter = savedFilters.find((f) => f.id === filterId);
    if (savedFilter) {
      setFilters(savedFilter.filters);
      setDisplayCount(PAGE_SIZE);
    }
  }, [savedFilters]);

  const handleDeleteSavedFilter = useCallback(async (filterId: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  const handleEntryClick = useCallback((entry: AuditLogEntry) => {
    console.log('Entry clicked:', entry);
  }, []);

  const handleExport = useCallback(async (request: AuditExportRequest) => {
    const entriesToExport = filterAuditEntries(allEntries, request.filters);

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (request.format) {
      case 'csv':
        content = exportToCSV(entriesToExport);
        filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = exportToJSON(entriesToExport);
        filename = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'pdf':
        alert('PDF export would be generated here (requires PDF library)');
        return;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (request.schedule) {
      alert(`Scheduled ${request.schedule} export set up successfully!`);
    }
  }, [allEntries]);

  // Load mock data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockEntries = generateMockAuditEntries(100);
      setAllEntries(mockEntries);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Only render when audit-log section is active
  if (state.activeSection !== 'audit-log') {
    return null;
  }

  const retentionMessage = getRetentionMessage(currentPlan);
  const hasFullAudit = isFullAuditAvailable(currentPlan);

  return (
    <div className="space-y-6">
      {/* Header with export button and info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Track all activity and changes in your workspace. {retentionMessage}.
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Plan restriction notice */}
      {!hasFullAudit && (
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Limited Audit Log Access
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your current plan ({currentPlan}) includes {currentPlan === 'free' ? '7' : '30'} days of audit history.
              Upgrade to Teams or Enterprise for extended retention and advanced features.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <AuditFilters
        filters={filters}
        savedFilters={savedFilters}
        teamMembers={teamMembers}
        onFiltersChange={handleFiltersChange}
        onSaveFilter={handleSaveFilter}
        onApplySavedFilter={handleApplySavedFilter}
        onDeleteSavedFilter={handleDeleteSavedFilter}
      />

      {/* Results count */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {displayedEntries.length} of {filteredEntries.length} events
          </span>
          {filteredEntries.length !== allEntries.length && (
            <span className="text-primary">
              Filtered from {allEntries.length} total events
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <AuditTimeline
        entries={displayedEntries}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onEntryClick={handleEntryClick}
        onRefresh={handleRefresh}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        filters={filters}
        currentPlan={currentPlan}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />

      {/* Footer info */}
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-lg text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>
          All audit log entries are stored securely and cannot be modified or deleted.
          Data is automatically purged after your plan's retention period.
        </span>
      </div>
    </div>
  );
}

export default AuditLogSection;
