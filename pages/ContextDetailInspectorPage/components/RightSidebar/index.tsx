import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, FileJson, FileText, Clock, MessageSquare, Search, X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
import { useCompressionData } from '../../../../components/ContextDetailInspector/tabs/CompressionTab/hooks';
import { formatRelativeTime } from '../../../../utils/chatHistoryStorage';
import { formatDateTime, formatFileChange, formatInterval } from '../../../../utils/formatting';
import type { ChatHistoryItem } from '../../../../types/chatHistory';
import type { IngestionEntry } from '../../../../types/contextInspector';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'kijko_right_sidebar_collapsed';
const TAB_STORAGE_KEY = 'kijko_right_sidebar_active_tab';
const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 48;
const TRANSITION_DURATION = 300;

// ==========================================
// Tab Types
// ==========================================

type SidebarTab = 'chats' | 'ingestions';

// ==========================================
// Export Format Types
// ==========================================

type ExportFormat = 'json' | 'markdown';

interface ExportDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

function ExportDropdown({ isOpen, onClose, onExport }: ExportDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={() => onExport('json')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          <FileJson size={14} className="text-blue-400" />
          <span>Export as JSON</span>
        </button>
        <button
          onClick={() => onExport('markdown')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          <FileText size={14} className="text-green-400" />
          <span>Export as Markdown</span>
        </button>
      </div>
    </>
  );
}

// ==========================================
// Date Group Helpers
// ==========================================

type DateGroup = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'older';

function getDateGroup(date: Date): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate >= today) return 'today';
  if (itemDate >= yesterday) return 'yesterday';
  if (itemDate >= last7Days) return 'last7days';
  if (itemDate >= last30Days) return 'last30days';
  return 'older';
}

function getGroupLabel(group: DateGroup): string {
  switch (group) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'last7days': return 'Last 7 Days';
    case 'last30days': return 'Last 30 Days';
    case 'older': return 'Older';
  }
}

// ==========================================
// Debounce Hook
// ==========================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ==========================================
// Delete Confirmation Dialog
// ==========================================

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ isOpen, title, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-white/20 rounded-lg shadow-xl p-4 max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-sm font-semibold text-white mb-2">Delete Chat</h3>
        <p className="text-xs text-gray-400 mb-4">
          Are you sure you want to delete "{title}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Inline Edit Input
// ==========================================

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function InlineEdit({ value, onSave, onCancel }: InlineEditProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue.trim() || value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(editValue.trim() || value)}
      className="w-full bg-white/10 border border-blue-500/50 rounded px-2 py-0.5 text-xs font-medium text-white outline-none focus:border-blue-500"
    />
  );
}

// ==========================================
// Chat History Item Component
// ==========================================

interface ChatHistoryItemComponentProps {
  item: ChatHistoryItem;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

function ChatHistoryItemComponent({
  item,
  isActive,
  onSelect,
  onRename,
  onDelete
}: ChatHistoryItemComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRename = useCallback((newTitle: string) => {
    setIsEditing(false);
    if (newTitle !== item.title) {
      onRename(newTitle);
    }
  }, [item.title, onRename]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete();
  }, [onDelete]);

  return (
    <>
      <div
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150",
          "border border-transparent",
          isActive
            ? "bg-blue-500/10 border-blue-500/30"
            : "hover:bg-white/5",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        )}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        role="button"
        aria-pressed={isActive}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-1">
          {isEditing ? (
            <InlineEdit
              value={item.title}
              onSave={handleRename}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <h4 className="text-xs font-medium text-white truncate pr-2 flex-1">
              {item.title}
            </h4>
          )}

          {/* Actions on hover */}
          {isHovered && !isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Rename"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}

          {!isHovered && !isEditing && (
            <span className="text-[10px] text-gray-500 shrink-0">
              {formatRelativeTime(item.lastActivity)}
            </span>
          )}
        </div>

        {/* Preview text */}
        <p className="text-[11px] text-gray-400 truncate leading-relaxed">
          {item.preview}
        </p>

        {/* Message count badge */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <MessageSquare size={10} />
            <span>{item.messageCount}</span>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        title={item.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

// ==========================================
// Ingestion Entry Row Component
// ==========================================

interface IngestionEntryRowProps {
  entry: IngestionEntry;
  isSelected?: boolean;
  onSelect?: () => void;
}

function IngestionEntryRow({ entry, isSelected, onSelect }: IngestionEntryRowProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "py-2 px-2.5 rounded-lg transition-all duration-150 cursor-pointer",
        "border-l-[3px]",
        isSelected
          ? "bg-blue-500/10 border-l-blue-500 hover:bg-blue-500/15"
          : "bg-slate-800/30 border-l-transparent hover:bg-slate-800/50 hover:border-l-blue-500/30"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "font-mono text-xs font-semibold",
          isSelected ? "text-blue-400" : "text-gray-500"
        )}>
          #{entry.number}
        </span>
        <span className="text-gray-400 text-xs">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {entry.filesAdded > 0 && (
          <span className="text-emerald-400">
            {formatFileChange(entry.filesAdded, true)}
          </span>
        )}
        {entry.filesRemoved > 0 && (
          <span className="text-red-400">
            {formatFileChange(entry.filesRemoved, false)}
          </span>
        )}
        {entry.filesAdded === 0 && entry.filesRemoved === 0 && (
          <span className="text-gray-500">No changes</span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Group Header Component
// ==========================================

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 px-3 py-1.5 bg-[#0d1220]/95 backdrop-blur-sm">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

// ==========================================
// Empty State Component
// ==========================================

function EmptyState({ type, hasSearch }: { type: 'chats' | 'ingestions'; hasSearch: boolean }) {
  const Icon = type === 'chats' ? MessageSquare : Clock;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
        {hasSearch ? (
          <Search size={24} className="text-gray-500" />
        ) : (
          <Icon size={24} className="text-gray-500" />
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-1">
        {hasSearch
          ? 'No results found'
          : type === 'chats'
            ? 'No chat history'
            : 'No ingestion history'
        }
      </h3>
      <p className="text-xs text-gray-500 max-w-[180px]">
        {hasSearch
          ? 'Try a different search term'
          : type === 'chats'
            ? 'Start a new conversation to see your history here.'
            : 'Ingest files to see your history here.'
        }
      </p>
    </div>
  );
}

// ==========================================
// Tab Button Component
// ==========================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors relative",
        active
          ? "text-white"
          : "text-gray-500 hover:text-gray-300"
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full",
          active ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-400"
        )}>
          {count}
        </span>
      )}
      {/* Active indicator */}
      {active && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
      )}
    </button>
  );
}

// ==========================================
// Props Interface
// ==========================================

interface RightSidebarProps {
  className?: string;
  onWidthChange?: (width: number) => void;
  projectId?: string;
  selectedIngestionNumber?: number | null;
  onSelectIngestion?: (ingestionNumber: number | null) => void;
}

// ==========================================
// Main Component
// ==========================================

export function RightSidebar({
  className,
  onWidthChange,
  projectId = 'default',
  selectedIngestionNumber,
  onSelectIngestion,
}: RightSidebarProps) {
  const { state: chatState, getCurrentSession, loadChat, deleteChat, renameChat } = useChatHistory();
  const { metrics, history: ingestionHistory, isLoading: ingestionLoading } = useCompressionData(projectId);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as SidebarTab;
      return saved === 'chats' || saved === 'ingestions' ? saved : 'chats';
    }
    return 'chats';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const chatHistory = chatState.historyItems;
  const currentActiveChatId = chatState.activeChatId;

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
  }, [isCollapsed, onWidthChange]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Notify parent of initial width
  useEffect(() => {
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
  }, []);

  // Clear search when switching tabs
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Filter and group chats
  const { groupedChats, hasChatsResults } = useMemo(() => {
    let filtered = chatHistory;
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = chatHistory.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.preview.toLowerCase().includes(searchLower)
      );
    }

    // Sort by lastActivity (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.lastActivity instanceof Date ? a.lastActivity : new Date(a.lastActivity);
      const dateB = b.lastActivity instanceof Date ? b.lastActivity : new Date(b.lastActivity);
      return dateB.getTime() - dateA.getTime();
    });

    // Group by date
    const groups = new Map<DateGroup, ChatHistoryItem[]>();
    const groupOrder: DateGroup[] = ['today', 'yesterday', 'last7days', 'last30days', 'older'];

    sorted.forEach(item => {
      const date = item.lastActivity instanceof Date ? item.lastActivity : new Date(item.lastActivity);
      const group = getDateGroup(date);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
    });

    const result: Array<{ group: DateGroup; items: ChatHistoryItem[] }> = [];
    groupOrder.forEach(group => {
      if (groups.has(group)) {
        result.push({ group, items: groups.get(group)! });
      }
    });

    return { groupedChats: result, hasChatsResults: sorted.length > 0 };
  }, [chatHistory, debouncedSearch]);

  // Filter ingestions
  const { filteredIngestions, hasIngestionsResults } = useMemo(() => {
    let filtered = ingestionHistory;
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = ingestionHistory.filter(entry => {
        const numStr = `#${entry.number}`;
        const dateStr = formatDateTime(entry.timestamp).toLowerCase();
        return numStr.includes(searchLower) || dateStr.includes(searchLower);
      });
    }

    // Sort by number (newest first)
    const sorted = [...filtered].sort((a, b) => b.number - a.number);

    return { filteredIngestions: sorted, hasIngestionsResults: sorted.length > 0 };
  }, [ingestionHistory, debouncedSearch]);

  // Chat handlers
  const handleSelectChat = useCallback((id: string) => {
    if (id !== chatState.activeChatId) {
      loadChat(id);
    }
  }, [chatState.activeChatId, loadChat]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    renameChat(id, newTitle);
  }, [renameChat]);

  const handleDeleteChat = useCallback(async (id: string) => {
    await deleteChat(id);
  }, [deleteChat]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Export functionality
  const handleExport = useCallback(async (format: ExportFormat) => {
    setShowExportDropdown(false);

    try {
      const session = getCurrentSession();
      const exportData = {
        exportedAt: new Date().toISOString(),
        chatSession: session ? {
          id: session.id,
          title: session.metadata.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
          messages: session.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          sourceFiles: session.sourceFiles.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size,
          })),
        } : null,
        totalChats: chatState.historyItems.length,
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `context-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Markdown format
        const lines: string[] = [
          '# Context Export',
          '',
          `**Exported:** ${new Date().toLocaleString()}`,
          `**Total Chats:** ${exportData.totalChats}`,
          '',
        ];

        if (exportData.chatSession) {
          lines.push(
            '## Current Chat Session',
            '',
            `**Title:** ${exportData.chatSession.title}`,
            `**Created:** ${new Date(exportData.chatSession.createdAt).toLocaleString()}`,
            `**Messages:** ${exportData.chatSession.messageCount}`,
            '',
          );

          if (exportData.chatSession.sourceFiles.length > 0) {
            lines.push('### Source Files', '');
            exportData.chatSession.sourceFiles.forEach(file => {
              const sizeKB = Math.round(file.size / 1024);
              lines.push(`- ${file.name} (${file.path || 'unknown path'}) - ${sizeKB}KB`);
            });
            lines.push('');
          }

          if (exportData.chatSession.messages.length > 0) {
            lines.push('### Conversation', '');
            exportData.chatSession.messages.forEach(msg => {
              const role = msg.role === 'user' ? '**User**' : '**Assistant**';
              lines.push(`${role}:`);
              lines.push('');
              lines.push(msg.content);
              lines.push('');
              lines.push('---');
              lines.push('');
            });
          }
        } else {
          lines.push('*No active chat session*', '');
        }

        content = lines.join('\n');
        filename = `context-export-${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportFeedback({ type: 'success', message: 'Export successful!' });
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (error) {
      setExportFeedback({ type: 'error', message: 'Export failed. Please try again.' });
      setTimeout(() => setExportFeedback(null), 3000);
    }
  }, [getCurrentSession, chatState.historyItems.length]);

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <aside
      className={cn(
        'h-full bg-[#0d1220] border-l border-[#1e293b] flex flex-col overflow-hidden',
        'transition-all ease-out',
        className
      )}
      style={{
        width: currentWidth,
        minWidth: currentWidth,
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      {isCollapsed ? (
        // Collapsed state
        <div
          className="flex-1 flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={handleToggleCollapse}
          role="button"
          aria-label="Expand history sidebar"
        >
          <ChevronLeft size={16} className="text-gray-400 mb-3" />
          <div
            className="text-[10px] font-bold uppercase tracking-wider text-gray-500"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            History
          </div>
          <div className="mt-2 text-[10px] text-gray-600">
            {chatHistory.length + ingestionHistory.length}
          </div>
        </div>
      ) : (
        // Expanded state
        <>
          {/* Header with collapse button */}
          <div className="shrink-0 px-3 pt-3 pb-2 flex items-center justify-between border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              History
            </span>
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              title="Collapse panel"
              aria-label="Collapse History panel"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="shrink-0 px-2 border-b border-white/10">
            <div className="flex">
              <TabButton
                active={activeTab === 'chats'}
                onClick={() => setActiveTab('chats')}
                icon={<MessageSquare size={14} />}
                label="Chats"
                count={chatHistory.length}
              />
              <TabButton
                active={activeTab === 'ingestions'}
                onClick={() => setActiveTab('ingestions')}
                icon={<Clock size={14} />}
                label="Ingestions"
                count={ingestionHistory.length}
              />
            </div>
          </div>

          {/* Search Input */}
          <div className="shrink-0 px-3 py-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'chats' ? 'Search chats...' : 'Search ingestions...'}
                aria-label={`Search ${activeTab}`}
                className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-8 pr-8 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chats' ? (
              // Chats Tab Content
              chatState.isLoading ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : !hasChatsResults ? (
                <EmptyState type="chats" hasSearch={debouncedSearch.trim().length > 0} />
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="pb-4">
                    {groupedChats.map(({ group, items }) => (
                      <div key={group}>
                        <GroupHeader label={getGroupLabel(group)} />
                        <div className="px-2 py-1 space-y-0.5">
                          {items.map((item) => (
                            <ChatHistoryItemComponent
                              key={item.id}
                              item={item}
                              isActive={currentActiveChatId === item.id}
                              onSelect={() => handleSelectChat(item.id)}
                              onRename={(newTitle) => handleRenameChat(item.id, newTitle)}
                              onDelete={() => handleDeleteChat(item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              // Ingestions Tab Content
              ingestionLoading ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : !hasIngestionsResults ? (
                <EmptyState type="ingestions" hasSearch={debouncedSearch.trim().length > 0} />
              ) : (
                <div className="h-full overflow-y-auto px-2 py-2">
                  <div className="space-y-1.5 pb-4">
                    {filteredIngestions.map((entry) => (
                      <IngestionEntryRow
                        key={entry.number}
                        entry={entry}
                        isSelected={selectedIngestionNumber === entry.number}
                        onSelect={() => onSelectIngestion?.(
                          selectedIngestionNumber === entry.number ? null : entry.number
                        )}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Ingestion Stats (only for ingestions tab) */}
          {activeTab === 'ingestions' && metrics && (
            <div className="shrink-0 px-3 py-2 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-white font-semibold text-sm">{metrics.totalIngestions}</div>
                  <div className="text-gray-500 text-[9px] uppercase">Total</div>
                </div>
                <div>
                  <div className="text-white font-medium text-[11px]">{formatRelativeTime(metrics.lastIngestion)}</div>
                  <div className="text-gray-500 text-[9px] uppercase">Last</div>
                </div>
                <div>
                  <div className="text-white font-medium text-[11px]">{formatInterval(metrics.avgInterval)}</div>
                  <div className="text-gray-500 text-[9px] uppercase">Avg</div>
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="shrink-0 p-3 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md",
                  "bg-white/5 hover:bg-white/10 border border-white/10",
                  "text-gray-300 hover:text-white text-xs font-medium transition-colors"
                )}
                aria-label="Export context"
              >
                <Download size={14} />
                <span>Export Context</span>
              </button>

              <ExportDropdown
                isOpen={showExportDropdown}
                onClose={() => setShowExportDropdown(false)}
                onExport={handleExport}
              />
            </div>

            {/* Export feedback toast */}
            {exportFeedback && (
              <div
                className={cn(
                  "mt-2 px-3 py-2 rounded-md text-xs text-center animate-in fade-in duration-200",
                  exportFeedback.type === 'success'
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}
              >
                {exportFeedback.message}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default RightSidebar;
