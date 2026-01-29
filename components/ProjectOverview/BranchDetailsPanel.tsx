import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Package,
  FileText,
  FolderOpen,
  Database,
  Folder,
  ChevronRight,
  FileCode,
  FileJson,
  File,
  X,
  GitBranch,
  Plus,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Types for ingestion items
interface IngestionItem {
  id: string;
  name: string;
  type: 'repo' | 'file' | 'folder';
  size: string;
  status: 'cached' | 'expired' | 'pending';
}

// Types for explorer files
interface ExplorerFile {
  id: string;
  name: string;
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'css' | 'html' | 'python' | 'folder' | 'other';
  size: number;
  isFolder?: boolean;
  parentId?: string;
  children?: ExplorerFile[];
}

// Empty initial state - data is populated via ingestion
// Branch-specific data would come from API in production
const BRANCH_DATA: Record<string, { ingestions: IngestionItem[]; files: ExplorerFile[]; tokens: number }> = {};

// Default empty state for new projects/branches
const DEFAULT_DATA = {
  tokens: 0,
  ingestions: [] as IngestionItem[],
  files: [] as ExplorerFile[],
};

// Get data for a specific branch
function getBranchData(branchName: string) {
  return BRANCH_DATA[branchName] || DEFAULT_DATA;
}

type ViewMode = 'hypervisa' | 'explorer';

interface BranchDetailsPanelProps {
  branchName: string;
  worktreeId: string;
  onClose?: () => void;
  onNewIngestion?: () => void;
}

// Item type icon component
function ItemIcon({ type }: { type: IngestionItem['type'] }) {
  switch (type) {
    case 'repo':
      return <Package size={14} className="text-blue-400" />;
    case 'file':
      return <FileText size={14} className="text-slate-400" />;
    default:
      return <FolderOpen size={14} className="text-amber-400" />;
  }
}

// File type icon mapping for explorer
function getFileIcon(type: ExplorerFile['type']) {
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
function getFileTypeColor(type: ExplorerFile['type']) {
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

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Hypervisa ingestion list view
function HypervisaListView({ items }: { items: IngestionItem[] }) {
  return (
    <div className="space-y-px">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <ItemIcon type={item.type} />
          <span className="flex-1 text-[13px] text-slate-300 truncate">
            {item.name}
          </span>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                item.status === 'cached' && 'bg-emerald-500',
                item.status === 'expired' && 'bg-amber-500',
                item.status === 'pending' && 'bg-blue-500 animate-pulse'
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Explorer file list view
function ExplorerListView({
  files,
  expandedFolders,
  onFolderToggle,
}: {
  files: ExplorerFile[];
  expandedFolders: Set<string>;
  onFolderToggle: (id: string) => void;
}) {
  const rootFiles = files.filter((f) => !f.parentId);

  const renderFile = (file: ExplorerFile, depth = 0) => {
    const Icon = getFileIcon(file.type);
    const colorClass = getFileTypeColor(file.type);
    const isExpanded = expandedFolders.has(file.id);
    const children = files.filter((f) => f.parentId === file.id);

    return (
      <div key={file.id}>
        <div
          onClick={() => file.isFolder && onFolderToggle(file.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {file.isFolder && (
            <ChevronRight
              size={12}
              className={cn(
                'flex-shrink-0 text-slate-500 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          )}
          <Icon size={14} className={cn('flex-shrink-0', colorClass)} />
          <span className="flex-1 text-[13px] text-slate-300 truncate">
            {file.name}
          </span>
          {!file.isFolder && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              {formatFileSize(file.size)}
            </span>
          )}
        </div>
        {file.isFolder && isExpanded && children.length > 0 && (
          <div>
            {children.map((child) => renderFile(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-px">{rootFiles.map((f) => renderFile(f))}</div>;
}

export function BranchDetailsPanel({
  branchName,
  worktreeId: _worktreeId,
  onClose: _onClose,
  onNewIngestion,
}: BranchDetailsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('hypervisa');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['1'])
  );

  // Get branch-specific data
  const branchData = useMemo(() => getBranchData(branchName), [branchName]);

  // Filter ingestion items based on search
  const filteredIngestions = useMemo(() => {
    if (!searchQuery.trim()) return branchData.ingestions;
    const query = searchQuery.toLowerCase();
    return branchData.ingestions.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [searchQuery, branchData.ingestions]);

  // Filter explorer files based on search
  const filteredExplorerFiles = useMemo(() => {
    if (!searchQuery.trim()) return branchData.files;
    const query = searchQuery.toLowerCase();
    return branchData.files.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }, [searchQuery, branchData.files]);

  const handleFolderToggle = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="w-[260px] h-full bg-[#0a0e17] rounded-xl border border-[#1e293b]/60 flex flex-col overflow-hidden ml-4 shadow-xl">
      {/* Header with branch name and toggle */}
      <div className="shrink-0 p-3 space-y-3">
        {/* Branch name indicator */}
        <div className="flex items-center gap-2 px-1">
          <GitBranch size={14} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-slate-200 truncate">{branchName}</span>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#0d1220] rounded-lg p-1 border border-[#1e293b]/40">
          <button
            onClick={() => setViewMode('hypervisa')}
            className={cn(
              'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all',
              viewMode === 'hypervisa'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Hypervisa
          </button>
          <button
            onClick={() => setViewMode('explorer')}
            className={cn(
              'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all',
              viewMode === 'explorer'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Explorer
          </button>
        </div>

        {/* Search and New Ingestion */}
        {isSearchExpanded ? (
          <div className="flex items-center gap-2 bg-[#0d1220] border border-[#1e293b]/40 rounded-lg px-3 py-2 focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === 'hypervisa'
                  ? 'Filter ingestions...'
                  : 'Filter files...'
              }
              autoFocus
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchExpanded(false);
                }
              }}
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchExpanded(false);
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <button
              onClick={() => setIsSearchExpanded(true)}
              className={cn(
                "bg-[#0d1220] border border-[#1e293b]/40 rounded-lg text-slate-400 hover:text-slate-200 hover:border-blue-500/40 transition-all flex items-center justify-center",
                viewMode === 'hypervisa' ? 'w-9' : 'flex-1 py-2'
              )}
              title="Search"
            >
              <Search size={16} />
            </button>
            {viewMode === 'hypervisa' && (
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-600/20"
                title="New Ingestion"
                onClick={onNewIngestion}
              >
                <Plus size={14} />
                <span>New Ingestion</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-1.5">
        {viewMode === 'hypervisa' ? (
          filteredIngestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <Database size={24} className="text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1">No ingestions found</p>
              <p className="text-xs text-slate-500 mb-4">Add context to your project by creating an ingestion</p>
              <button
                onClick={onNewIngestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus size={14} />
                <span>Start Ingestion</span>
              </button>
            </div>
          ) : (
            <HypervisaListView items={filteredIngestions} />
          )
        ) : filteredExplorerFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FolderOpen size={24} className="text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No files found</p>
          </div>
        ) : (
          <ExplorerListView
            files={filteredExplorerFiles}
            expandedFolders={expandedFolders}
            onFolderToggle={handleFolderToggle}
          />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-[#1e293b]/40 bg-[#0d1220]/50">
        {viewMode === 'hypervisa' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total context</span>
              <span className="text-sm font-medium text-emerald-400">
                {Math.round(branchData.tokens * 0.043).toLocaleString()} tokens
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{branchData.ingestions.length} ingestions</span>
              <span>{branchData.tokens.toLocaleString()} original</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Files</span>
            <span className="text-sm font-medium text-slate-300">
              {branchData.files.filter(f => !f.isFolder).length} files
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchDetailsPanel;
