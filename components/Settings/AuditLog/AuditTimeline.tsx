// Audit Timeline Component
// Setting Sprint 10: Audit Log

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Loader2, Calendar, RefreshCw } from 'lucide-react';
import type { AuditLogEntry } from '../../../types/settings';
import { groupEntriesByDate } from '../../../lib/audit-log';
import AuditEventCard from './AuditEventCard';

interface AuditTimelineProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onEntryClick: (entry: AuditLogEntry) => void;
  onRefresh?: () => Promise<void>;
}

export function AuditTimeline({
  entries,
  isLoading,
  hasMore,
  onLoadMore,
  onEntryClick,
  onRefresh,
}: AuditTimelineProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Group entries by date
  const groupedEntries = groupEntriesByDate(entries);

  // Handle toggle expand
  const handleToggleExpand = (entryId: string) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

  // Infinite scroll observer
  const lastEntryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setIsLoadingMore(true);
            onLoadMore().finally(() => setIsLoadingMore(false));
          }
        },
        { threshold: 0.1 }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore, onLoadMore]
  );

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  // Initial loading state
  if (isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading audit log...</p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No events found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No audit log entries match your current filters. Try adjusting the
          filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Timeline grouped by date */}
      {Array.from(groupedEntries.entries()).map(([dateKey, dateEntries], groupIndex) => (
        <div key={dateKey} className="space-y-3">
          {/* Date header */}
          <div className="sticky top-0 z-10 bg-background py-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-secondary rounded-full">
                {dateKey}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Events for this date */}
          <div className="space-y-3">
            {dateEntries.map((entry, entryIndex) => {
              // Check if this is the last entry in the entire list
              const isLastEntry =
                groupIndex === groupedEntries.size - 1 &&
                entryIndex === dateEntries.length - 1;

              return (
                <div
                  key={entry.id}
                  ref={isLastEntry ? lastEntryRef : null}
                >
                  <AuditEventCard
                    entry={entry}
                    isExpanded={expandedEntryId === entry.id}
                    onToggleExpand={() => handleToggleExpand(entry.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading more events...
          </span>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && entries.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the audit log
          </p>
        </div>
      )}
    </div>
  );
}

export default AuditTimeline;
