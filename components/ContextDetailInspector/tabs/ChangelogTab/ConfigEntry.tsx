import { Settings } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChangelogEntry, UserAccess } from '../../../../types/contextInspector';

interface ConfigEntryProps {
  entry: ChangelogEntry;
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

export function ConfigEntry({ entry }: ConfigEntryProps) {
  const { timestamp, author, description } = entry;
  const dateStr = formatDate(timestamp);
  const timeStr = formatTime(timestamp);
  const authorName = getAuthorName(author);

  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 rounded-lg p-4',
        'hover:border-white/20 transition-colors duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-500/10">
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Configuration
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {dateStr} {timeStr} • by {authorName}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-white mt-3">{description}</p>
      )}
    </div>
  );
}
