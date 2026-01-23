import { useRef, useState, useCallback, useMemo, memo } from 'react';
import {
  Plus,
  FileCode,
  FileJson,
  FileText,
  File,
  Check,
  Search,
  X,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useSourceFiles, formatFileSize, SourceFile } from '../../../../contexts/SourceFilesContext';
import { useIngestion, formatFileSizeFromBytes } from '../../../../contexts/IngestionContext';

interface LeftSidebarProps {
  className?: string;
}

// File type icon mapping
function getFileIcon(type: SourceFile['type']) {
  switch (type) {
    case 'typescript':
    case 'javascript':
      return FileCode;
    case 'json':
      return FileJson;
    case 'markdown':
      return FileText;
    default:
      return File;
  }
}

// File type color mapping
function getFileTypeColor(type: SourceFile['type']) {
  switch (type) {
    case 'typescript':
      return 'text-blue-400';
    case 'javascript':
      return 'text-yellow-400';
    case 'json':
      return 'text-amber-400';
    case 'markdown':
      return 'text-slate-400';
    case 'css':
      return 'text-pink-400';
    case 'html':
      return 'text-orange-400';
    case 'python':
      return 'text-green-400';
    default:
      return 'text-slate-500';
  }
}

// Memoized file list item for better performance with large lists
interface FileListItemProps {
  file: SourceFile;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const FileListItem = memo(function FileListItem({ file, isSelected, onToggle }: FileListItemProps) {
  const Icon = getFileIcon(file.type);
  const colorClass = getFileTypeColor(file.type);

  const handleClick = useCallback(() => {
    onToggle(file.id);
  }, [file.id, onToggle]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group',
        isSelected
          ? 'bg-blue-600/10 hover:bg-blue-600/20'
          : 'hover:bg-slate-800/50'
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors flex-shrink-0',
          isSelected
            ? 'bg-blue-600 border-blue-600'
            : 'border-slate-600 group-hover:border-slate-500'
        )}
      >
        {isSelected && <Check size={8} className="text-white" />}
      </div>

      {/* File Icon */}
      <Icon size={14} className={cn('flex-shrink-0', colorClass)} />

      {/* File Name */}
      <span className="flex-1 text-xs text-slate-300 truncate">
        {file.name}
      </span>

      {/* File Size */}
      <span className="text-[10px] text-slate-500 flex-shrink-0">
        {formatFileSize(file.size)}
      </span>
    </div>
  );
});

export function LeftSidebar({ className }: LeftSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    files,
    selectedFileIds,
    selectedCount,
    totalCount,
    selectedSize,
    isAllSelected,
    toggleFileSelection,
    selectAll,
    deselectAll,
  } = useSourceFiles();

  const { openIngestionModal } = useIngestion();

  // Memoize filtered files to prevent recalculation on every render
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  // Memoize token estimate
  const tokenEstimate = useMemo(() => Math.round(selectedSize / 4), [selectedSize]);

  // Memoize progress percentage
  const progressPercentage = useMemo(
    () => (totalCount > 0 ? (selectedCount / totalCount) * 100 : 0),
    [selectedCount, totalCount]
  );

  // Handle file selection from input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const id = `file-${Date.now()}`;
      openIngestionModal({
        id,
        name: file.name,
        size: formatFileSizeFromBytes(file.size),
        sizeBytes: file.size,
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [openIngestionModal]);

  // Handle New Ingestion button click
  const handleNewIngestion = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Toggle all selection
  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, deselectAll, selectAll]);

  // Close search
  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Open search
  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  return (
    <aside
      className={cn(
        'h-full bg-[#0d1220] border-r border-[#1e293b] flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#1e293b]">
        <button
          onClick={handleNewIngestion}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          New Ingestion
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.txt"
        />
      </div>

      {/* Search & Selection Controls */}
      <div className="px-3 py-2 border-b border-[#1e293b] space-y-2">
        {/* Search Toggle/Input */}
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCloseSearch}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAll}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isAllSelected
                    ? 'bg-blue-600 border-blue-600'
                    : selectedCount > 0
                    ? 'bg-blue-600/50 border-blue-500'
                    : 'border-slate-600 hover:border-slate-500'
                )}
              >
                {(isAllSelected || selectedCount > 0) && (
                  <Check size={10} className="text-white" />
                )}
              </button>
              <span className="text-xs text-slate-400">
                {selectedCount}/{totalCount} selected
              </span>
            </div>
            <button
              onClick={handleOpenSearch}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Search size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            {searchQuery ? 'No files match your search' : 'No source files'}
          </div>
        ) : (
          <div className="py-1">
            {filteredFiles.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                isSelected={selectedFileIds.has(file.id)}
                onToggle={toggleFileSelection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Token Summary */}
      <div className="p-3 border-t border-[#1e293b] bg-slate-900/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Selected size:</span>
          <span className="text-slate-300 font-medium">
            {formatFileSize(selectedSize)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>{selectedCount} files</span>
          <span>~{tokenEstimate} tokens</span>
        </div>
      </div>
    </aside>
  );
}

export default LeftSidebar;
