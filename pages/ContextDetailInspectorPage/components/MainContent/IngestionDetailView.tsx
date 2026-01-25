import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Upload, Eye, RotateCcw, Plus, Minus, PenLine, ChevronDown, ChevronRight, Loader2, FileX } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useChangelog } from '../../../../components/ContextDetailInspector/tabs/ChangelogTab/hooks/useChangelog';
import { DiffViewerModal } from '../../../../components/ContextDetailInspector/modals/DiffViewerModal';
import { RollbackConfirmModal } from '../../../../components/ContextDetailInspector/modals/RollbackConfirmModal';
import type { ChangelogEntry, ModifiedFile } from '../../../../types/contextInspector';

interface IngestionDetailViewProps {
  ingestionNumber: number;
  contextId: string;
  onClose: () => void;
}

// ==========================================
// File List Component
// ==========================================

interface FileListProps {
  type: 'added' | 'removed' | 'modified';
  files: string[] | ModifiedFile[];
  defaultExpanded?: boolean;
}

const TYPE_CONFIG = {
  added: {
    icon: Plus,
    prefix: '+',
    label: 'Added',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  removed: {
    icon: Minus,
    prefix: '-',
    label: 'Removed',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  modified: {
    icon: PenLine,
    prefix: '~',
    label: 'Modified',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
};

function isModifiedFile(file: string | ModifiedFile): file is ModifiedFile {
  return typeof file === 'object' && 'path' in file;
}

function FileList({ type, files, defaultExpanded = true }: FileListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 text-sm font-medium mb-2',
          config.textColor,
          'hover:opacity-80 transition-opacity'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <Icon className="w-4 h-4" />
        <span>{config.label}:</span>
        <span className="text-gray-500 font-normal">({files.length} files)</span>
      </button>

      {/* File List */}
      {isExpanded && (
        <div className="space-y-1 ml-6">
          {files.map((file, index) => {
            const filePath = isModifiedFile(file) ? file.path : file;
            const lineChanges = isModifiedFile(file)
              ? ` (+${file.linesAdded}, -${file.linesRemoved} lines)`
              : '';

            return (
              <div
                key={`${filePath}-${index}`}
                className={cn(
                  'flex items-center gap-2 text-sm font-mono',
                  'py-1 px-3 rounded',
                  config.bgColor,
                  config.textColor
                )}
              >
                <span className="opacity-60">{config.prefix}</span>
                <span className="truncate">{filePath}</span>
                {lineChanges && (
                  <span className="opacity-60 whitespace-nowrap text-xs">{lineChanges}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Format Helpers
// ==========================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ==========================================
// Main Component
// ==========================================

export function IngestionDetailView({ ingestionNumber, contextId, onClose }: IngestionDetailViewProps) {
  const { entries, isLoading, error, refetch } = useChangelog(contextId, { type: 'all', time: 'all' });

  // Modal states
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);

  // Find the specific ingestion entry
  const ingestionEntry = useMemo(() => {
    return entries.find(
      (e): e is ChangelogEntry & { number: number } =>
        e.type === 'ingestion' && e.number === ingestionNumber
    );
  }, [entries, ingestionNumber]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleViewDiff = useCallback(() => {
    setDiffModalOpen(true);
  }, []);

  const handleRollback = useCallback(() => {
    setRollbackModalOpen(true);
  }, []);

  const handleRollbackSuccess = useCallback(() => {
    refetch();
    onClose();
  }, [refetch, onClose]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading ingestion details...</p>
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
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Not found state
  if (!ingestionEntry) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
          <FileX className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm text-gray-400">Ingestion #{ingestionNumber} not found</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { timestamp, author, filesAdded, filesRemoved, filesModified, addedFiles, removedFiles, modifiedFiles } = ingestionEntry;
  const dateStr = formatDate(timestamp);
  const timeStr = formatTime(timestamp);
  const authorName = author === 'System' ? 'System' : author.name;
  const previousVersion = ingestionNumber - 1;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="shrink-0 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md',
                'text-gray-400 hover:text-white',
                'bg-white/5 hover:bg-white/10',
                'transition-colors duration-150'
              )}
              title="Back to tab content (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-400 uppercase tracking-wide">
                    Ingestion
                  </span>
                  <span className="text-white font-bold text-lg">#{ingestionNumber}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {dateStr} {timeStr} • by {authorName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Stats Summary */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            {filesAdded !== undefined && filesAdded > 0 && (
              <div className="flex items-center gap-2 text-emerald-400">
                <Plus className="w-5 h-5" />
                <span className="text-lg font-semibold">{filesAdded}</span>
                <span className="text-sm">added</span>
              </div>
            )}
            {filesRemoved !== undefined && filesRemoved > 0 && (
              <div className="flex items-center gap-2 text-red-400">
                <Minus className="w-5 h-5" />
                <span className="text-lg font-semibold">{filesRemoved}</span>
                <span className="text-sm">removed</span>
              </div>
            )}
            {filesModified !== undefined && filesModified > 0 && (
              <div className="flex items-center gap-2 text-amber-400">
                <PenLine className="w-5 h-5" />
                <span className="text-lg font-semibold">{filesModified}</span>
                <span className="text-sm">modified</span>
              </div>
            )}
            {(!filesAdded && !filesRemoved && !filesModified) && (
              <span className="text-gray-500">No file changes recorded</span>
            )}
          </div>

          {/* File Lists */}
          <div className="space-y-2">
            {addedFiles && addedFiles.length > 0 && (
              <FileList type="added" files={addedFiles} />
            )}
            {removedFiles && removedFiles.length > 0 && (
              <FileList type="removed" files={removedFiles} />
            )}
            {modifiedFiles && modifiedFiles.length > 0 && (
              <FileList type="modified" files={modifiedFiles} />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={handleViewDiff}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm',
                'text-gray-300 hover:text-white',
                'bg-white/5 hover:bg-white/10 border border-white/10',
                'rounded-lg transition-colors duration-150'
              )}
              title="View differences from previous version"
            >
              <Eye className="w-4 h-4" />
              <span>View Full Diff</span>
            </button>
            {previousVersion >= 0 && (
              <button
                onClick={handleRollback}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm',
                  'text-gray-300 hover:text-amber-400',
                  'bg-white/5 hover:bg-amber-500/10 border border-white/10',
                  'rounded-lg transition-colors duration-150'
                )}
                title={`Rollback to version ${previousVersion}`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rollback to #{previousVersion}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      <DiffViewerModal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        contextId={contextId}
        fromVersion={previousVersion}
        toVersion={ingestionNumber}
      />

      {/* Rollback Confirmation Modal */}
      <RollbackConfirmModal
        isOpen={rollbackModalOpen}
        onClose={() => setRollbackModalOpen(false)}
        onSuccess={handleRollbackSuccess}
        contextId={contextId}
        targetVersion={previousVersion}
        currentVersion={ingestionNumber}
      />
    </>
  );
}

export default IngestionDetailView;
