import { useState, useCallback, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import {
  Send,
  Loader2,
  AtSign,
  Crosshair,
  ChevronDown,
  Mic,
  StopCircle,
  Paperclip,
  Maximize2,
  Minimize2,
  X,
  Check,
  Circle,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { AI_MODELS } from '../../../../types/settings';
import type { AIModel } from '../../../../types/settings';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface TokenUsage {
  currentTokens: number;
  maxTokens: number;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  tokenUsage?: TokenUsage;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  tokenUsage,
  isExpanded: externalExpanded,
  onExpandChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');

  // State for toolbar features
  const [isFollowAgentEnabled, setIsFollowAgentEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [expandedPreview, setExpandedPreview] = useState<number | null>(null);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isContextSelectorOpen, setIsContextSelectorOpen] = useState(false);

  // Use external expanded state if provided, otherwise use internal
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setIsExpanded = onExpandChange || setInternalExpanded;

  // Refs
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const contextSelectorRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
      if (contextSelectorRef.current && !contextSelectorRef.current.contains(event.target as Node)) {
        setIsContextSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key when expanded
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, setIsExpanded]);

  // Handle @ key in textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      // Check if @ was just typed
      if (newValue.endsWith('@') && !isContextSelectorOpen) {
        setIsContextSelectorOpen(true);
      }
    },
    [isContextSelectorOpen]
  );

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addAttachmentsWithPreviews = useCallback((files: File[]) => {
    const newUrls = files.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );
    setAttachments((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
      setValue('');
      previewUrls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
      setAttachments([]);
      setPreviewUrls([]);
      setExpandedPreview(null);
    }
  }, [value, isLoading, disabled, onSend, previewUrls]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
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

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;
    const recognition = new SpeechRecognitionClass();
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
    addAttachmentsWithPreviews(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addAttachmentsWithPreviews]);

  // Paste handler for clipboard images
  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (!files || files.length === 0) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addAttachmentsWithPreviews(imageFiles);
    }
  }, [addAttachmentsWithPreviews]);

  const removeAttachment = useCallback((index: number) => {
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setExpandedPreview((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  }, []);

  const handleModelSelect = useCallback((modelId: AIModel) => {
    setSelectedModel(modelId);
    setIsModelSelectorOpen(false);
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

  // Toolbar button styles
  const toolbarButtonClass = cn(
    'p-1.5 rounded-md transition-colors duration-150',
    'text-gray-500 hover:text-gray-300 hover:bg-white/5',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const activeToolbarButtonClass = cn(
    'p-1.5 rounded-md transition-colors duration-150',
    'bg-blue-500/20 text-blue-400'
  );

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={cn(
          'bg-gray-900/50 border-t border-white/10 transition-all duration-300',
          isExpanded && 'fixed inset-4 z-50 bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl flex flex-col'
        )}
      >
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div
            className="flex flex-wrap gap-2 px-4 py-2 border-b border-white/5"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpandedPreview(null);
            }}
          >
            {attachments.map((file, index) =>
              file.type.startsWith('image/') && previewUrls[index] ? (
                <div
                  key={index}
                  className={cn(
                    'relative group rounded-lg overflow-hidden bg-white/5 cursor-pointer transition-all duration-200',
                    expandedPreview === index ? 'w-1/4' : 'w-16 h-16'
                  )}
                  onClick={() => setExpandedPreview(expandedPreview === index ? null : index)}
                >
                  <img
                    src={previewUrls[index]}
                    alt={file.name}
                    className={cn(
                      'w-full',
                      expandedPreview === index ? 'h-auto object-contain' : 'h-full object-cover'
                    )}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAttachment(index); }}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
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
              )
            )}
          </div>
        )}

        {/* Main Input Card */}
        <div className={cn('p-4', isExpanded && 'flex-1 flex flex-col')}>
          <div
            className={cn(
              'relative bg-gray-800/50 border border-white/10 rounded-xl',
              isExpanded && 'flex-1 flex flex-col'
            )}
          >
            {/* Expand button in top-right corner */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'absolute top-2 right-2 p-1 rounded-md z-10',
                'text-gray-500 hover:text-gray-300 hover:bg-white/5',
                'transition-colors duration-150'
              )}
              title={isExpanded ? 'Minimize' : 'Expand'}
              aria-label={isExpanded ? 'Minimize input' : 'Expand input'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Message Kijko — @ to include context, / for commands"
              disabled={isLoading || disabled}
              rows={isExpanded ? 10 : 2}
              className={cn(
                'w-full px-4 pt-3 pb-12 bg-transparent rounded-xl',
                'text-white placeholder-gray-500 text-sm',
                'resize-none',
                isExpanded ? 'flex-1 min-h-0' : 'min-h-[80px]',
                'focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            />

            {/* Context Selector Popover */}
            {isContextSelectorOpen && (
              <div
                ref={contextSelectorRef}
                className="absolute bottom-full left-4 mb-2 w-64 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 p-3"
              >
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

            {/* Bottom Toolbar - inside the card */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 border-t border-white/5">
              {/* Left side - Icons */}
              <div className="flex items-center gap-1">
                {/* @ Context Button */}
                <button
                  onClick={() => setIsContextSelectorOpen(!isContextSelectorOpen)}
                  className={isContextSelectorOpen ? activeToolbarButtonClass : toolbarButtonClass}
                  title="Add context (or type @)"
                  aria-label="Add context"
                >
                  <AtSign className="w-4 h-4" />
                </button>

                {/* Follow Agent Toggle */}
                <button
                  role="switch"
                  aria-checked={isFollowAgentEnabled}
                  onClick={() => setIsFollowAgentEnabled(!isFollowAgentEnabled)}
                  className={isFollowAgentEnabled ? activeToolbarButtonClass : toolbarButtonClass}
                  title={isFollowAgentEnabled ? 'Following agent' : 'Follow agent'}
                  aria-label="Follow agent"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Middle - Model Selectors & Usage */}
              <div className="flex items-center gap-3">
                {/* Model Selector */}
                <div className="relative" ref={modelSelectorRef}>
                  <button
                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                      'text-gray-400 hover:text-gray-300 hover:bg-white/5',
                      'transition-colors duration-150'
                    )}
                  >
                    <span>{currentModel.name}</span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        isModelSelectorOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Model Dropdown */}
                  {isModelSelectorOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                      {AI_MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 text-left text-sm',
                            'transition-colors duration-150',
                            selectedModel === model.id
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'text-gray-300 hover:bg-white/5'
                          )}
                        >
                          <div className="flex-1">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{model.provider}</span>
                          </div>
                          {selectedModel === model.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Context Usage Meter */}
                {tokenUsage && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                      'cursor-pointer hover:bg-white/5 transition-colors',
                      tokenWarning?.isNearLimit
                        ? 'text-red-400'
                        : tokenWarning?.isWarning
                        ? 'text-amber-400'
                        : 'text-gray-400'
                    )}
                    title={`${formatNumber(tokenUsage.currentTokens)} / ${formatNumber(tokenUsage.maxTokens)} tokens used`}
                  >
                    <Circle
                      className={cn(
                        'w-3.5 h-3.5',
                        tokenWarning?.isNearLimit
                          ? 'fill-red-400'
                          : tokenWarning?.isWarning
                          ? 'fill-amber-400'
                          : 'fill-gray-400'
                      )}
                    />
                    <span>{Math.round(tokenWarning?.percentage ?? 0)}% used</span>
                  </div>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-1">
                {/* Voice Input */}
                <button
                  onClick={toggleRecording}
                  className={cn(
                    toolbarButtonClass,
                    isRecording && 'bg-red-500/20 text-red-400 animate-pulse'
                  )}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  aria-label={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Attachments */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={toolbarButtonClass}
                  title="Add attachments"
                  aria-label="Add attachments"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Send Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  className={cn(
                    'p-1.5 rounded-md transition-all duration-200',
                    isDisabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  )}
                  title="Send message"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
