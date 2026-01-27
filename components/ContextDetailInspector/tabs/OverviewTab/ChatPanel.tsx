import { useRef, useEffect, useCallback, useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Bot, Plus, X, Pencil, MessageSquare, Clock } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '../../../../utils/cn';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import type { ChatMessage as ChatMessageType, AISummary } from '../../../../types/contextInspector';

interface TokenUsage {
  currentTokens: number;
  maxTokens: number;
}

interface ChatPanelProps {
  contextId: string;
  contextName: string;
  messages: ChatMessageType[];
  isLoading: boolean;
  summaryLoading: boolean;
  summary: AISummary | null;
  onSendMessage: (content: string) => void;
  onStop?: () => void;
  tokenUsage?: TokenUsage;
}

// Suggested questions based on context
const suggestedQuestions = [
  'What are the main components in this codebase?',
  'How is the state management implemented?',
  'What are the key dependencies used?',
];

export function ChatPanel({
  contextId,
  contextName,
  messages,
  isLoading,
  summaryLoading,
  summary,
  onSendMessage,
  onStop,
  tokenUsage,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { state, createNewChat, closeTab, focusTab, renameChat } = useChatHistory();
  const { state: layoutState, toggleChatInput, openChatHistory, closeChatHistory } = useLayout();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  // Inline rename state
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNewChat = useCallback(() => {
    createNewChat(true); // Retain source files
  }, [createNewChat]);

  // Right-click on tab
  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  }, []);

  // Start renaming from context menu
  const handleStartRename = useCallback(() => {
    if (!contextMenu) return;
    const session = state.openTabSessions[contextMenu.tabId];
    const currentTitle = session?.metadata?.title || 'New Chat';
    setRenamingTabId(contextMenu.tabId);
    setRenameValue(currentTitle);
    setContextMenu(null);
  }, [contextMenu, state.openTabSessions]);

  // Confirm rename
  const handleConfirmRename = useCallback(() => {
    if (renamingTabId && renameValue.trim()) {
      renameChat(renamingTabId, renameValue.trim());
    }
    setRenamingTabId(null);
    setRenameValue('');
  }, [renamingTabId, renameValue, renameChat]);

  // Cancel rename
  const handleCancelRename = useCallback(() => {
    setRenamingTabId(null);
    setRenameValue('');
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingTabId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.description);
    }
  };

  const hasOpenTabs = state.openTabIds.length > 0;

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Header - Chat Session Tabs (matches Explorer row style) */}
      <div className="border-b border-[#1e293b] flex items-center overflow-x-auto shrink-0 h-10 scrollbar-hide">
        {hasOpenTabs ? (
          <>
            {state.openTabIds.map((tabId) => {
              const tabSession = state.openTabSessions[tabId];
              const isActive = state.activeChatId === tabId;
              const title = tabSession?.metadata?.title || 'New Chat';
              const isRenaming = renamingTabId === tabId;

              return (
                <div
                  key={tabId}
                  onClick={() => !isRenaming && focusTab(tabId)}
                  onContextMenu={(e) => handleTabContextMenu(e, tabId)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 h-full cursor-pointer',
                    'text-xs font-medium whitespace-nowrap max-w-[180px]',
                    'transition-colors duration-150 group border-r border-white/5',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      onBlur={handleConfirmRename}
                      className="bg-white/10 text-white text-xs rounded px-1 py-0.5 w-[120px] outline-none border border-blue-500/50 focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{title}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabId);
                    }}
                    className={cn(
                      'flex-shrink-0 p-0.5 rounded hover:bg-white/10',
                      'opacity-0 group-hover:opacity-100',
                      isActive && 'opacity-60',
                      'transition-opacity duration-150'
                    )}
                    title="Close tab"
                    aria-label={`Close ${title}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </div>
              );
            })}
          </>
        ) : null}

        {/* New Chat button - pushed to right */}
        <button
          onClick={handleNewChat}
          className={cn(
            'p-2 flex-shrink-0 ml-auto',
            'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-150'
          )}
          title="New chat"
          aria-label="Start new chat"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Chat History toggle button */}
        <button
          onClick={layoutState.rightSidebarTab === 'chats' && !layoutState.rightSidebarCollapsed ? closeChatHistory : openChatHistory}
          className={cn(
            'p-2 flex-shrink-0',
            layoutState.rightSidebarTab === 'chats' && !layoutState.rightSidebarCollapsed
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-150'
          )}
          title="Chat history"
          aria-label="Toggle chat history"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Summary as first message */}
        {summaryLoading ? (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-48" />
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-5/6" />
              <div className="h-3 bg-gray-700 rounded w-4/6" />
            </div>
          </div>
        ) : summary ? (
          <div className="flex gap-3">
            {/* Bot Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>

            {/* Summary Content */}
            <div className="flex-1">
              {/* Agent Title - Kijko */}
              <h3 className="text-lg font-semibold text-white mb-1">
                Kijko
              </h3>
              <p className="text-xs text-gray-500 mb-3">AI-generated summary</p>

              {/* Description */}
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {summary.description}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleCopySummary}
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-gray-500 hover:text-gray-300 hover:bg-white/5',
                    'transition-colors duration-150'
                  )}
                  title="Copy summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-gray-500 hover:text-green-400 hover:bg-green-500/10',
                    'transition-colors duration-150'
                  )}
                  title="Helpful"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-gray-500 hover:text-red-400 hover:bg-red-500/10',
                    'transition-colors duration-150'
                  )}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Suggested questions */}
              {messages.length === 0 && (
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg',
                        'bg-white/5 border border-white/10',
                        'text-sm text-gray-300',
                        'hover:bg-white/10 hover:border-white/20',
                        'transition-all duration-150'
                      )}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* User/Assistant messages */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {layoutState.chatInputCollapsed ? (
        <button
          onClick={toggleChatInput}
          className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 border-t border-[#1e293b] text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Show chat input</span>
        </button>
      ) : (
        <ChatInput
          onSend={onSendMessage}
          onStop={onStop}
          isLoading={isLoading}
          disabled={false}
          tokenUsage={tokenUsage}
        />
      )}

      {/* Tab context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-44 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 50),
          }}
        >
          <button
            onClick={handleStartRename}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Rename</span>
          </button>
        </div>
      )}
    </div>
  );
}
