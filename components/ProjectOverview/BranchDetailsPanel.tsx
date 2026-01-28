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

// Branch-specific mock data
const BRANCH_DATA: Record<string, { ingestions: IngestionItem[]; files: ExplorerFile[]; tokens: number }> = {
  main: {
    tokens: 2456834,
    ingestions: [
      { id: '1', name: 'Full project sync', type: 'repo', size: '12 MB', status: 'cached' },
      { id: '2', name: 'Core services', type: 'file', size: '4.5 MB', status: 'cached' },
      { id: '3', name: 'Auth module', type: 'file', size: '890 KB', status: 'cached' },
      { id: '4', name: 'Database schema', type: 'file', size: '230 KB', status: 'cached' },
      { id: '5', name: 'API routes', type: 'folder', size: '1.8 MB', status: 'cached' },
      { id: '6', name: 'Utility functions', type: 'file', size: '450 KB', status: 'cached' },
      { id: '7', name: 'Test suite', type: 'repo', size: '3.2 MB', status: 'cached' },
    ],
    files: [
      { id: '1', name: 'src', type: 'folder', size: 0, isFolder: true },
      { id: '2', name: 'App.tsx', type: 'typescript', size: 12148, parentId: '1' },
      { id: '3', name: 'index.ts', type: 'typescript', size: 3148, parentId: '1' },
      { id: '4', name: 'package.json', type: 'json', size: 2740 },
      { id: '5', name: 'README.md', type: 'markdown', size: 4520 },
      { id: '6', name: 'tsconfig.json', type: 'json', size: 800 },
    ],
  },
  develop: {
    tokens: 1834521,
    ingestions: [
      { id: '1', name: 'Development sync', type: 'repo', size: '8.2 MB', status: 'cached' },
      { id: '2', name: 'New features', type: 'folder', size: '2.1 MB', status: 'pending' },
      { id: '3', name: 'Bug fixes batch', type: 'file', size: '560 KB', status: 'cached' },
      { id: '4', name: 'Refactored components', type: 'file', size: '1.4 MB', status: 'expired' },
      { id: '5', name: 'Updated tests', type: 'repo', size: '1.9 MB', status: 'pending' },
    ],
    files: [
      { id: '1', name: 'features', type: 'folder', size: 0, isFolder: true },
      { id: '2', name: 'NewDashboard.tsx', type: 'typescript', size: 18450, parentId: '1' },
      { id: '3', name: 'UserSettings.tsx', type: 'typescript', size: 9780, parentId: '1' },
      { id: '4', name: 'Notifications.tsx', type: 'typescript', size: 6230, parentId: '1' },
      { id: '5', name: 'dev.config.ts', type: 'typescript', size: 1890 },
    ],
  },
  'feature/auth': {
    tokens: 523890,
    ingestions: [
      { id: '1', name: 'Auth module update', type: 'file', size: '890 KB', status: 'cached' },
      { id: '2', name: 'OAuth integration', type: 'file', size: '340 KB', status: 'pending' },
      { id: '3', name: 'Session management', type: 'file', size: '210 KB', status: 'cached' },
    ],
    files: [
      { id: '1', name: 'auth', type: 'folder', size: 0, isFolder: true },
      { id: '2', name: 'AuthProvider.tsx', type: 'typescript', size: 8920, parentId: '1' },
      { id: '3', name: 'useAuth.ts', type: 'typescript', size: 3148, parentId: '1' },
      { id: '4', name: 'LoginForm.tsx', type: 'typescript', size: 5420, parentId: '1' },
      { id: '5', name: 'auth.types.ts', type: 'typescript', size: 1240, parentId: '1' },
    ],
  },
  'develop-new UI': {
    tokens: 892340,
    ingestions: [
      { id: '1', name: 'UI Components', type: 'folder', size: '3.2 MB', status: 'cached' },
      { id: '2', name: 'Design system', type: 'file', size: '1.1 MB', status: 'cached' },
      { id: '3', name: 'Theme updates', type: 'file', size: '420 KB', status: 'pending' },
      { id: '4', name: 'Icon set', type: 'folder', size: '890 KB', status: 'cached' },
    ],
    files: [
      { id: '1', name: 'components', type: 'folder', size: 0, isFolder: true },
      { id: '2', name: 'Button.tsx', type: 'typescript', size: 4520, parentId: '1' },
      { id: '3', name: 'Card.tsx', type: 'typescript', size: 3210, parentId: '1' },
      { id: '4', name: 'Modal.tsx', type: 'typescript', size: 6890, parentId: '1' },
      { id: '5', name: 'theme.css', type: 'css', size: 8920 },
      { id: '6', name: 'variables.css', type: 'css', size: 2340 },
    ],
  },
  'develop-payment': {
    tokens: 678234,
    ingestions: [
      { id: '1', name: 'Payment gateway', type: 'file', size: '1.8 MB', status: 'cached' },
      { id: '2', name: 'Stripe integration', type: 'file', size: '920 KB', status: 'cached' },
      { id: '3', name: 'Invoice system', type: 'folder', size: '1.4 MB', status: 'pending' },
    ],
    files: [
      { id: '1', name: 'payments', type: 'folder', size: 0, isFolder: true },
      { id: '2', name: 'PaymentForm.tsx', type: 'typescript', size: 12300, parentId: '1' },
      { id: '3', name: 'stripe.config.ts', type: 'typescript', size: 2740, parentId: '1' },
      { id: '4', name: 'invoice.types.ts', type: 'typescript', size: 1840, parentId: '1' },
    ],
  },
};

// Default data for unknown branches
const DEFAULT_DATA = {
  tokens: 345000,
  ingestions: [
    { id: '1', name: 'Branch sync', type: 'repo' as const, size: '2.1 MB', status: 'cached' as const },
    { id: '2', name: 'Local changes', type: 'file' as const, size: '340 KB', status: 'pending' as const },
  ],
  files: [
    { id: '1', name: 'src', type: 'folder' as const, size: 0, isFolder: true },
    { id: '2', name: 'index.ts', type: 'typescript' as const, size: 1240, parentId: '1' },
  ],
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
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Database size={24} className="text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">No ingestions found</p>
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Total context</span>
          <span className="text-sm font-medium text-emerald-400">
            {branchData.tokens.toLocaleString()} tokens
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{branchData.ingestions.length} ingestions</span>
          <span>{Math.round(branchData.tokens * 0.043).toLocaleString()} compressed</span>
        </div>
      </div>
    </div>
  );
}

export default BranchDetailsPanel;
