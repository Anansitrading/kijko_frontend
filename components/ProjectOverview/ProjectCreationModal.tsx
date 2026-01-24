import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, FolderPlus, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2, GitBranch, FileUp, PenLine } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ProjectType, ProjectPrivacy } from '../../types';
import type {
  ChunkingStrategy,
  OutputFormat,
  MetadataOptions,
  PatternFilters,
  ProcessingOptions,
  NotificationLevel,
  RepositoryInput,
  FileInput,
  TeamMemberInvitation,
  ProjectCreationForm,
  ProjectCreationStep,
} from '../../types/project';
import {
  DEFAULT_METADATA_OPTIONS,
  DEFAULT_PROCESSING_OPTIONS,
  DEFAULT_PATTERN_FILTERS,
} from '../../types/project';
import { Step2 } from '../ProjectCreation/Step2';
import { Step3AdvancedSettings } from './WizardSteps/Step3AdvancedSettings';
import { Step4TeamAccess } from './WizardSteps/Step4TeamAccess';
import { Step5ReviewConfirmation } from './WizardSteps/Step5ReviewConfirmation';

// =============================================================================
// Types
// =============================================================================

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: ProjectCreationForm) => void;
  existingProjectNames?: string[];
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'error';

// =============================================================================
// Constants
// =============================================================================

const TOTAL_STEPS = 5;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 200;
const DEBOUNCE_DELAY = 300;

const PROJECT_TYPE_OPTIONS: {
  id: ProjectType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'repository',
    label: 'Repository (Git)',
    description: 'Import from GitHub, GitLab, or Bitbucket',
    icon: <GitBranch size={20} />,
  },
  {
    id: 'files',
    label: 'Files',
    description: 'Upload local files or folders',
    icon: <FileUp size={20} />,
  },
  {
    id: 'manual',
    label: 'Manual',
    description: 'Add content manually or paste code',
    icon: <PenLine size={20} />,
  },
];

const DEFAULT_FORM_DATA: ProjectCreationForm = {
  projectType: null,
  persona: undefined,
  name: '',
  description: '',
  privacy: 'private',
  repositories: [],
  files: undefined,
  manualContent: undefined,
  members: [],
  defaultNotificationLevel: 'daily',
  chunkingStrategy: 'semantic',
  webhookUrl: undefined,
  metadataOptions: DEFAULT_METADATA_OPTIONS,
  outputFormat: 'json',
  embeddingModel: undefined,
  patternFilters: DEFAULT_PATTERN_FILTERS,
  processingOptions: DEFAULT_PROCESSING_OPTIONS,
  includeMetadata: true,
  anonymizeSecrets: true,
  customSettings: undefined,
};

// =============================================================================
// Validation Functions
// =============================================================================

function generateVariant(name: string): string {
  const match = name.match(/^(.+?)\s*(\d+)$/);
  if (match) {
    const base = match[1];
    const num = parseInt(match[2], 10);
    return `${base} ${num + 1}`;
  }

  const phaseMatch = name.match(/^(.+?)\s*-?\s*Phase\s*(\d+)$/i);
  if (phaseMatch) {
    const base = phaseMatch[1];
    const num = parseInt(phaseMatch[2], 10);
    return `${base} - Phase ${num + 1}`;
  }

  return `${name} - Phase 2`;
}

async function checkDuplicateName(
  name: string,
  existingNames: string[]
): Promise<{ exists: boolean; suggestion?: string }> {
  await new Promise(resolve => setTimeout(resolve, 150));

  const normalizedName = name.toLowerCase().trim();
  const exists = existingNames.some(
    existing => existing.toLowerCase().trim() === normalizedName
  );

  if (exists) {
    return {
      exists: true,
      suggestion: generateVariant(name),
    };
  }

  return { exists: false };
}

function validateProjectName(
  name: string
): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (trimmed.length < NAME_MIN_LENGTH) {
    return { valid: false, error: `Minimum ${NAME_MIN_LENGTH} characters required` };
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, error: `Maximum ${NAME_MAX_LENGTH} characters allowed` };
  }

  return { valid: true };
}

// =============================================================================
// Custom Hooks
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i === currentStep - 1
              ? 'w-6 bg-primary'
              : i < currentStep - 1
                ? 'w-1.5 bg-primary/60'
                : 'w-1.5 bg-muted'
          )}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}

interface ProjectNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  validationState: ValidationState;
  error?: string;
  suggestion?: string;
  onUseSuggestion: (suggestion: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function ProjectNameField({
  value,
  onChange,
  validationState,
  error,
  suggestion,
  onUseSuggestion,
  inputRef,
}: ProjectNameFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="project-name"
        className="block text-sm font-medium text-foreground"
      >
        Project name <span className="text-destructive">*</span>
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="project-name"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Bijv. Product Research Q4"
          maxLength={NAME_MAX_LENGTH}
          className={cn(
            'w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-all pr-10',
            validationState === 'error'
              ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/20'
              : validationState === 'valid'
                ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500/20'
                : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
          )}
          aria-describedby="name-helper name-error"
          aria-invalid={validationState === 'error'}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validationState === 'validating' && (
            <Loader2 size={18} className="text-muted-foreground animate-spin" />
          )}
          {validationState === 'valid' && (
            <Check size={18} className="text-green-500" />
          )}
          {validationState === 'error' && (
            <AlertCircle size={18} className="text-destructive" />
          )}
        </div>
      </div>

      {validationState === 'error' && error ? (
        <div id="name-error" className="flex items-start gap-2">
          <p className="text-sm text-destructive">{error}</p>
          {suggestion && (
            <button
              type="button"
              onClick={() => onUseSuggestion(suggestion)}
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 whitespace-nowrap"
            >
              Use "{suggestion}"
            </button>
          )}
        </div>
      ) : (
        <p id="name-helper" className="text-xs text-muted-foreground">
          (Min {NAME_MIN_LENGTH} char, max {NAME_MAX_LENGTH} - focus op waarde)
        </p>
      )}
    </div>
  );
}

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function DescriptionField({ value, onChange }: DescriptionFieldProps) {
  const charCount = value.length;
  const isNearLimit = charCount > DESCRIPTION_MAX_LENGTH * 0.8;
  const isAtLimit = charCount >= DESCRIPTION_MAX_LENGTH;

  return (
    <div className="space-y-2">
      <label
        htmlFor="project-description"
        className="block text-sm font-medium text-foreground"
      >
        Description{' '}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </label>

      <div className="relative">
        <textarea
          id="project-description"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
          placeholder="Bijv. Analyse API docs & SDK patterns"
          rows={3}
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
          aria-describedby="description-helper"
        />

        <div
          className={cn(
            'absolute bottom-2 right-3 text-xs transition-colors',
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
                ? 'text-amber-500'
                : 'text-muted-foreground'
          )}
        >
          {charCount}/{DESCRIPTION_MAX_LENGTH}
        </div>
      </div>

      <p id="description-helper" className="text-xs text-muted-foreground">
        (Max {DESCRIPTION_MAX_LENGTH} char - voor context)
      </p>
    </div>
  );
}

interface ProjectTypeSelectionProps {
  value: ProjectType | null;
  onChange: (type: ProjectType) => void;
}

function ProjectTypeSelection({ value, onChange }: ProjectTypeSelectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Project type <span className="text-destructive">*</span>
      </label>

      <div className="space-y-2">
        {PROJECT_TYPE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
              value === option.id
                ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/30'
            )}
          >
            <input
              type="radio"
              name="project-type"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />

            <div
              className={cn(
                'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                value === option.id
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40'
              )}
            >
              {value === option.id && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </div>

            <div
              className={cn(
                'p-2 rounded-lg shrink-0 transition-colors',
                value === option.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {option.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium text-sm',
                value === option.id ? 'text-foreground' : 'text-foreground/80'
              )}>
                {option.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Step 1 Component
// =============================================================================

interface Step1BasicInfoProps {
  formData: ProjectCreationForm;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTypeChange: (type: ProjectType) => void;
  validationState: ValidationState;
  validationError?: string;
  suggestion?: string;
  onUseSuggestion: (suggestion: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function Step1BasicInfo({
  formData,
  onNameChange,
  onDescriptionChange,
  onTypeChange,
  validationState,
  validationError,
  suggestion,
  onUseSuggestion,
  inputRef,
}: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <ProjectNameField
        value={formData.name}
        onChange={onNameChange}
        validationState={validationState}
        error={validationError}
        suggestion={suggestion}
        onUseSuggestion={onUseSuggestion}
        inputRef={inputRef}
      />

      <DescriptionField
        value={formData.description}
        onChange={onDescriptionChange}
      />

      <ProjectTypeSelection
        value={formData.projectType}
        onChange={onTypeChange}
      />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ProjectCreationModal({
  isOpen,
  onClose,
  onCreate,
  existingProjectNames = [],
}: ProjectCreationModalProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<ProjectCreationForm>(DEFAULT_FORM_DATA);

  // Validation state (for step 1)
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [suggestion, setSuggestion] = useState<string | undefined>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Debounced name for API calls
  const debouncedName = useDebounce(formData.name, DEBOUNCE_DELAY);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData(DEFAULT_FORM_DATA);
      setValidationState('idle');
      setValidationError(undefined);
      setSuggestion(undefined);
      setHasInteracted(false);
      setIsDirty(false);
      setIsSubmitting(false);
      setSubmitError(null);

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Validate name when debounced value changes
  useEffect(() => {
    async function validate() {
      if (!debouncedName.trim() || !hasInteracted) {
        setValidationState('idle');
        setValidationError(undefined);
        setSuggestion(undefined);
        return;
      }

      const basicResult = validateProjectName(debouncedName);
      if (!basicResult.valid) {
        setValidationState('error');
        setValidationError(basicResult.error);
        setSuggestion(undefined);
        return;
      }

      setValidationState('validating');
      try {
        const duplicateResult = await checkDuplicateName(debouncedName, existingProjectNames);
        if (duplicateResult.exists) {
          setValidationState('error');
          setValidationError(`"${debouncedName}" bestaat al`);
          setSuggestion(duplicateResult.suggestion);
        } else {
          setValidationState('valid');
          setValidationError(undefined);
          setSuggestion(undefined);
        }
      } catch {
        setValidationState('valid');
        setValidationError(undefined);
        setSuggestion(undefined);
      }
    }

    validate();
  }, [debouncedName, existingProjectNames, hasInteracted]);

  // Handle keyboard events
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  // Form update handlers
  const handleNameChange = useCallback((name: string) => {
    setFormData(prev => ({ ...prev, name }));
    setHasInteracted(true);
    setIsDirty(true);
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
    setIsDirty(true);
  }, []);

  const handleTypeChange = useCallback((type: ProjectType) => {
    setFormData(prev => ({
      ...prev,
      projectType: type,
      // Reset source fields when type changes
      repositories: type === 'repository' ? prev.repositories : [],
      files: type === 'files' ? prev.files : undefined,
      manualContent: type === 'manual' ? prev.manualContent : undefined,
    }));
    setIsDirty(true);
  }, []);

  const handleUseSuggestion = useCallback((suggestedName: string) => {
    setFormData(prev => ({ ...prev, name: suggestedName }));
    setHasInteracted(true);
    setIsDirty(true);
  }, []);

  // Repository handlers
  const handleAddRepository = useCallback((repo: RepositoryInput) => {
    setFormData(prev => ({
      ...prev,
      repositories: [...prev.repositories, repo],
    }));
    setIsDirty(true);
  }, []);

  const handleAddRepositories = useCallback((repos: RepositoryInput[]) => {
    setFormData(prev => ({
      ...prev,
      repositories: [...prev.repositories, ...repos],
    }));
    setIsDirty(true);
  }, []);

  const handleRemoveRepository = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      repositories: prev.repositories.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  }, []);

  // File handlers
  const handleSetFiles = useCallback((files: FileInput[]) => {
    setFormData(prev => ({ ...prev, files }));
    setIsDirty(true);
  }, []);

  // Advanced settings handlers
  const handleChunkingChange = useCallback((strategy: ChunkingStrategy, webhookUrl?: string) => {
    setFormData(prev => ({ ...prev, chunkingStrategy: strategy, webhookUrl }));
  }, []);

  const handleMetadataChange = useCallback((options: MetadataOptions) => {
    setFormData(prev => ({ ...prev, metadataOptions: options }));
  }, []);

  const handleOutputFormatChange = useCallback((format: OutputFormat, embeddingModel?: string) => {
    setFormData(prev => ({ ...prev, outputFormat: format, embeddingModel }));
  }, []);

  const handlePatternFiltersChange = useCallback((filters: PatternFilters) => {
    setFormData(prev => ({ ...prev, patternFilters: filters }));
  }, []);

  const handleProcessingOptionsChange = useCallback((options: ProcessingOptions) => {
    setFormData(prev => ({ ...prev, processingOptions: options }));
  }, []);

  // Team handlers
  const handleMembersChange = useCallback((members: TeamMemberInvitation[]) => {
    setFormData(prev => ({ ...prev, members }));
  }, []);

  const handleDefaultNotificationChange = useCallback((level: NotificationLevel) => {
    setFormData(prev => ({ ...prev, defaultNotificationLevel: level }));
  }, []);

  // Navigation handlers
  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt sluiten?'
      );
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleEditStep = useCallback((step: ProjectCreationStep) => {
    const stepMap: Record<ProjectCreationStep, number> = {
      'type_selection': 1,
      'basic_info': 1,
      'source_config': 2,
      'team_setup': 4,
      'settings': 3,
      'review': 5,
    };
    setCurrentStep(stepMap[step] || 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      onCreate(formData);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onCreate, onClose]);

  // Validation for each step
  const isStep1Valid = useMemo(() => {
    return (
      formData.name.trim().length >= NAME_MIN_LENGTH &&
      formData.name.trim().length <= NAME_MAX_LENGTH &&
      validationState !== 'validating' &&
      validationState !== 'error' &&
      formData.projectType !== null
    );
  }, [formData.name, formData.projectType, validationState]);

  const isStep2Valid = useMemo(() => {
    if (formData.projectType === 'repository') {
      return formData.repositories.length > 0;
    }
    if (formData.projectType === 'files') {
      return (formData.files?.length || 0) > 0;
    }
    if (formData.projectType === 'manual') {
      return (formData.manualContent?.trim().length || 0) > 0;
    }
    return false;
  }, [formData.projectType, formData.repositories, formData.files, formData.manualContent]);

  // Step 3 and 4 are optional
  const isStep3Valid = true;
  const isStep4Valid = true;

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return true;
      default: return false;
    }
  }, [currentStep, isStep1Valid, isStep2Valid]);

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Nieuw project';
      case 2: return 'Bronnen toevoegen';
      case 3: return 'Geavanceerde instellingen';
      case 4: return 'Team toegang';
      case 5: return 'Bevestigen';
      default: return 'Nieuw project';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-card border border-border rounded-xl shadow-2xl mx-4 overflow-hidden flex flex-col',
          currentStep === 1 ? 'w-full max-w-lg max-h-[90vh]' : 'w-full max-w-2xl max-h-[90vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderPlus size={20} className="text-primary" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                {getStepTitle()}
              </h2>
              <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
              onTypeChange={handleTypeChange}
              validationState={validationState}
              validationError={validationError}
              suggestion={suggestion}
              onUseSuggestion={handleUseSuggestion}
              inputRef={inputRef}
            />
          )}

          {currentStep === 2 && formData.projectType && (
            <Step2
              projectType={formData.projectType}
              persona={formData.persona}
              repositories={formData.repositories}
              onAddRepository={handleAddRepository}
              onAddRepositories={handleAddRepositories}
              onRemoveRepository={handleRemoveRepository}
              files={formData.files || []}
              onSetFiles={handleSetFiles}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3AdvancedSettings
              chunkingStrategy={formData.chunkingStrategy}
              webhookUrl={formData.webhookUrl}
              onChunkingChange={handleChunkingChange}
              metadataOptions={formData.metadataOptions}
              onMetadataChange={handleMetadataChange}
              outputFormat={formData.outputFormat}
              embeddingModel={formData.embeddingModel}
              onOutputFormatChange={handleOutputFormatChange}
              patternFilters={formData.patternFilters}
              onPatternFiltersChange={handlePatternFiltersChange}
              processingOptions={formData.processingOptions}
              onProcessingOptionsChange={handleProcessingOptionsChange}
              onSkip={handleNext}
            />
          )}

          {currentStep === 4 && (
            <Step4TeamAccess
              members={formData.members}
              onMembersChange={handleMembersChange}
              defaultNotificationLevel={formData.defaultNotificationLevel}
              onDefaultNotificationChange={handleDefaultNotificationChange}
              onSkip={handleNext}
            />
          )}

          {currentStep === 5 && (
            <Step5ReviewConfirmation
              formData={formData}
              onEditStep={handleEditStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>

        {/* Footer - Only show for steps that don't have their own footer */}
        {currentStep !== 2 && currentStep !== 5 && (
          <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft size={16} />
                Terug
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Annuleren
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg shadow-lg transition-all',
                canProceed
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:shadow-primary/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
              )}
            >
              {validationState === 'validating' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Volgende</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
