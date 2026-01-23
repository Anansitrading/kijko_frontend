import { useRef, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Copy, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '../../../../utils/cn';
import type { ChatMessage as ChatMessageType, AISummary } from '../../../../types/contextInspector';

interface ChatPanelProps {
  contextId: string;
  contextName: string;
  messages: ChatMessageType[];
  isLoading: boolean;
  summaryLoading: boolean;
  summary: AISummary | null;
  onSendMessage: (content: string) => void;
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
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  const handleCopySummary = () => {
    if (summary) {
      const text = `${summary.description}\n\nKey Components:\n${summary.keyComponents.map(c => `• ${c}`).join('\n')}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-white uppercase tracking-wider">
            Chat with Context
          </h4>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Ask questions about this codebase
        </p>
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
              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-1">
                {contextName}
              </h3>
              <p className="text-xs text-gray-500 mb-3">AI-generated summary</p>

              {/* Description */}
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {summary.description}
              </p>

              {/* Key Components */}
              {summary.keyComponents.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Key Components
                  </h6>
                  <ul className="space-y-1">
                    {summary.keyComponents.map((component, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{component}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading}
        disabled={false}
      />
    </div>
  );
}
