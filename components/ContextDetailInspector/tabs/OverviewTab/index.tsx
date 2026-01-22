import { SummaryPanel } from './SummaryPanel';
import { ChatPanel } from './ChatPanel';
import { useContextSummary } from '../../../../hooks/useContextSummary';
import { useContextChat } from '../../../../hooks/useContextChat';
import type { TabProps } from '../../../../types/contextInspector';

export function OverviewTab({ contextItem }: TabProps) {
  const { summary, isLoading: summaryLoading, regenerate } = useContextSummary(
    contextItem.id
  );
  const { messages, isLoading: chatLoading, sendMessage } = useContextChat(
    contextItem.id
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 overflow-hidden">
      {/* Summary Panel - 40% width on desktop */}
      <div className="w-full lg:w-[40%] min-h-[300px] lg:min-h-0 lg:h-full flex-shrink-0">
        <SummaryPanel
          contextItem={contextItem}
          summary={summary}
          isLoading={summaryLoading}
          onRegenerate={regenerate}
        />
      </div>

      {/* Chat Panel - 60% width on desktop */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 lg:h-full">
        <ChatPanel
          contextId={contextItem.id}
          messages={messages}
          isLoading={chatLoading}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
}
