import { useState, useCallback, useRef } from 'react';
import {
  FileCode,
  Files as FilesIcon,
  FileJson,
  FileText,
  FileType,
  Code,
  Palette,
  Globe,
  Check,
  Minus,
  Plus,
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ContextItem, SourceItem, SourceFileType } from '../../../../types/contextInspector';

interface FilesAddedResult {
  added: number;
  rejected: number;
  rejectedFiles: string[];
}

interface SummaryPanelProps {
  contextItem: ContextItem;
  sources: SourceItem[];
  isLoading: boolean;
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleSource: (sourceId: string) => void;
  onToggleAll: (selected: boolean) => void;
  onFilesAdded?: (files: FileList) => FilesAddedResult;
  onShowToast?: (message: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

      {/* Uncompressed indicator */}
      {!source.compressed && (
        <span
          className="flex items-center gap-1 text-xs text-amber-400 flex-shrink-0"
          title="Not yet compressed"
        >
          <AlertCircle className="w-3 h-3" />
        </span>
      )}

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
  onFilesAdded,
  onShowToast,
  collapsed = false,
  onToggleCollapse,
}: SummaryPanelProps) {
  const someSelected = selectedCount > 0 && selectedCount < totalCount;
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && onFilesAdded) {
      const result = onFilesAdded(files);
      if (result.added > 0 && onShowToast) {
        onShowToast('Deze bestanden zijn nog niet gecomprimeerd');
      }
    }
  }, [onFilesAdded, onShowToast]);

  // Handle Add Files button click
  const handleAddFilesClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFilesAdded) {
      const result = onFilesAdded(files);
      if (result.added > 0 && onShowToast) {
        onShowToast('Deze bestanden zijn nog niet gecomprimeerd');
      }
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  }, [onFilesAdded, onShowToast]);

  // Count uncompressed files
  const uncompressedCount = sources.filter(s => !s.compressed).length;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white/5 rounded-lg overflow-hidden',
        'border-2 transition-all duration-200',
        isDragOver
          ? 'border-blue-500 border-dashed bg-blue-500/5'
          : 'border-white/10 border-solid'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".ts,.tsx,.js,.jsx,.json,.md,.mdx,.css,.scss,.sass,.html,.yml,.yaml,.py"
        onChange={handleFileInputChange}
      />

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px] rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-blue-400">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Drop files here</span>
          </div>
        </div>
      )}

      <div className={cn(
        'flex-1 overflow-hidden flex flex-col relative',
        collapsed ? 'p-2' : 'p-4'
      )}>
        {/* Sources Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Collapsed View - Informative compact view */}
          {collapsed ? (
            <div
              className={cn(
                "flex flex-col h-full cursor-pointer",
                "hover:bg-white/5 transition-colors"
              )}
              onClick={onToggleCollapse}
              role="button"
              aria-label="Expand Source Files panel"
            >
              {/* Collapsed Header */}
              <div className="px-3 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">
                    Source Files
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 pl-6">
                  {selectedCount}/{totalCount} • {formatBytes(sources.reduce((acc, s) => acc + (s.selected ? s.size : 0), 0))}
                </div>
                {uncompressedCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 pl-6 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{uncompressedCount} uncompressed</span>
                  </div>
                )}
              </div>

              {/* Mini file icons grid */}
              <div className="flex-1 p-3 overflow-hidden">
                <div className="grid grid-cols-3 gap-1.5">
                  {sources.filter(s => s.selected).slice(0, 9).map((source) => {
                    const { icon: Icon, color } = FILE_TYPE_ICONS[source.fileType];
                    return (
                      <div
                        key={source.id}
                        className="w-7 h-7 rounded bg-white/10 flex items-center justify-center"
                        title={`${source.name} (${formatBytes(source.size)})`}
                      >
                        <Icon className={cn('w-3 h-3', color)} />
                      </div>
                    );
                  })}
                  {selectedCount > 9 && (
                    <div className="w-7 h-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-semibold">
                      +{selectedCount - 9}
                    </div>
                  )}
                </div>

                {/* Expand hint */}
                <div className="text-[10px] text-gray-500 text-center mt-3">
                  Click to expand
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sources Header */}
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* Select All Checkbox */}
                  <button
                    onClick={() => onToggleAll(!allSelected)}
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded border',
                      'transition-all duration-150',
                      allSelected
                        ? 'bg-blue-500 border-blue-500'
                        : someSelected
                        ? 'bg-blue-500/50 border-blue-500'
                        : 'bg-transparent border-white/30 hover:border-white/50'
                    )}
                    title={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : someSelected ? (
                      <Minus className="w-3 h-3 text-white" />
                    ) : null}
                  </button>
                  <span className="text-sm font-medium text-white">
                    Source Files
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedCount}/{totalCount} selected)
                  </span>
                  {uncompressedCount > 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {uncompressedCount} uncompressed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatBytes(contextItem.size)}
                  </span>
                  {/* Collapse Button */}
                  {onToggleCollapse && (
                    <button
                      onClick={onToggleCollapse}
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded',
                        'text-gray-400 hover:text-white hover:bg-white/10',
                        'transition-all duration-150'
                      )}
                      title="Collapse panel"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

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
                    <p className="text-gray-400 text-sm">No source files found</p>
                    <p className="text-gray-500 text-xs mt-1">Drop files here or click Add Files</p>
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

              {/* Add Files Button */}
              {onFilesAdded && (
                <button
                  onClick={handleAddFilesClick}
                  className={cn(
                    'mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
                    'bg-blue-500/10 border border-blue-500/30',
                    'text-blue-400 text-sm font-medium',
                    'hover:bg-blue-500/20 hover:border-blue-500/50',
                    'transition-all duration-150'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add Files
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
