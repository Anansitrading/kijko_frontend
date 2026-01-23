import { useCallback, useState, useEffect } from 'react';
import { ChatPanel } from '../../../../components/ContextDetailInspector/tabs/OverviewTab/ChatPanel';
import { Toast, useToast } from '../../../../components/Toast';
import { useContextSummary } from '../../../../hooks/useContextSummary';
import { useContextChat } from '../../../../hooks/useContextChat';
import { useTokenUsage } from '../../../../hooks/useTokenUsage';
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
 */
export function PageOverviewTab({ contextItem }: PageOverviewTabProps) {
  const { summary, isLoading: summaryLoading } = useContextSummary(contextItem.id);
  const { messages, isLoading: chatLoading, sendMessage } = useContextChat(contextItem.id);
  const tokenUsage = useTokenUsage();
  const { toast, showToast, hideToast } = useToast();

  return (
    <>
      <div className="flex h-full p-4 overflow-hidden">
        {/* Full-width chat panel since source files are in the left sidebar */}
        <div className="flex-1 min-w-0 h-full">
          <ChatPanel
            contextId={contextItem.id}
            contextName={contextItem.name}
            messages={messages}
            isLoading={chatLoading}
            summaryLoading={summaryLoading}
            summary={summary}
            onSendMessage={sendMessage}
            tokenUsage={tokenUsage}
          />
        </div>
      </div>

      {/* Toast notification */}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
