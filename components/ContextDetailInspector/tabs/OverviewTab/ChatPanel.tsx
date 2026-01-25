import { useRef, useEffect, useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Bot, Maximize2, Minimize2, Plus } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '../../../../utils/cn';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';
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
  tokenUsage,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { createNewChat } = useChatHistory();

  const handleNewChat = useCallback(() => {
    createNewChat(true); // Retain source files
  }, [createNewChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Escape key to close expanded view
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when expanded
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.description);
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleExpand}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'flex flex-col bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded
            ? 'fixed inset-4 z-50 rounded-xl shadow-2xl shadow-black/50'
            : 'h-full rounded-lg'
        )}
      >
        {/* Header - New Chat & Expand Buttons */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-end gap-1">
          <button
            onClick={handleNewChat}
            className={cn(
              'p-1.5 rounded-md',
              'text-gray-400 hover:text-white hover:bg-white/10',
              'transition-colors duration-150'
            )}
            title="New chat"
            aria-label="Start new chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleExpand}
            className={cn(
              'p-1.5 rounded-md',
              'text-gray-400 hover:text-white hover:bg-white/10',
              'transition-colors duration-150'
            )}
            title={isExpanded ? 'Minimize chat' : 'Maximize chat'}
            aria-label={isExpanded ? 'Minimize chat' : 'Maximize chat'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
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
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading}
          disabled={false}
          tokenUsage={tokenUsage}
        />
      </div>
    </>
  );
}
