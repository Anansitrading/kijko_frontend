import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Send,
  Loader2,
  AlertTriangle,
  AtSign,
  Crosshair,
  Bot,
  ChevronDown,
  Mic,
  StopCircle,
  Paperclip,
  Maximize2,
  Minimize2,
  X,
  Check,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { AI_MODELS } from '../../../../types/settings';
import type { AIModel } from '../../../../types/settings';

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

  // New state for toolbar features
  const [isFollowAgentEnabled, setIsFollowAgentEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContextSelectorOpen, setIsContextSelectorOpen] = useState(false);

  // Refs
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Get current model info
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  // Calculate token warning state
  const tokenWarning = tokenUsage
    ? {
        percentage: (tokenUsage.currentTokens / tokenUsage.maxTokens) * 100,
        isWarning: tokenUsage.currentTokens / tokenUsage.maxTokens >= 0.8,
        isNearLimit: tokenUsage.currentTokens / tokenUsage.maxTokens >= 0.95,
      }
    : null;

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle @ key in textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Check if @ was just typed
    if (newValue.endsWith('@') && !isContextSelectorOpen) {
      setIsContextSelectorOpen(true);
    }
  }, [isContextSelectorOpen]);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
      setValue('');
      setAttachments([]);
    }
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // Close context selector on Escape
      if (e.key === 'Escape') {
        setIsContextSelectorOpen(false);
        setIsModelSelectorOpen(false);
      }
    },
    [handleSubmit]
  );

  // Voice input handlers
  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue((prev) => prev + transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // File attachment handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleModelSelect = useCallback((modelId: AIModel) => {
    setSelectedModel(modelId);
    setIsModelSelectorOpen(false);
    // Persist to localStorage
    localStorage.setItem('kijko_selected_model', modelId);
  }, []);

  // Load saved model on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('kijko_selected_model') as AIModel | null;
    if (savedModel && AI_MODELS.some((m) => m.id === savedModel)) {
      setSelectedModel(savedModel);
    }
  }, []);

  const isDisabled = isLoading || disabled || !value.trim();

  // Button base styles
  const toolbarButtonClass = cn(
    'p-2 rounded-lg transition-colors duration-150',
    'text-gray-500 hover:text-gray-300 hover:bg-white/5',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const activeToolbarButtonClass = cn(
    'p-2 rounded-lg transition-colors duration-150',
    'bg-blue-500/20 text-blue-400'
  );

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

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-white/5">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg text-sm"
            >
              <Paperclip className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area with Toolbars */}
      <div className="flex items-end gap-2 p-3">
        {/* Left Toolbar */}
        <div className="flex items-center gap-1 pb-1">
          {/* @ Context Button */}
          <button
            onClick={() => setIsContextSelectorOpen(!isContextSelectorOpen)}
            className={isContextSelectorOpen ? activeToolbarButtonClass : toolbarButtonClass}
            title="Add context (or type @)"
            aria-label="Add context"
          >
            <AtSign className="w-5 h-5" />
          </button>

          {/* Follow Agent Toggle */}
          <button
            role="switch"
            aria-checked={isFollowAgentEnabled}
            onClick={() => setIsFollowAgentEnabled(!isFollowAgentEnabled)}
            className={isFollowAgentEnabled ? activeToolbarButtonClass : toolbarButtonClass}
            title={isFollowAgentEnabled ? 'Following agent location' : 'Follow agent location'}
            aria-label="Follow agent"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Model Selector */}
          <div className="relative" ref={modelSelectorRef}>
            <button
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors duration-150',
                isModelSelectorOpen
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
              title="Select model"
              aria-label="Select AI model"
            >
              <Bot className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">{currentModel.name}</span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform duration-200',
                  isModelSelectorOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Model Dropdown - Opens upward */}
            {isModelSelectorOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150',
                      selectedModel === model.id
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-gray-300 hover:bg-white/5'
                    )}
                  >
                    <Bot className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{model.name}</span>
                        <span className="text-xs text-gray-500">{model.provider}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{model.description}</p>
                    </div>
                    {selectedModel === model.id && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this context..."
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl',
              'text-white placeholder-gray-500 text-sm',
              'resize-none',
              isExpanded ? 'min-h-[120px] max-h-[300px]' : 'min-h-[42px] max-h-[120px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            style={{
              height: 'auto',
              overflow: isExpanded ? 'auto' : 'hidden',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              const maxHeight = isExpanded ? 300 : 120;
              target.style.height = Math.min(target.scrollHeight, maxHeight) + 'px';
            }}
          />

          {/* Context Selector Popover - would be positioned here */}
          {isContextSelectorOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 p-3">
              <p className="text-xs text-gray-500 mb-2">Add context to your message</p>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5 rounded">
                  📄 Current file
                </button>
                <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5 rounded">
                  📁 Project files
                </button>
                <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5 rounded">
                  🔍 Search symbols
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">or type @ to include context</p>
            </div>
          )}
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-1 pb-1">
          {/* Voice Input */}
          <button
            onClick={toggleRecording}
            className={cn(
              toolbarButtonClass,
              isRecording && 'bg-red-500/20 text-red-400 animate-pulse'
            )}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Attachments */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={toolbarButtonClass}
            title="Add attachments"
            aria-label="Add attachments"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={isExpanded ? activeToolbarButtonClass : toolbarButtonClass}
            title={isExpanded ? 'Compact input' : 'Expand input'}
            aria-label={isExpanded ? 'Compact input' : 'Expand input'}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Send Button */}
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
