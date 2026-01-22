import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, PenLine } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ModifiedFile } from '../../../../types/contextInspector';

interface FileListProps {
  type: 'added' | 'removed' | 'modified';
  files: string[] | ModifiedFile[];
  maxVisible?: number;
}

const TYPE_CONFIG = {
  added: {
    icon: Plus,
    prefix: '+',
    label: 'Added',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  removed: {
    icon: Minus,
    prefix: '-',
    label: 'Removed',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  modified: {
    icon: PenLine,
    prefix: '~',
    label: 'Modified',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
};

function isModifiedFile(file: string | ModifiedFile): file is ModifiedFile {
  return typeof file === 'object' && 'path' in file;
}

export function FileList({ type, files, maxVisible = 3 }: FileListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  if (!files || files.length === 0) {
    return null;
  }

  const visibleFiles = isExpanded ? files : files.slice(0, maxVisible);
  const remainingCount = files.length - maxVisible;
  const hasMore = remainingCount > 0;

  return (
    <div className="mt-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium mb-1',
          config.textColor,
          'hover:opacity-80 transition-opacity'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <Icon className="w-3 h-3" />
        <span>{config.label}:</span>
      </button>

      {/* File List */}
      <div className="space-y-0.5 ml-4">
        {visibleFiles.map((file, index) => {
          const filePath = isModifiedFile(file) ? file.path : file;
          const lineChanges = isModifiedFile(file)
            ? ` (+${file.linesAdded}, -${file.linesRemoved} lines)`
            : '';

          return (
            <div
              key={`${filePath}-${index}`}
              className={cn(
                'flex items-center gap-2 text-xs font-mono',
                'py-0.5 px-2 rounded',
                config.bgColor,
                config.textColor
              )}
            >
              <span className="opacity-60">{config.prefix}</span>
              <span className="truncate">{filePath}</span>
              {lineChanges && (
                <span className="opacity-60 whitespace-nowrap">{lineChanges}</span>
              )}
            </div>
          );
        })}

        {/* Show more indicator */}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              'text-xs py-0.5 px-2',
              'text-gray-400 hover:text-gray-300',
              'transition-colors'
            )}
          >
            ... and {remainingCount} more {remainingCount === 1 ? 'file' : 'files'}
          </button>
        )}
      </div>
    </div>
  );
}
