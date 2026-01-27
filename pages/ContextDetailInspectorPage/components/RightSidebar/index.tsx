import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MessageSquare, Search, X, Pencil, Trash2, Loader2, Plus, FileUp, Tag, Archive, Shield } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
import { useIngestion, formatFileSizeFromBytes } from '../../../../contexts/IngestionContext';
import { useCompressionData } from '../../../../components/ContextDetailInspector/tabs/CompressionTab/hooks';
import { formatRelativeTime } from '../../../../utils/chatHistoryStorage';
import { formatDateTime, formatFileChange } from '../../../../utils/formatting';
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
  heading?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ isOpen, title, heading = 'Delete Chat', onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-white/20 rounded-lg shadow-xl p-4 max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-sm font-semibold text-white mb-2">{heading}</h3>
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
// Ingestion Context Menu
// ==========================================

type IngestionMenuAction = 'rename' | 'edit-tags' | 'compress' | 'delete';

interface IngestionContextMenuProps {
  x: number;
  y: number;
  showCompress?: boolean;
  onAction: (action: IngestionMenuAction) => void;
  onClose: () => void;
}

function IngestionContextMenu({ x, y, showCompress, onAction, onClose }: IngestionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const actions: Array<{ id: IngestionMenuAction; label: string; icon: typeof Pencil; danger?: boolean }> = [
    { id: 'rename', label: 'Rename', icon: Pencil },
    { id: 'edit-tags', label: 'Edit Tags', icon: Tag },
    ...(showCompress ? [{ id: 'compress' as const, label: 'Compress', icon: Archive }] : []),
    { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <div key={action.id}>
            {action.danger && index > 0 && (
              <div className="my-1 border-t border-slate-700" />
            )}
            <button
              onClick={() => { onAction(action.id); onClose(); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                action.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-slate-300 hover:bg-slate-700'
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="flex-1 text-left">{action.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Tag Editor Inline
// ==========================================

interface TagEditorProps {
  tags: string[];
  onSave: (tags: string[]) => void;
  onCancel: () => void;
}

function TagEditor({ tags, onSave, onCancel }: TagEditorProps) {
  const [inputValue, setInputValue] = useState(tags.join(', '));
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parsed = inputValue.split(',').map(t => t.trim()).filter(Boolean);
      onSave(parsed);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="px-3 py-1.5 bg-slate-800/80">
      <div className="flex items-center gap-1.5 mb-1">
        <Tag size={10} className="text-slate-500" />
        <span className="text-[10px] text-slate-500">Tags (comma-separated)</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const parsed = inputValue.split(',').map(t => t.trim()).filter(Boolean);
          onSave(parsed);
        }}
        placeholder="e.g. sync, release, api"
        className="w-full bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500 placeholder:text-slate-600"
      />
    </div>
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
// Ingestion Entry Row Component (Compact)
// ==========================================

interface IngestionEntryRowProps {
  entry: IngestionEntry;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  onUpdateTags?: (tags: string[]) => void;
  onCompress?: () => void;
}

function IngestionEntryRow({ entry, isSelected, onSelect, onRename, onDelete, onUpdateTags, onCompress }: IngestionEntryRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';

    const payload = JSON.stringify({
      number: entry.number,
      timestamp: entry.timestamp,
    });
    e.dataTransfer.setData('application/x-kijko-ingestion', payload);
    e.dataTransfer.setData('text/plain', `@Ingestion #${entry.number}`);
  }, [entry.number, entry.timestamp]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!contextMenu && !isRenaming && !isEditingTags) {
      setIsHovered(true);
      if (rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        setTooltipPos({
          top: rect.top + rect.height / 2,
          left: rect.left - 8,
        });
      }
    }
  }, [contextMenu, isRenaming, isEditingTags]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTooltipPos(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    setTooltipPos(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleContextMenuAction = useCallback((action: IngestionMenuAction) => {
    setContextMenu(null);
    switch (action) {
      case 'rename':
        setIsRenaming(true);
        break;
      case 'edit-tags':
        setIsEditingTags(true);
        break;
      case 'compress':
        onCompress?.();
        break;
      case 'delete':
        setShowDeleteConfirm(true);
        break;
    }
  }, [onCompress]);

  const handleRename = useCallback((newName: string) => {
    setIsRenaming(false);
    if (newName && newName !== entry.displayName) {
      onRename?.(newName);
    }
  }, [entry.displayName, onRename]);

  const handleSaveTags = useCallback((tags: string[]) => {
    setIsEditingTags(false);
    onUpdateTags?.(tags);
  }, [onUpdateTags]);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete?.();
  }, [onDelete]);

  const totalChanges = entry.filesAdded + entry.filesRemoved;

  return (
    <>
      {/* Main row */}
      <div
        ref={rowRef}
        draggable={!isRenaming && !isEditingTags}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={!isRenaming && !isEditingTags ? (e: React.MouseEvent) => onSelect?.(e) : undefined}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group",
          isDragging && "opacity-40",
          isSelected
            ? "bg-blue-600/10 hover:bg-blue-600/20"
            : "hover:bg-slate-800/50"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(e);
          }
        }}
      >
        {/* Icon */}
        <FileUp size={14} className={cn(
          "flex-shrink-0",
          isSelected ? "text-blue-400" : "text-slate-500"
        )} />

        {/* Name or inline rename */}
        {isRenaming ? (
          <InlineEdit
            value={entry.displayName || `Ingestion #${entry.number}`}
            onSave={handleRename}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <span className="flex-1 text-xs text-slate-300 truncate">
            {entry.displayName || `Ingestion #${entry.number}`}
          </span>
        )}

        {/* Never compress shield */}
        {!isRenaming && entry.neverCompress && (
          <Shield size={12} className="flex-shrink-0 text-amber-400" title="Never compress" />
        )}

        {/* Compact change indicator */}
        {!isRenaming && totalChanges > 0 && (
          <span className={cn(
            "text-[10px] flex-shrink-0 tabular-nums",
            entry.filesAdded > 0 && entry.filesRemoved === 0 && "text-emerald-500",
            entry.filesRemoved > 0 && entry.filesAdded === 0 && "text-red-400",
            entry.filesAdded > 0 && entry.filesRemoved > 0 && "text-slate-500"
          )}>
            {entry.filesAdded > 0 && entry.filesRemoved > 0
              ? `±${totalChanges}`
              : entry.filesAdded > 0
                ? `+${entry.filesAdded}`
                : `-${entry.filesRemoved}`
            }
          </span>
        )}
      </div>

      {/* Inline tag editor (shown below the row) */}
      {isEditingTags && (
        <TagEditor
          tags={entry.tags || []}
          onSave={handleSaveTags}
          onCancel={() => setIsEditingTags(false)}
        />
      )}

      {/* Hover tooltip */}
      {isHovered && tooltipPos && !contextMenu && !isRenaming && !isEditingTags && (
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-150"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-100%, -50%)',
          }}
        >
          <div className="bg-[#1a1f2e] border border-white/15 rounded-lg shadow-xl px-3 py-2.5 min-w-[180px] max-w-[240px]">
            {/* Ingestion number */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="font-mono text-xs font-semibold text-blue-400">
                #{entry.number}
              </span>
              <span className="text-[10px] text-slate-500">Ingestion</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={10} className="text-slate-500 flex-shrink-0" />
              <span className="text-[11px] text-slate-400">
                {formatDateTime(entry.timestamp)}
              </span>
            </div>

            {/* File name */}
            {entry.displayName && (
              <div className="text-[11px] text-slate-300 truncate mb-1">
                {entry.displayName}
              </div>
            )}

            {/* Changes */}
            <div className="flex items-center gap-2 text-[11px] mt-1.5 pt-1.5 border-t border-white/10">
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
                <span className="text-slate-500">No changes</span>
              )}
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-white/10">
                {entry.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <IngestionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          showCompress={!entry.compressed && !entry.neverCompress}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        heading="Delete Ingestion"
        title={entry.displayName || `Ingestion #${entry.number}`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
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
        "flex-1 flex items-center justify-center gap-1.5 h-full text-xs font-medium transition-colors relative",
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
  style?: React.CSSProperties;
  onWidthChange?: (width: number) => void;
  projectId?: string;
  selectedIngestionNumbers?: number[];
  onSelectIngestion?: (ingestionNumbers: number[]) => void;
  onNavigateToIngestion?: (ingestionNumber: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  expandedWidth?: number;
}

// ==========================================
// Main Component
// ==========================================

export function RightSidebar({
  className,
  style,
  onWidthChange,
  projectId = 'default',
  selectedIngestionNumbers = [],
  onSelectIngestion,
  onNavigateToIngestion,
  collapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
  expandedWidth,
}: RightSidebarProps) {
  const { state: chatState, loadChat, deleteChat, renameChat } = useChatHistory();
  const {
    history: ingestionHistory,
    metrics: compressionMetrics,
    isLoading: ingestionLoading,
    renameIngestion,
    deleteIngestion,
    updateIngestionTags,
    compressIngestion,
  } = useCompressionData(projectId);
  const { openIngestionModal, openIngestionModalEmpty } = useIngestion();

  const selectedIngestionSet = useMemo(
    () => new Set(selectedIngestionNumbers),
    [selectedIngestionNumbers]
  );

  const selectedIngestions = useMemo(
    () => ingestionHistory.filter(e => selectedIngestionSet.has(e.number)),
    [ingestionHistory, selectedIngestionSet]
  );

  const totalIngestionTokens = useMemo(
    () => ingestionHistory.reduce((sum, e) => sum + e.tokens, 0),
    [ingestionHistory]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });

  // Use external collapse state when provided, otherwise fall back to internal
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as SidebarTab;
      return saved === 'chats' || saved === 'ingestions' ? saved : 'chats';
    }
    return 'chats';
  });

  const [searchQuery, setSearchQuery] = useState('');

  const chatHistory = chatState.historyItems;
  const currentActiveChatId = chatState.activeChatId;

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Persist collapse state (only when using internal state)
  useEffect(() => {
    if (externalCollapsed === undefined) {
      localStorage.setItem(STORAGE_KEY, String(internalCollapsed));
    }
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : (expandedWidth ?? EXPANDED_WIDTH));
  }, [isCollapsed, internalCollapsed, externalCollapsed, onWidthChange]);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Notify parent of initial width
  useEffect(() => {
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : (expandedWidth ?? EXPANDED_WIDTH));
  }, []);

  // Clear search when switching tabs
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const handleToggleCollapse = useCallback(() => {
    if (externalToggleCollapse) {
      externalToggleCollapse();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  }, [externalToggleCollapse]);

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
        const nameStr = entry.displayName?.toLowerCase() || '';
        return numStr.includes(searchLower) || dateStr.includes(searchLower) || nameStr.includes(searchLower);
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

  // Ingestion handlers
  const [isIngestionDragOver, setIsIngestionDragOver] = useState(false);

  const handleNewIngestion = useCallback(() => {
    openIngestionModalEmpty();
  }, [openIngestionModalEmpty]);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [openIngestionModal]);

  const handleIngestionDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsIngestionDragOver(true);
    }
  }, []);

  const handleIngestionDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsIngestionDragOver(false);
  }, []);

  const handleIngestionDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    e.preventDefault();
    e.stopPropagation();
    setIsIngestionDragOver(false);

    const id = `file-${Date.now()}`;
    openIngestionModal({
      id,
      name: file.name,
      size: formatFileSizeFromBytes(file.size),
      sizeBytes: file.size,
    });
  }, [openIngestionModal]);

  const resolvedExpandedWidth = expandedWidth ?? EXPANDED_WIDTH;
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : resolvedExpandedWidth;

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
        ...style,
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
          {/* Hidden file input for ingestion */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.txt"
          />

          {/* Header with collapse button - matches Explorer row style */}
          <div className="shrink-0 px-3 h-10 flex items-center justify-between border-b border-[#1e293b]">
            <span className="text-xs text-slate-400 font-medium">
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
          <div className="shrink-0 px-2 h-10 border-b border-[#1e293b]">
            <div className="flex h-full">
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
          <div className="shrink-0 px-3 py-2 border-b border-[#1e293b]">
            <div className="relative">
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <Search className="text-gray-500" size={14} />
              </div>
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
                  className="absolute inset-y-0 right-2 flex items-center"
                >
                  <span className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                    <X size={12} />
                  </span>
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
              <div
                className={cn(
                  "h-full flex flex-col transition-colors",
                  isIngestionDragOver && "bg-blue-500/10 ring-2 ring-inset ring-blue-500/40"
                )}
                onDragOver={handleIngestionDragOver}
                onDragLeave={handleIngestionDragLeave}
                onDrop={handleIngestionDrop}
              >
                {/* New Ingestion Button */}
                <div className="shrink-0 px-2 pt-2 pb-1">
                  <button
                    onClick={handleNewIngestion}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-colors"
                  >
                    <Plus size={14} />
                    <span>New Ingestion</span>
                  </button>
                </div>

                {/* Ingestion List */}
                {ingestionLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : !hasIngestionsResults ? (
                  <EmptyState type="ingestions" hasSearch={debouncedSearch.trim().length > 0} />
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <div className="py-1">
                      {filteredIngestions.map((entry) => (
                        <IngestionEntryRow
                          key={entry.number}
                          entry={entry}
                          isSelected={selectedIngestionSet.has(entry.number)}
                          onSelect={(e) => {
                            const isCtrl = 'ctrlKey' in e && (e.ctrlKey || e.metaKey);
                            if (isCtrl) {
                              // Ctrl+click: toggle this entry in/out of selection
                              const next = selectedIngestionSet.has(entry.number)
                                ? selectedIngestionNumbers.filter(n => n !== entry.number)
                                : [...selectedIngestionNumbers, entry.number];
                              onSelectIngestion?.(next);
                            } else {
                              // Regular click: navigate to Knowledge Base tab and highlight this ingestion
                              onSelectIngestion?.([entry.number]);
                              onNavigateToIngestion?.(entry.number);
                            }
                          }}
                          onRename={(newName) => renameIngestion(entry.number, newName)}
                          onDelete={() => deleteIngestion(entry.number)}
                          onUpdateTags={(tags) => updateIngestionTags(entry.number, tags)}
                          onCompress={() => compressIngestion(entry.number)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Size Bar */}
          {activeTab === 'ingestions' && (
            <div className="shrink-0 border-t border-[#1e293b] p-3 bg-slate-900/50">
              {selectedIngestions.length === 1 ? (
                // Single selection: show that ingestion's stats
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Ingestion #{selectedIngestions[0].number}:</span>
                    <span className="text-slate-300 font-medium">
                      {selectedIngestions[0].tokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${totalIngestionTokens > 0 ? (selectedIngestions[0].tokens / totalIngestionTokens) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{selectedIngestions[0].filesAdded} files added</span>
                    <span>{totalIngestionTokens > 0 ? ((selectedIngestions[0].tokens / totalIngestionTokens) * 100).toFixed(1) : 0}% of total</span>
                  </div>
                </>
              ) : selectedIngestions.length > 1 ? (
                // Multi-selection: show aggregated stats
                (() => {
                  const totalSelectedTokens = selectedIngestions.reduce((sum, e) => sum + e.tokens, 0);
                  const totalSelectedFiles = selectedIngestions.reduce((sum, e) => sum + e.filesAdded, 0);
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{selectedIngestions.length} selected:</span>
                        <span className="text-slate-300 font-medium">
                          {totalSelectedTokens.toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${totalIngestionTokens > 0 ? (totalSelectedTokens / totalIngestionTokens) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{totalSelectedFiles} files added</span>
                        <span>{totalIngestionTokens > 0 ? ((totalSelectedTokens / totalIngestionTokens) * 100).toFixed(1) : 0}% of total</span>
                      </div>
                    </>
                  );
                })()
              ) : (
                // No selection: show total context stats
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total context:</span>
                    <span className="text-slate-300 font-medium">
                      {compressionMetrics ? compressionMetrics.originalTokens.toLocaleString() : '—'} tokens
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${compressionMetrics?.savingsPercent ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{ingestionHistory.length} ingestions</span>
                    <span>
                      {compressionMetrics ? `${compressionMetrics.compressedTokens.toLocaleString()} compressed` : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

        </>
      )}
    </aside>
  );
}

export default RightSidebar;
