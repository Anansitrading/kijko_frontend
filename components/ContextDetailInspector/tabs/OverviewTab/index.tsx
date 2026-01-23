import { useCallback, useState, useEffect } from 'react';
import { SummaryPanel } from './SummaryPanel';
import { ChatPanel } from './ChatPanel';
import { Toast, useToast } from '../../../Toast';
import { useContextSummary } from '../../../../hooks/useContextSummary';
import { useContextChat } from '../../../../hooks/useContextChat';
import { useContextSources } from '../../../../hooks/useContextSources';
import type { TabProps } from '../../../../types/contextInspector';

const PANEL_COLLAPSED_KEY = 'contextInspector.panelCollapsed';

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

  // Panel collapsed state with localStorage persistence
  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(PANEL_COLLAPSED_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_COLLAPSED_KEY, String(panelCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [panelCollapsed]);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setPanelCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setPanelCollapsed((prev) => !prev);
  }, []);

  const handleShowToast = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full gap-4 p-4 overflow-hidden">
        {/* Summary Panel - Collapsible with animation */}
        <div
          className={`
            min-h-[300px] lg:min-h-0 lg:h-full flex-shrink-0
            transition-all duration-300 ease-in-out
            ${panelCollapsed
              ? 'w-[50px] lg:w-[50px]'
              : 'w-full lg:w-[40%]'
            }
          `}
          style={{ willChange: 'width' }}
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
            collapsed={panelCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        {/* Chat Panel - Expands to fill available space */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 lg:h-full transition-all duration-300 ease-in-out">
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
      </div>

      {/* Toast notification */}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
