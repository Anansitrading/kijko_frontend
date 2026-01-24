/**
 * Step 3: Advanced Settings
 * Advanced configuration for project processing including:
 * - Chunking strategy selection
 * - Metadata extraction options
 * - Output format selection
 * - File pattern filters
 * - Processing options
 */

import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import {
  Settings2,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
  ChunkingStrategy,
  OutputFormat,
  MetadataOptions,
  PatternFilters,
  ProcessingOptions,
} from '../../../types/project';
import {
  CHUNKING_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  METADATA_OPTION_LABELS,
  PROCESSING_OPTION_LABELS,
  DEFAULT_METADATA_OPTIONS,
  DEFAULT_PROCESSING_OPTIONS,
  DEFAULT_PATTERN_FILTERS,
} from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface Step3AdvancedSettingsProps {
  // Chunking strategy
  chunkingStrategy: ChunkingStrategy;
  webhookUrl?: string;
  onChunkingChange: (strategy: ChunkingStrategy, webhookUrl?: string) => void;

  // Metadata options
  metadataOptions: MetadataOptions;
  onMetadataChange: (options: MetadataOptions) => void;

  // Output format
  outputFormat: OutputFormat;
  embeddingModel?: string;
  onOutputFormatChange: (format: OutputFormat, embeddingModel?: string) => void;

  // Pattern filters
  patternFilters: PatternFilters;
  onPatternFiltersChange: (filters: PatternFilters) => void;

  // Processing options
  processingOptions: ProcessingOptions;
  onProcessingOptionsChange: (options: ProcessingOptions) => void;

  // Skip handler
  onSkip?: () => void;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
}

function SectionHeader({
  title,
  description,
  isCollapsed,
  onToggle,
  collapsible = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        collapsible && 'cursor-pointer'
      )}
      onClick={collapsible ? onToggle : undefined}
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          {title}
          {collapsible && (
            <span className="text-muted-foreground">
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </span>
          )}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-foreground max-w-xs whitespace-normal">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Chunking Strategy Section
// =============================================================================

interface ChunkingStrategySectionProps {
  value: ChunkingStrategy;
  webhookUrl?: string;
  onChange: (strategy: ChunkingStrategy, webhookUrl?: string) => void;
}

function ChunkingStrategySection({
  value,
  webhookUrl,
  onChange,
}: ChunkingStrategySectionProps) {
  const [localWebhookUrl, setLocalWebhookUrl] = useState(webhookUrl || '');

  const handleWebhookUrlChange = (url: string) => {
    setLocalWebhookUrl(url);
    onChange('custom', url);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Chunking Strategy"
        description="How content is split for AI processing"
      />

      <div className="space-y-2">
        {CHUNKING_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
              value === option.value
                ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            )}
          >
            <input
              type="radio"
              name="chunking-strategy"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value, option.value === 'custom' ? localWebhookUrl : undefined)}
              className="sr-only"
            />

            {/* Custom Radio */}
            <div
              className={cn(
                'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                value === option.value
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40'
              )}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium text-sm',
                    value === option.value ? 'text-foreground' : 'text-foreground/80'
                  )}
                >
                  {option.label}
                </span>
                {option.recommended && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                    Recommended
                  </span>
                )}
                <Tooltip content={option.description}>
                  <Info size={14} className="text-muted-foreground cursor-help" />
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
          </label>
        ))}

        {/* Webhook URL input for custom strategy */}
        {value === 'custom' && (
          <div className="ml-8 mt-2">
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Webhook URL
            </label>
            <input
              type="url"
              value={localWebhookUrl}
              onChange={(e) => handleWebhookUrlChange(e.target.value)}
              placeholder="https://your-api.com/chunk"
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Metadata Extraction Section
// =============================================================================

interface MetadataExtractionSectionProps {
  value: MetadataOptions;
  onChange: (options: MetadataOptions) => void;
}

function MetadataExtractionSection({
  value,
  onChange,
}: MetadataExtractionSectionProps) {
  const allSelected = Object.values(value).every((v) => v);
  const noneSelected = Object.values(value).every((v) => !v);

  const handleToggleAll = () => {
    const newValue = allSelected
      ? {
          functionSignatures: false,
          importDependencies: false,
          gitHistory: false,
          fileStructure: false,
          customAnnotations: false,
        }
      : {
          functionSignatures: true,
          importDependencies: true,
          gitHistory: true,
          fileStructure: true,
          customAnnotations: true,
        };
    onChange(newValue);
  };

  const handleToggle = (key: keyof MetadataOptions) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Metadata Extraction"
          description="What metadata to extract from your code"
        />
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-xs text-primary hover:text-primary/80 font-medium"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="space-y-2">
        {(Object.keys(METADATA_OPTION_LABELS) as (keyof MetadataOptions)[]).map((key) => {
          const option = METADATA_OPTION_LABELS[key];
          return (
            <label
              key={key}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                value[key]
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              )}
            >
              <input
                type="checkbox"
                checked={value[key]}
                onChange={() => handleToggle(key)}
                className="sr-only"
              />

              {/* Custom Checkbox */}
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                  value[key]
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {value[key] && <Check size={12} className="text-primary-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {option.label}
                  </span>
                  <Tooltip content={option.description}>
                    <Info size={14} className="text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Output Format Section
// =============================================================================

interface OutputFormatSectionProps {
  value: OutputFormat;
  embeddingModel?: string;
  onChange: (format: OutputFormat, embeddingModel?: string) => void;
}

function OutputFormatSection({
  value,
  embeddingModel,
  onChange,
}: OutputFormatSectionProps) {
  const [showPreview, setShowPreview] = useState<OutputFormat | null>(null);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Output Format"
        description="How processed content is stored and retrieved"
      />

      <div className="space-y-2">
        {OUTPUT_FORMAT_OPTIONS.map((option) => (
          <div key={option.value}>
            <label
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                value === option.value
                  ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              )}
            >
              <input
                type="radio"
                name="output-format"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              {/* Custom Radio */}
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                  value === option.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium text-sm',
                      value === option.value ? 'text-foreground' : 'text-foreground/80'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>

                {/* Preview toggle */}
                {option.previewSnippet && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPreview(showPreview === option.value ? null : option.value);
                    }}
                    className="text-xs text-primary hover:text-primary/80 mt-1.5"
                  >
                    {showPreview === option.value ? 'Hide preview' : 'Show preview'}
                  </button>
                )}
              </div>
            </label>

            {/* Preview snippet */}
            {showPreview === option.value && option.previewSnippet && (
              <div className="ml-8 mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-x-auto">
                  {option.previewSnippet}
                </pre>
              </div>
            )}
          </div>
        ))}

        {/* Embedding model selector for vector format */}
        {value === 'vector' && (
          <div className="ml-8 mt-2">
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Embedding Model
            </label>
            <select
              value={embeddingModel || 'text-embedding-3-small'}
              onChange={(e) => onChange('vector', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536d)</option>
              <option value="text-embedding-3-large">OpenAI text-embedding-3-large (3072d)</option>
              <option value="text-embedding-ada-002">OpenAI text-embedding-ada-002 (1536d)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Pattern Filters Section
// =============================================================================

interface PatternFiltersSectionProps {
  value: PatternFilters;
  onChange: (filters: PatternFilters) => void;
}

function PatternFiltersSection({
  value,
  onChange,
}: PatternFiltersSectionProps) {
  const [languageInput, setLanguageInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const languageInputRef = useRef<HTMLInputElement>(null);
  const excludeInputRef = useRef<HTMLInputElement>(null);

  const addPattern = (type: 'languagePatterns' | 'excludePatterns', pattern: string) => {
    const trimmed = pattern.trim();
    if (!trimmed) return;

    // Split by comma for bulk add
    const patterns = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

    const currentPatterns = value[type];
    const newPatterns = patterns.filter((p) => !currentPatterns.includes(p));

    if (newPatterns.length > 0) {
      onChange({
        ...value,
        [type]: [...currentPatterns, ...newPatterns],
      });
    }
  };

  const removePattern = (type: 'languagePatterns' | 'excludePatterns', pattern: string) => {
    onChange({
      ...value,
      [type]: value[type].filter((p) => p !== pattern),
    });
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    type: 'languagePatterns' | 'excludePatterns',
    inputValue: string,
    setInputValue: (value: string) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addPattern(type, inputValue);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value[type].length > 0) {
      // Remove last pattern when backspace on empty input
      removePattern(type, value[type][value[type].length - 1]);
    }
  };

  const renderPatternInput = (
    type: 'languagePatterns' | 'excludePatterns',
    label: string,
    placeholder: string,
    inputValue: string,
    setInputValue: (value: string) => void,
    inputRef: React.RefObject<HTMLInputElement>
  ) => (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-foreground">{label}</label>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 p-2 min-h-[42px] bg-muted/50 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 cursor-text'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value[type].map((pattern) => (
          <span
            key={pattern}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
          >
            {pattern}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePattern(type, pattern);
              }}
              className="p-0.5 hover:bg-primary/20 rounded"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, type, inputValue, setInputValue)}
          onBlur={() => {
            if (inputValue.trim()) {
              addPattern(type, inputValue);
              setInputValue('');
            }
          }}
          placeholder={value[type].length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Press Enter or comma to add. Use glob patterns like *.py, src/**/*.ts
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="File Pattern Filters"
        description="Specify which files to include or exclude"
      />

      <div className="space-y-4">
        {renderPatternInput(
          'languagePatterns',
          'Include Patterns',
          '*.py, *.ts, *.js',
          languageInput,
          setLanguageInput,
          languageInputRef
        )}

        {renderPatternInput(
          'excludePatterns',
          'Exclude Patterns',
          '*test*, *.md, node_modules/**',
          excludeInput,
          setExcludeInput,
          excludeInputRef
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Processing Options Section
// =============================================================================

interface ProcessingOptionsSectionProps {
  value: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
}

function ProcessingOptionsSection({
  value,
  onChange,
}: ProcessingOptionsSectionProps) {
  const handleToggle = (key: keyof ProcessingOptions) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Processing Options"
        description="Configure processing behavior"
      />

      <div className="space-y-2">
        {(Object.keys(PROCESSING_OPTION_LABELS) as (keyof ProcessingOptions)[]).map((key) => {
          const option = PROCESSING_OPTION_LABELS[key];
          return (
            <label
              key={key}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                value[key]
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              )}
            >
              <input
                type="checkbox"
                checked={value[key]}
                onChange={() => handleToggle(key)}
                className="sr-only"
              />

              {/* Custom Checkbox */}
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                  value[key]
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {value[key] && <Check size={12} className="text-primary-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {option.label}
                  </span>
                  {option.warning && (
                    <Tooltip content={option.warning}>
                      <AlertTriangle size={14} className="text-amber-500 cursor-help" />
                    </Tooltip>
                  )}
                  <Tooltip content={option.description}>
                    <Info size={14} className="text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Step3AdvancedSettings({
  chunkingStrategy,
  webhookUrl,
  onChunkingChange,
  metadataOptions,
  onMetadataChange,
  outputFormat,
  embeddingModel,
  onOutputFormatChange,
  patternFilters,
  onPatternFiltersChange,
  processingOptions,
  onProcessingOptionsChange,
  onSkip,
}: Step3AdvancedSettingsProps) {
  const [isAdvancedCollapsed, setIsAdvancedCollapsed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings2 size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Advanced Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure how your code is processed and stored
          </p>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Skip this step
          </button>
        )}
      </div>

      {/* Chunking Strategy - Always visible */}
      <ChunkingStrategySection
        value={chunkingStrategy}
        webhookUrl={webhookUrl}
        onChange={onChunkingChange}
      />

      {/* Collapsible Advanced Section */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsAdvancedCollapsed(!isAdvancedCollapsed)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Sparkles size={16} />
          {isAdvancedCollapsed ? 'Show more options' : 'Hide advanced options'}
          {isAdvancedCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {!isAdvancedCollapsed && (
          <div className="space-y-6 pl-4 border-l-2 border-border">
            <MetadataExtractionSection
              value={metadataOptions}
              onChange={onMetadataChange}
            />

            <OutputFormatSection
              value={outputFormat}
              embeddingModel={embeddingModel}
              onChange={onOutputFormatChange}
            />

            <PatternFiltersSection
              value={patternFilters}
              onChange={onPatternFiltersChange}
            />

            <ProcessingOptionsSection
              value={processingOptions}
              onChange={onProcessingOptionsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Step3AdvancedSettings;
