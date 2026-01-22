import { Upload, Eye, RotateCcw, Plus, Minus, PenLine } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChangelogEntry, UserAccess } from '../../../../types/contextInspector';
import { FileList } from './FileList';

interface IngestionEntryProps {
  entry: ChangelogEntry;
  onViewDiff: () => void;
  onRollback: () => void;
}

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

function getAuthorName(author: UserAccess | 'System'): string {
  if (author === 'System') return 'System';
  return author.name;
}

export function IngestionEntry({ entry, onViewDiff, onRollback }: IngestionEntryProps) {
  const { number, timestamp, author, filesAdded, filesRemoved, filesModified } = entry;
  const dateStr = formatDate(timestamp);
  const timeStr = formatTime(timestamp);
  const authorName = getAuthorName(author);

  const previousVersion = number ? number - 1 : undefined;

  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 rounded-lg p-4',
        'hover:border-white/20 transition-colors duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10">
            <Upload className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                Ingestion
              </span>
              {number && (
                <span className="text-white font-semibold">#{number}</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {dateStr} {timeStr} • by {authorName}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        {filesAdded !== undefined && filesAdded > 0 && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Plus className="w-3.5 h-3.5" />
            <span>{filesAdded} added</span>
          </div>
        )}
        {filesRemoved !== undefined && filesRemoved > 0 && (
          <div className="flex items-center gap-1.5 text-red-400">
            <Minus className="w-3.5 h-3.5" />
            <span>{filesRemoved} removed</span>
          </div>
        )}
        {filesModified !== undefined && filesModified > 0 && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <PenLine className="w-3.5 h-3.5" />
            <span>{filesModified} modified</span>
          </div>
        )}
      </div>

      {/* File Lists */}
      <div className="space-y-1">
        {entry.addedFiles && entry.addedFiles.length > 0 && (
          <FileList type="added" files={entry.addedFiles} />
        )}
        {entry.removedFiles && entry.removedFiles.length > 0 && (
          <FileList type="removed" files={entry.removedFiles} />
        )}
        {entry.modifiedFiles && entry.modifiedFiles.length > 0 && (
          <FileList type="modified" files={entry.modifiedFiles} />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
        <button
          onClick={onViewDiff}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs',
            'text-gray-400 hover:text-white',
            'bg-white/5 hover:bg-white/10 rounded-md',
            'transition-colors duration-150'
          )}
          title="View differences from previous version"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Full Diff</span>
        </button>
        {previousVersion !== undefined && previousVersion >= 0 && (
          <button
            onClick={onRollback}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs',
              'text-gray-400 hover:text-amber-400',
              'bg-white/5 hover:bg-amber-500/10 rounded-md',
              'transition-colors duration-150'
            )}
            title={`Rollback to version ${previousVersion}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback to #{previousVersion}</span>
          </button>
        )}
      </div>
    </div>
  );
}
