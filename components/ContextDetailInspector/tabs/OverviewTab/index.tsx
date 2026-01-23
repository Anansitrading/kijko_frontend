import { useCallback, useState, useEffect } from 'react';
import { SummaryPanel } from './SummaryPanel';
import { ChatPanel } from './ChatPanel';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { Toast, useToast } from '../../../Toast';
import { useContextSummary } from '../../../../hooks/useContextSummary';
import { useContextChat } from '../../../../hooks/useContextChat';
import { useContextSources } from '../../../../hooks/useContextSources';
import type { TabProps } from '../../../../types/contextInspector';

// Panel state persistence keys
const SOURCE_PANEL_COLLAPSED_KEY = 'contextInspector.sourcePanelCollapsed';
const HISTORY_PANEL_COLLAPSED_KEY = 'contextInspector.historyPanelCollapsed';

// Panel dimensions (consistent with spec)
const PANEL_WIDTHS = {
  sourceFilesExpanded: 300,
  sourceFilesCollapsed: 180,
  chatHistoryExpanded: 280,
  chatHistoryCollapsed: 180,
};

export function OverviewTab({ contextItem }: TabProps) {
  const { summary, isLoading: summaryLoading } = useContextSummary(
    contextItem.id
  );
  const { messages, isLoading: chatLoading, sendMessage } = useContextChat(
    contextItem.id
  );
  const {
    sources,
    isLoading: sourcesLoading,
    selectedCount,
    totalCount,
    allSelected,
    toggleSource,
    toggleAll,
    handleFilesAdded,
  } = useContextSources(contextItem.id);

  const { toast, showToast, hideToast } = useToast();

  // Panel collapsed states with localStorage persistence
  const [sourceFilesCollapsed, setSourceFilesCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SOURCE_PANEL_COLLAPSED_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_PANEL_COLLAPSED_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Save collapsed states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SOURCE_PANEL_COLLAPSED_KEY, String(sourceFilesCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [sourceFilesCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_PANEL_COLLAPSED_KEY, String(chatHistoryCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [chatHistoryCollapsed]);

  // Keyboard shortcuts: Ctrl+B for source files, Ctrl+H for chat history
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') {
          e.preventDefault();
          setSourceFilesCollapsed((prev) => !prev);
        } else if (e.key === 'h') {
          e.preventDefault();
          setChatHistoryCollapsed((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSourceFiles = useCallback(() => {
    setSourceFilesCollapsed((prev) => !prev);
  }, []);

  const handleToggleChatHistory = useCallback(() => {
    setChatHistoryCollapsed((prev) => !prev);
  }, []);

  const handleShowToast = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  return (
    <>
      {/*
        THREE-COLUMN LAYOUT (Sprint EX1)
        ┌─────────────┬──────────────────┬─────────────┐
        │Source Files │   Chat Window    │Chat History │
        │   (left)    │     (center)     │   (right)   │
        └─────────────┴──────────────────┴─────────────┘
      */}
      <div className="flex h-full gap-4 p-4 overflow-hidden">
        {/* LEFT PANEL: Source Files - Collapsible */}
        <div
          className="flex-shrink-0 h-full transition-all duration-300 ease-in-out"
          style={{
            width: sourceFilesCollapsed ? PANEL_WIDTHS.sourceFilesCollapsed : PANEL_WIDTHS.sourceFilesExpanded,
            minWidth: sourceFilesCollapsed ? PANEL_WIDTHS.sourceFilesCollapsed : PANEL_WIDTHS.sourceFilesExpanded,
          }}
        >
          <SummaryPanel
            contextItem={contextItem}
            sources={sources}
            isLoading={sourcesLoading}
            selectedCount={selectedCount}
            totalCount={totalCount}
            allSelected={allSelected}
            onToggleSource={toggleSource}
            onToggleAll={toggleAll}
            onFilesAdded={handleFilesAdded}
            onShowToast={handleShowToast}
            collapsed={sourceFilesCollapsed}
            onToggleCollapse={handleToggleSourceFiles}
          />
        </div>

        {/* CENTER: Chat Window - Expands to fill available space */}
        <div className="flex-1 min-w-0 h-full transition-all duration-300 ease-in-out">
          <ChatPanel
            contextId={contextItem.id}
            contextName={contextItem.name}
            messages={messages}
            isLoading={chatLoading}
            summaryLoading={summaryLoading}
            summary={summary}
            onSendMessage={sendMessage}
          />
        </div>

        {/* RIGHT PANEL: Chat History - Collapsible */}
        <div
          className="flex-shrink-0 h-full transition-all duration-300 ease-in-out"
          style={{
            width: chatHistoryCollapsed ? PANEL_WIDTHS.chatHistoryCollapsed : PANEL_WIDTHS.chatHistoryExpanded,
            minWidth: chatHistoryCollapsed ? PANEL_WIDTHS.chatHistoryCollapsed : PANEL_WIDTHS.chatHistoryExpanded,
          }}
        >
          <ChatHistoryPanel
            isCollapsed={chatHistoryCollapsed}
            onToggleCollapse={handleToggleChatHistory}
          />
        </div>
      </div>

      {/* Toast notification */}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
