// Skill Chat Component
// Main chat panel for the conversational skill builder

import { useRef, useEffect, useState } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { SkillChatInput } from './SkillChatInput';
import { SkillConfigApproval } from './SkillConfigApproval';
import type { SkillBuilderMessage, ProposedSkillConfig } from '../../../types/skillDraft';

interface SkillChatProps {
  messages: SkillBuilderMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onApproveConfig: (messageId: string, modifications?: Partial<ProposedSkillConfig>) => void;
  onRejectConfig: (messageId: string) => void;
  className?: string;
  mode?: 'create' | 'edit';
  skillName?: string;
}

export function SkillChat({
  messages,
  isLoading,
  isStreaming,
  error,
  onSendMessage,
  onApproveConfig,
  onRejectConfig,
  className,
  mode = 'create',
  skillName,
}: SkillChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, userScrolledUp]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setUserScrolledUp(!isAtBottom);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border border-amber-500/30 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {mode === 'edit' ? `Edit: ${skillName || 'Skill'}` : 'Create New Skill'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {mode === 'edit' ? 'Modify your skill through conversation' : 'Build your skill through conversation'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/30">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onApprove={(mods) => onApproveConfig(message.id, mods)}
            onReject={() => onRejectConfig(message.id)}
          />
        ))}

        {/* Typing/Streaming Indicator */}
        {(isLoading || isStreaming) && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
              <Bot size={14} className="text-muted-foreground" />
            </div>
            <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-secondary border border-border">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <SkillChatInput
        onSend={onSendMessage}
        disabled={isLoading || isStreaming}
        placeholder={mode === 'edit' ? 'Ask me to modify this skill...' : 'Describe what you want the skill to do...'}
      />
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: SkillBuilderMessage;
  onApprove: (modifications?: Partial<ProposedSkillConfig>) => void;
  onReject: () => void;
}

function MessageBubble({ message, onApprove, onReject }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'flex gap-2 animate-fade-in-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-muted-foreground border border-border'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Message Content */}
      <div
        className={cn('flex flex-col max-w-[85%]', isUser ? 'items-end' : 'items-start')}
      >
        <div
          className={cn(
            'px-3 py-2 rounded-2xl text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-foreground rounded-bl-md border border-border'
          )}
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </div>

        {/* Skill Config Approval (for assistant messages with proposed config) */}
        {!isUser && message.proposedConfig && message.configStatus && (
          <SkillConfigApproval
            config={message.proposedConfig}
            status={message.configStatus}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}

        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
