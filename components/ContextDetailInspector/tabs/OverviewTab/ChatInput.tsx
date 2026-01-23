import { useState, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface TokenUsage {
  currentTokens: number;
  maxTokens: number;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  tokenUsage?: TokenUsage;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function ChatInput({ onSend, isLoading, disabled = false, tokenUsage }: ChatInputProps) {
  const [value, setValue] = useState('');

  // Calculate token warning state
  const tokenWarning = tokenUsage
    ? {
        percentage: (tokenUsage.currentTokens / tokenUsage.maxTokens) * 100,
        isWarning: tokenUsage.currentTokens / tokenUsage.maxTokens >= 0.8,
        isNearLimit: tokenUsage.currentTokens / tokenUsage.maxTokens >= 0.95,
      }
    : null;

  const handleSubmit = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isDisabled = isLoading || disabled || !value.trim();

  return (
    <div className="bg-gray-900/50 border-t border-white/10">
      {/* Token Usage Display */}
      {tokenUsage && (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5">
          {/* Warning icon when near limit */}
          {tokenWarning?.isWarning && (
            <AlertTriangle
              className={cn(
                'w-4 h-4 flex-shrink-0',
                tokenWarning.isNearLimit ? 'text-red-500' : 'text-amber-500'
              )}
            />
          )}

          {/* Token count text */}
          <div className="flex items-center gap-1.5 text-sm">
            <span
              className={cn(
                'font-medium',
                tokenWarning?.isNearLimit
                  ? 'text-red-400'
                  : tokenWarning?.isWarning
                  ? 'text-amber-400'
                  : 'text-gray-300'
              )}
            >
              {formatNumber(tokenUsage.currentTokens)}
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-500">{formatNumber(tokenUsage.maxTokens)}</span>
            <span className="text-gray-500 text-xs ml-0.5">tokens</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 min-w-[60px] max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                tokenWarning?.isNearLimit
                  ? 'bg-red-500'
                  : tokenWarning?.isWarning
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              )}
              style={{ width: `${Math.min(tokenWarning?.percentage ?? 0, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this context..."
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl',
              'text-white placeholder-gray-500 text-sm',
              'resize-none min-h-[42px] max-h-[120px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            style={{
              height: 'auto',
              overflow: 'hidden',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl',
            'transition-all duration-200',
            isDisabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
