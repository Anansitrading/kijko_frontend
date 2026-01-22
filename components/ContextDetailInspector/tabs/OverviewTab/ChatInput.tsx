import { useState, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');

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
    <div className="flex items-end gap-2 p-3 bg-gray-900/50 border-t border-white/10">
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
  );
}
