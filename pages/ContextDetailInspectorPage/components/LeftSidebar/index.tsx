import { useRef, useState, useCallback, useMemo, memo } from 'react';
import {
  FileCode,
  FileJson,
  FileText,
  File,
  Search,
  X,
  Folder,
  ChevronRight,
  GripVertical,
  Globe,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useSourceFiles, formatFileSize, SourceFile } from '../../../../contexts/SourceFilesContext';
import { useIngestion, formatFileSizeFromBytes } from '../../../../contexts/IngestionContext';
import { KijkoHeader } from '../../../../components/LeftSidebar';
import { FileContextMenu, ContextMenuAction } from './FileContextMenu';

interface LeftSidebarProps {
  className?: string;
  projectName?: string;
  projectId?: string;
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
    case 'folder':
      return Folder;
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
    case 'folder':
      return 'text-blue-300';
    default:
      return 'text-slate-500';
  }
}

// Memoized file list item for better performance with large lists
interface FileListItemProps {
  file: SourceFile;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, file: SourceFile) => void;
  onDragStart: (e: React.DragEvent, file: SourceFile) => void;
  onDragOver: (e: React.DragEvent, file: SourceFile) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetFile: SourceFile) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onFolderToggle?: (id: string) => void;
  isExpanded?: boolean;
  isDragTarget?: boolean;
  depth?: number;
}

const FileListItem = memo(function FileListItem({
  file,
  isSelected,
  isRenaming,
  renameValue,
  onToggle,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onFolderToggle,
  isExpanded,
  isDragTarget,
  depth = 0,
}: FileListItemProps) {
  const Icon = getFileIcon(file.type);
  const colorClass = getFileTypeColor(file.type);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (file.isFolder && onFolderToggle) {
      onFolderToggle(file.id);
    } else {
      onToggle(file.id);
    }
  }, [file.id, file.isFolder, onToggle, onFolderToggle]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, file);
  }, [file, onContextMenu]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart(e, file);
  }, [file, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(e, file);
  }, [file, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, file);
  }, [file, onDrop]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRenameSubmit();
    } else if (e.key === 'Escape') {
      onRenameCancel();
    }
  }, [onRenameSubmit, onRenameCancel]);

  return (
    <div
      draggable={!isRenaming}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group',
        isSelected
          ? 'bg-blue-600/10 hover:bg-blue-600/20'
          : 'hover:bg-slate-800/50',
        isDragTarget && 'bg-blue-500/20 border-t-2 border-blue-500',
        file.isFolder && isDragTarget && 'bg-blue-500/30'
      )}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      {/* Drag Handle */}
      <GripVertical
        size={12}
        className="flex-shrink-0 text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
      />

      {/* Folder Expand Icon */}
      {file.isFolder && (
        <ChevronRight
          size={12}
          className={cn(
            'flex-shrink-0 text-slate-500 transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
      )}

      {/* File Icon */}
      <Icon size={14} className={cn('flex-shrink-0', colorClass)} />

      {/* File Name or Rename Input */}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onRenameSubmit}
          autoFocus
          className="flex-1 bg-slate-700 border border-blue-500 rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-xs text-slate-300 truncate">
          {file.name}
        </span>
      )}

      {/* File Size (not for folders) */}
      {!file.isFolder && (
        <span className="text-[10px] text-slate-500 flex-shrink-0">
          {formatFileSize(file.size)}
        </span>
      )}
    </div>
  );
});

// Context menu state type
interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  file?: SourceFile;
}

export function LeftSidebar({ className, projectName = 'Project', projectId }: LeftSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRootExpanded, setIsRootExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<SourceFile | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const {
    files,
    selectedFileIds,
    selectedCount,
    totalCount,
    selectedSize,
    toggleFileSelection,
    removeFile,
    renameFile,
    createFolder,
    moveFile,
  } = useSourceFiles();

  const { openIngestionModal } = useIngestion();

  // Get root level files (no parentId)
  const rootFiles = useMemo(() => {
    return files.filter((f) => !f.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [files]);

  // Get files in a folder
  const getFilesInFolder = useCallback((folderId: string) => {
    return files.filter((f) => f.parentId === folderId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [files]);

  // Memoize filtered files to prevent recalculation on every render
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return rootFiles;
    const query = searchQuery.toLowerCase();
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, rootFiles, searchQuery]);

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

  // Close search
  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Open search
  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  // Open project preview in new tab
  const handleOpenPreview = useCallback(() => {
    if (!projectId) return;
    const previewUrl = `https://app.kijko.nl/preview/${projectId}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }, [projectId]);

  // Toggle folder expansion
  const handleFolderToggle = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, file?: SourceFile) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      file,
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  }, []);

  const handleContextMenuAction = useCallback((action: ContextMenuAction['id'], fileId?: string) => {
    switch (action) {
      case 'new-file':
        handleNewIngestion();
        break;
      case 'new-folder':
        const folderName = prompt('Enter folder name:');
        if (folderName) {
          createFolder(folderName, contextMenu.file?.isFolder ? contextMenu.file.id : contextMenu.file?.parentId);
        }
        break;
      case 'rename':
        if (fileId) {
          const file = files.find((f) => f.id === fileId);
          if (file) {
            setRenamingFileId(fileId);
            setRenameValue(file.name);
          }
        }
        break;
      case 'delete':
        if (fileId) {
          removeFile(fileId);
        }
        break;
      case 'compress':
        // TODO: Implement compress functionality
        console.log('Compress:', fileId);
        break;
    }
  }, [contextMenu.file, createFolder, files, handleNewIngestion, removeFile]);

  // Rename handlers
  const handleRenameChange = useCallback((value: string) => {
    setRenameValue(value);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (renamingFileId && renameValue.trim()) {
      renameFile(renamingFileId, renameValue.trim());
    }
    setRenamingFileId(null);
    setRenameValue('');
  }, [renamingFileId, renameValue, renameFile]);

  const handleRenameCancel = useCallback(() => {
    setRenamingFileId(null);
    setRenameValue('');
  }, []);

  // Drag & drop handlers for file reordering
  const handleFileDragStart = useCallback((e: React.DragEvent, file: SourceFile) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent, targetFile: SourceFile) => {
    e.preventDefault();
    if (draggedFile && draggedFile.id !== targetFile.id) {
      setDragTargetId(targetFile.id);
    }
  }, [draggedFile]);

  const handleFileDragLeave = useCallback(() => {
    setDragTargetId(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent, targetFile: SourceFile) => {
    e.preventDefault();
    if (draggedFile && draggedFile.id !== targetFile.id) {
      // If dropping on a folder, move into the folder
      if (targetFile.isFolder) {
        moveFile(draggedFile.id, targetFile.id);
        // Expand the folder to show the moved file
        setExpandedFolders((prev) => new Set([...prev, targetFile.id]));
      } else {
        // Otherwise, reorder at the same level
        moveFile(draggedFile.id, targetFile.parentId || null);
      }
    }
    setDraggedFile(null);
    setDragTargetId(null);
  }, [draggedFile, moveFile]);

  // Drop zone handlers for external files (applied to entire explorer area)
  const handleExplorerDragOver = useCallback((e: React.DragEvent) => {
    // Only handle external file drops, not internal file reordering
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  }, []);

  const handleExplorerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleExplorerDrop = useCallback((e: React.DragEvent) => {
    // Only handle external file drops
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const id = `file-${Date.now()}`;
    openIngestionModal({
      id,
      name: file.name,
      size: formatFileSizeFromBytes(file.size),
      sizeBytes: file.size,
    });
  }, [openIngestionModal]);

  // Render file list recursively
  const renderFileList = useCallback((fileList: SourceFile[], depth = 0) => {
    return fileList.map((file) => (
      <div key={file.id}>
        <FileListItem
          file={file}
          isSelected={selectedFileIds.has(file.id)}
          isRenaming={renamingFileId === file.id}
          renameValue={renameValue}
          onToggle={toggleFileSelection}
          onContextMenu={handleContextMenu}
          onDragStart={handleFileDragStart}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
          onRenameChange={handleRenameChange}
          onRenameSubmit={handleRenameSubmit}
          onRenameCancel={handleRenameCancel}
          onFolderToggle={handleFolderToggle}
          isExpanded={expandedFolders.has(file.id)}
          isDragTarget={dragTargetId === file.id}
          depth={depth}
        />
        {/* Render children if folder is expanded */}
        {file.isFolder && expandedFolders.has(file.id) && (
          <div>
            {renderFileList(getFilesInFolder(file.id), depth + 1)}
          </div>
        )}
      </div>
    ));
  }, [
    selectedFileIds,
    renamingFileId,
    renameValue,
    toggleFileSelection,
    handleContextMenu,
    handleFileDragStart,
    handleFileDragOver,
    handleFileDragLeave,
    handleFileDrop,
    handleRenameChange,
    handleRenameSubmit,
    handleRenameCancel,
    handleFolderToggle,
    expandedFolders,
    dragTargetId,
    getFilesInFolder,
  ]);

  // Handle right-click on empty area
  const handleListContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger if clicking on the list container, not on a file
    if (e.target === e.currentTarget) {
      handleContextMenu(e);
    }
  }, [handleContextMenu]);

  return (
    <aside
      className={cn(
        'h-full bg-[#0d1220] border-r border-[#1e293b] flex flex-col',
        className
      )}
    >
      {/* Kijko Header with Logo */}
      <KijkoHeader />

      {/* Hidden file input for drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.txt"
      />

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
            <span className="text-xs text-slate-400 font-medium">Explorer</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenPreview}
                disabled={!projectId}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Preview project in new tab"
              >
                <Globe size={14} />
              </button>
              <button
                onClick={handleOpenSearch}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Search size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Files List — also serves as drop zone for external files */}
      <div
        className={cn(
          'flex-1 overflow-y-auto transition-colors',
          isDragOver && 'bg-blue-500/10 ring-2 ring-inset ring-blue-500/40'
        )}
        onContextMenu={handleListContextMenu}
        onDragOver={handleExplorerDragOver}
        onDragLeave={handleExplorerDragLeave}
        onDrop={handleExplorerDrop}
      >
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            {searchQuery ? 'No files match your search' : 'No source files'}
          </div>
        ) : (
          <div className="py-1">
            {/* Root Project Folder */}
            <div
              onClick={() => setIsRootExpanded(!isRootExpanded)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-slate-800/50 group"
            >
              <ChevronRight
                size={12}
                className={cn(
                  'flex-shrink-0 text-slate-500 transition-transform',
                  isRootExpanded && 'rotate-90'
                )}
              />
              <Folder size={14} className="flex-shrink-0 text-blue-400" />
              <span className="flex-1 text-xs text-slate-300 font-medium truncate">
                {projectName}
              </span>
            </div>
            {/* Files inside root folder */}
            {isRootExpanded && (
              <div>
                {renderFileList(filteredFiles, 1)}
              </div>
            )}
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

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          fileId={contextMenu.file?.id}
          isFolder={contextMenu.file?.isFolder}
          onAction={handleContextMenuAction}
          onClose={handleContextMenuClose}
        />
      )}
    </aside>
  );
}

export default LeftSidebar;
