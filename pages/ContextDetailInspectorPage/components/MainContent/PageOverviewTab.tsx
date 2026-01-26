import { useCallback } from 'react';
import { ChatPanel } from '../../../../components/ContextDetailInspector/tabs/OverviewTab/ChatPanel';
import { Toast, useToast } from '../../../../components/Toast';
import { useContextSummary } from '../../../../hooks/useContextSummary';
import { useContextChat } from '../../../../hooks/useContextChat';
import { useTokenUsage } from '../../../../hooks/useTokenUsage';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
import type { ContextItem } from '../../../../types/contextInspector';

interface PageOverviewTabProps {
  contextItem: ContextItem;
}

/**
 * Page-specific OverviewTab that integrates with SourceFilesContext.
 * Unlike the modal's OverviewTab, this version:
 * - Uses SourceFilesContext for token calculations (via useTokenUsage)
 * - Does not show source files panel (it's in the LeftSidebar)
 * - Shows only the chat panel in a full-width layout
 * - Keys chat to activeChatId for multi-tab support
 */
export function PageOverviewTab({ contextItem }: PageOverviewTabProps) {
  const { state, addMessage } = useChatHistory();
  const chatId = state.activeChatId || contextItem.id;

  const { summary, isLoading: summaryLoading } = useContextSummary(contextItem.id);
  const { messages, isLoading: chatLoading, sendMessage } = useContextChat(chatId);
  const tokenUsage = useTokenUsage();
  const { toast, hideToast } = useToast();

  // Wrap sendMessage to also dispatch to ChatHistoryContext,
  // which triggers auto-rename of the tab from the first user message
  const handleSendMessage = useCallback((content: string) => {
    addMessage({ role: 'user', content });
    sendMessage(content);
  }, [addMessage, sendMessage]);

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Full-width chat panel since source files are in the left sidebar */}
        <div className="flex-1 min-w-0 h-full">
          <ChatPanel
            contextId={chatId}
            contextName={contextItem.name}
            messages={messages}
            isLoading={chatLoading}
            summaryLoading={summaryLoading}
            summary={summary}
            onSendMessage={handleSendMessage}
            tokenUsage={tokenUsage}
          />
        </div>
      </div>

      {/* Toast notification */}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
