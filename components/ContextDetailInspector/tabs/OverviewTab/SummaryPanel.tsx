import {
  FileCode,
  Clock,
  HardDrive,
  Files as FilesIcon,
  FileJson,
  FileText,
  FileType,
  Code,
  Palette,
  Globe,
  Check,
  Minus,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ContextItem, SourceItem, SourceFileType } from '../../../../types/contextInspector';

interface SummaryPanelProps {
  contextItem: ContextItem;
  sources: SourceItem[];
  isLoading: boolean;
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleSource: (sourceId: string) => void;
  onToggleAll: (selected: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// File type icon mapping
const FILE_TYPE_ICONS: Record<SourceFileType, { icon: typeof FileCode; color: string }> = {
  typescript: { icon: Code, color: 'text-blue-400' },
  javascript: { icon: FileCode, color: 'text-yellow-400' },
  json: { icon: FileJson, color: 'text-green-400' },
  markdown: { icon: FileText, color: 'text-gray-400' },
  css: { icon: Palette, color: 'text-pink-400' },
  html: { icon: Globe, color: 'text-orange-400' },
  python: { icon: Code, color: 'text-blue-300' },
  yaml: { icon: FileType, color: 'text-purple-400' },
  other: { icon: FilesIcon, color: 'text-gray-500' },
};

function SourceItemRow({
  source,
  onToggle,
}: {
  source: SourceItem;
  onToggle: () => void;
}) {
  const { icon: Icon, color } = FILE_TYPE_ICONS[source.fileType];

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/5',
        source.selected ? 'bg-white/5' : 'bg-transparent'
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'flex items-center justify-center w-5 h-5 rounded border',
          'transition-all duration-150',
          source.selected
            ? 'bg-blue-500 border-blue-500'
            : 'bg-transparent border-white/30 hover:border-white/50'
        )}
      >
        {source.selected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* File icon */}
      <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />

      {/* File name */}
      <span
        className={cn(
          'flex-1 text-left text-sm truncate',
          source.selected ? 'text-white' : 'text-gray-400'
        )}
        title={source.path}
      >
        {source.name}
      </span>

      {/* File size */}
      <span className="text-xs text-gray-500 flex-shrink-0">
        {formatBytes(source.size)}
      </span>
    </button>
  );
}

export function SummaryPanel({
  contextItem,
  sources,
  isLoading,
  selectedCount,
  totalCount,
  allSelected,
  onToggleSource,
  onToggleAll,
}: SummaryPanelProps) {
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h4 className="text-sm font-medium text-white uppercase tracking-wider">
          Context Summary
        </h4>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Metadata cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FileCode className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Type</span>
            </div>
            <p className="text-white font-semibold text-sm capitalize">
              {contextItem.type}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Size</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {formatBytes(contextItem.size)}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FilesIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Files</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {contextItem.fileCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Updated</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {formatRelativeTime(contextItem.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-4 flex-shrink-0" />

        {/* Sources Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sources Header with Select All */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FilesIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">
                Bronnen
              </span>
              <span className="text-xs text-gray-500">
                ({selectedCount}/{totalCount} geselecteerd)
              </span>
            </div>
          </div>

          {/* Select All Row */}
          <button
            onClick={() => onToggleAll(!allSelected)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 flex-shrink-0',
              'transition-all duration-150',
              'hover:bg-white/5 border border-white/10'
            )}
          >
            {/* Checkbox */}
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded border',
                'transition-all duration-150',
                allSelected
                  ? 'bg-blue-500 border-blue-500'
                  : someSelected
                  ? 'bg-blue-500/50 border-blue-500'
                  : 'bg-transparent border-white/30 hover:border-white/50'
              )}
            >
              {allSelected ? (
                <Check className="w-3 h-3 text-white" />
              ) : someSelected ? (
                <Minus className="w-3 h-3 text-white" />
              ) : null}
            </div>

            <span className="text-sm text-white font-medium">
              Alle bronnen selecteren
            </span>
          </button>

          {/* Sources List - Scrollable */}
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-5 h-5 bg-gray-700 rounded" />
                    <div className="w-4 h-4 bg-gray-700 rounded" />
                    <div className="flex-1 h-4 bg-gray-700 rounded" />
                    <div className="w-12 h-3 bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-8">
                <FilesIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Geen bronnen gevonden</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sources.map((source) => (
                  <SourceItemRow
                    key={source.id}
                    source={source}
                    onToggle={() => onToggleSource(source.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
