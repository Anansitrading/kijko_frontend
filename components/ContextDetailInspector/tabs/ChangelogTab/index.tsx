import { useState, useCallback, useMemo } from 'react';
import { Loader2, FileX, GitCompare } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChangelogEntryType, TimeRange, VersionInfo, ChangelogEntry as ChangelogEntryType2 } from '../../../../types/contextInspector';
import { useChangelog } from './hooks/useChangelog';
import { FilterToolbar } from './FilterToolbar';
import { ChangelogEntry } from './ChangelogEntry';
import { exportChangelog, type ExportFormat } from './exportChangelog';
import { DiffViewerModal } from '../../modals/DiffViewerModal';
import { RollbackConfirmModal } from '../../modals/RollbackConfirmModal';
import { VersionSelectorModal } from '../../modals/VersionSelectorModal';

interface ChangelogTabProps {
  contextId: string;
  contextName?: string;
}

export function ChangelogTab({ contextId, contextName }: ChangelogTabProps) {
  const [typeFilter, setTypeFilter] = useState<ChangelogEntryType | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeRange>('30d');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Modal states
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{ from: number; to: number } | null>(null);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<{ version: number; current: number } | null>(null);
  const [versionSelectorOpen, setVersionSelectorOpen] = useState(false);

  const { entries, isLoading, error, loadMore, hasMore, totalCount, refetch } = useChangelog(
    contextId,
    { type: typeFilter, time: timeFilter }
  );

  // Extract version info for version selector
  const versions: VersionInfo[] = useMemo(() => {
    return entries
      .filter((e): e is ChangelogEntryType2 & { number: number } => e.type === 'ingestion' && typeof e.number === 'number')
      .map(e => ({
        number: e.number,
        timestamp: e.timestamp,
        author: e.author === 'System' ? 'System' : e.author.name,
        filesChanged: (e.filesAdded || 0) + (e.filesRemoved || 0) + (e.filesModified || 0),
      }));
  }, [entries]);

  // Get current version (latest ingestion)
  const currentVersion = useMemo(() => {
    const ingestions = entries.filter(e => e.type === 'ingestion' && typeof e.number === 'number');
    return ingestions.length > 0 ? Math.max(...ingestions.map(e => e.number || 0)) : 0;
  }, [entries]);

  const handleViewDiff = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry && entry.type === 'ingestion' && typeof entry.number === 'number') {
      setDiffVersions({ from: entry.number - 1, to: entry.number });
      setDiffModalOpen(true);
    }
  }, [entries]);

  const handleRollback = useCallback((entryNumber: number) => {
    setRollbackTarget({ version: entryNumber - 1, current: entryNumber });
    setRollbackModalOpen(true);
  }, []);

  const handleRollbackSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCompareVersions = useCallback((fromVersion: number, toVersion: number) => {
    setDiffVersions({ from: fromVersion, to: toVersion });
    setDiffModalOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setShowExportMenu((prev) => !prev);
  }, []);

  const handleExportFormat = useCallback(
    (format: ExportFormat) => {
      exportChangelog(entries, format, contextName);
      setShowExportMenu(false);
    },
    [entries, contextName]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading changelog...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
          <FileX className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Filter Toolbar */}
        <div className="shrink-0 px-6 pt-4 relative">
          <div className="flex items-center justify-between gap-4 mb-4">
            <FilterToolbar
              typeFilter={typeFilter}
              timeFilter={timeFilter}
              onTypeChange={setTypeFilter}
              onTimeChange={setTimeFilter}
              onExport={handleExport}
              totalCount={totalCount}
            />

            {/* Compare Versions Button */}
            {versions.length >= 2 && (
              <button
                onClick={() => setVersionSelectorOpen(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm',
                  'bg-white/5 hover:bg-white/10 border border-white/10',
                  'text-gray-300 hover:text-white rounded-md',
                  'transition-colors duration-150'
                )}
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare Versions</span>
              </button>
            )}
          </div>

          {/* Export Format Dropdown */}
          {showExportMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div
                className={cn(
                  'absolute right-6 top-12 z-20',
                  'bg-slate-800 border border-white/10 rounded-md shadow-lg',
                  'py-1 min-w-[120px]'
                )}
              >
                <button
                  onClick={() => handleExportFormat('json')}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left',
                    'text-gray-300 hover:text-white hover:bg-white/10',
                    'transition-colors'
                  )}
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExportFormat('csv')}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left',
                    'text-gray-300 hover:text-white hover:bg-white/10',
                    'transition-colors'
                  )}
                >
                  Export as CSV
                </button>
              </div>
            </>
          )}
        </div>

        {/* Changelog Entries */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
                <FileX className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">No changelog entries found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <ChangelogEntry
                  key={entry.id}
                  entry={entry}
                  onViewDiff={handleViewDiff}
                  onRollback={handleRollback}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    className={cn(
                      'px-4 py-2 text-sm',
                      'text-gray-300 hover:text-white',
                      'bg-white/5 hover:bg-white/10',
                      'border border-white/10 rounded-md',
                      'transition-colors duration-150'
                    )}
                  >
                    Load more entries
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {diffVersions && (
        <DiffViewerModal
          isOpen={diffModalOpen}
          onClose={() => {
            setDiffModalOpen(false);
            setDiffVersions(null);
          }}
          contextId={contextId}
          fromVersion={diffVersions.from}
          toVersion={diffVersions.to}
        />
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackTarget && (
        <RollbackConfirmModal
          isOpen={rollbackModalOpen}
          onClose={() => {
            setRollbackModalOpen(false);
            setRollbackTarget(null);
          }}
          onSuccess={handleRollbackSuccess}
          contextId={contextId}
          targetVersion={rollbackTarget.version}
          currentVersion={rollbackTarget.current}
        />
      )}

      {/* Version Selector Modal */}
      <VersionSelectorModal
        isOpen={versionSelectorOpen}
        onClose={() => setVersionSelectorOpen(false)}
        onCompare={handleCompareVersions}
        versions={versions}
      />
    </>
  );
}

// Re-export for convenience
export { useChangelog } from './hooks/useChangelog';
export { exportChangelog } from './exportChangelog';
