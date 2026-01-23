import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, Plus, Search, X, Pencil, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
import { formatRelativeTime } from '../../../../utils/chatHistoryStorage';
import type { ChatHistoryItem } from '../../../../types/chatHistory';

// ==========================================
// Props Interface
// ==========================================

interface ChatHistoryPanelProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

// ==========================================
// Panel Dimensions (consistent with spec)
// ==========================================

const PANEL_WIDTHS = {
    expanded: 280,
    collapsed: 180,
};

// ==========================================
// Date Group Types & Helpers
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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
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
    isCollapsed: boolean;
    onSelect: () => void;
    onRename: (newTitle: string) => void;
    onDelete: () => void;
}

function ChatHistoryItemComponent({
    item,
    isActive,
    isCollapsed,
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

    // Collapsed view - mini icon
    if (isCollapsed) {
        return (
            <div
                onClick={onSelect}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors",
                    isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
                title={`${item.title}\n${formatRelativeTime(item.lastActivity)}\n${item.messageCount} messages`}
            >
                <MessageSquare size={14} />
            </div>
        );
    }

    // Expanded view
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
// Group Header Component
// ==========================================

function GroupHeader({ label }: { label: string }) {
    return (
        <div className="sticky top-0 z-10 px-3 py-1.5 bg-white/5 backdrop-blur-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {label}
            </span>
        </div>
    );
}

// ==========================================
// Empty State Component
// ==========================================

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                {hasSearch ? (
                    <Search size={24} className="text-gray-500" />
                ) : (
                    <Clock size={24} className="text-gray-500" />
                )}
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
                {hasSearch ? 'No results found' : 'No chat history'}
            </h3>
            <p className="text-xs text-gray-500 max-w-[180px]">
                {hasSearch
                    ? 'Try a different search term'
                    : 'Start a new conversation to see your history here.'
                }
            </p>
        </div>
    );
}

// ==========================================
// Main Component
// ==========================================

export function ChatHistoryPanel({
    isCollapsed,
    onToggleCollapse
}: ChatHistoryPanelProps) {
    const { state, createNewChat, loadChat, deleteChat, renameChat } = useChatHistory();
    const [searchQuery, setSearchQuery] = useState('');

    const chatHistory = state.historyItems;
    const currentActiveChatId = state.activeChatId;

    // Debounced search
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Filter and group chats
    const { groupedChats, hasResults } = useMemo(() => {
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

        return { groupedChats: result, hasResults: sorted.length > 0 };
    }, [chatHistory, debouncedSearch]);

    // Handlers
    const handleSelectChat = useCallback((id: string) => {
        if (id !== state.activeChatId) {
            loadChat(id);
        }
    }, [state.activeChatId, loadChat]);

    const handleNewChat = useCallback(() => {
        createNewChat(false);
    }, [createNewChat]);

    const handleRenameChat = useCallback((id: string, newTitle: string) => {
        renameChat(id, newTitle);
    }, [renameChat]);

    const handleDeleteChat = useCallback(async (id: string) => {
        await deleteChat(id);
    }, [deleteChat]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    return (
        <div
            className={cn(
                "flex flex-col bg-white/5 rounded-lg overflow-hidden h-full",
                "border-2 border-white/10 border-solid",
                "transition-all duration-300 ease-out",
                isCollapsed && "cursor-pointer hover:bg-white/[0.07]"
            )}
            style={{
                width: isCollapsed ? PANEL_WIDTHS.collapsed : PANEL_WIDTHS.expanded,
                minWidth: isCollapsed ? PANEL_WIDTHS.collapsed : PANEL_WIDTHS.expanded,
            }}
            onClick={isCollapsed ? onToggleCollapse : undefined}
            role="complementary"
            aria-label={isCollapsed ? "Chat History (collapsed) - Click to expand" : "Chat History"}
        >
            {/* Header */}
            {isCollapsed ? (
                // Collapsed Header
                <div className="px-3 py-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <ChevronLeft size={14} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 truncate">
                            History
                        </span>
                    </div>
                    <div className="text-[11px] text-gray-500 pl-5">
                        {chatHistory.length} {chatHistory.length === 1 ? 'chat' : 'chats'}
                    </div>
                </div>
            ) : (
                // Expanded Header
                <div className="shrink-0 border-b border-white/10">
                    <div className="h-12 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            <Clock size={14} />
                            <span>Chat History</span>
                            {state.isSaving && (
                                <Loader2 size={12} className="animate-spin text-blue-400" />
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCollapse();
                            }}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                            title="Collapse panel"
                            aria-label="Collapse Chat History panel"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <div className="px-3 pb-3">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                            aria-label="Start new chat"
                        >
                            <Plus size={14} />
                            <span>New Chat</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Search Input */}
            {!isCollapsed && (
                <div className="px-3 py-2 border-b border-white/10 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search chats..."
                            aria-label="Search chat history"
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
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {state.isLoading ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : isCollapsed ? (
                    // Collapsed Content - Mini Chat List
                    <div className="p-3 flex flex-col gap-2">
                        <div className="border-t border-white/10 mb-1" />

                        <div className="flex flex-col gap-1">
                            {chatHistory.slice(0, 5).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectChat(item.id);
                                        onToggleCollapse();
                                    }}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 rounded transition-colors",
                                        "hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500/50",
                                        currentActiveChatId === item.id && "bg-blue-500/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={cn(
                                            "text-[11px] truncate flex-1",
                                            currentActiveChatId === item.id ? "text-blue-400 font-medium" : "text-gray-400"
                                        )}>
                                            {item.title.length > 12 ? item.title.substring(0, 12) + '...' : item.title}
                                        </span>
                                        <span className="text-[9px] text-gray-500 shrink-0">
                                            {(() => {
                                                const date = item.lastActivity instanceof Date ? item.lastActivity : new Date(item.lastActivity);
                                                const group = getDateGroup(date);
                                                return group === 'today' ? 'Today' :
                                                       group === 'yesterday' ? 'Yest' :
                                                       formatRelativeTime(date).replace(' ago', '');
                                            })()}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {chatHistory.length > 5 && (
                            <div className="text-[10px] text-gray-500 text-center pt-1">
                                +{chatHistory.length - 5} more...
                            </div>
                        )}

                        <div className="text-[10px] text-gray-500 text-center mt-2">
                            Click to expand
                        </div>
                    </div>
                ) : (
                    // Expanded Content - Full list with groups
                    <div className="h-full overflow-y-auto">
                        {!hasResults ? (
                            <EmptyState hasSearch={debouncedSearch.trim().length > 0} />
                        ) : (
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
                                                    isCollapsed={false}
                                                    onSelect={() => handleSelectChat(item.id)}
                                                    onRename={(newTitle) => handleRenameChat(item.id, newTitle)}
                                                    onDelete={() => handleDeleteChat(item.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
