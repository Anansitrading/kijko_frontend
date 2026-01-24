/**
 * Project Creation Context
 * Manages multi-step wizard state for project creation flow
 *
 * Features:
 * - Form data persistence between steps
 * - Multi-step navigation state
 * - Step validation tracking
 * - Reset/clear functionality
 * - Draft saving to localStorage
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type {
  ProjectType,
  ProjectPrivacy,
  ChunkingStrategy,
  PersonaType,
  ProjectCreationStep,
  ProjectCreationForm,
  RepositoryInput,
  FileInput,
  MemberInput,
  StepValidation,
  ValidationError,
  MetadataOptions,
  OutputFormat,
  PatternFilters,
  ProcessingOptions,
  NotificationLevel,
  TeamMemberInvitation,
} from '../types/project';
import {
  DEFAULT_METADATA_OPTIONS,
  DEFAULT_PROCESSING_OPTIONS,
  DEFAULT_PATTERN_FILTERS,
} from '../types/project';

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'project_creation_draft';

const WIZARD_STEPS: ProjectCreationStep[] = [
  'type_selection',
  'basic_info',
  'source_config',
  'team_setup',
  'settings',
  'review',
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
// State Types
// =============================================================================

interface ProjectCreationState {
  // Navigation
  currentStep: ProjectCreationStep;
  currentStepIndex: number;
  completedSteps: Set<ProjectCreationStep>;

  // Form data
  formData: ProjectCreationForm;

  // Validation
  stepValidations: Map<ProjectCreationStep, StepValidation>;

  // Status
  isSubmitting: boolean;
  submitError: string | null;
  isDirty: boolean;
  hasDraft: boolean;
}

type ProjectCreationAction =
  | { type: 'SET_STEP'; payload: ProjectCreationStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_PROJECT_TYPE'; payload: { type: ProjectType; persona?: PersonaType } }
  | { type: 'SET_BASIC_INFO'; payload: { name: string; description: string; privacy: ProjectPrivacy } }
  | { type: 'ADD_REPOSITORY'; payload: RepositoryInput }
  | { type: 'REMOVE_REPOSITORY'; payload: number }
  | { type: 'UPDATE_REPOSITORY'; payload: { index: number; data: Partial<RepositoryInput> } }
  | { type: 'SET_FILES'; payload: FileInput[] }
  | { type: 'SET_MANUAL_CONTENT'; payload: string }
  | { type: 'ADD_MEMBER'; payload: MemberInput }
  | { type: 'REMOVE_MEMBER'; payload: number }
  | { type: 'UPDATE_MEMBER'; payload: { index: number; data: Partial<MemberInput> } }
  | { type: 'SET_SETTINGS'; payload: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'includeMetadata' | 'anonymizeSecrets' | 'customSettings'>> }
  | { type: 'SET_ADVANCED_SETTINGS'; payload: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'webhookUrl' | 'metadataOptions' | 'outputFormat' | 'embeddingModel' | 'patternFilters' | 'processingOptions'>> }
  | { type: 'SET_TEAM_SETTINGS'; payload: { members?: MemberInput[]; defaultNotificationLevel?: NotificationLevel } }
  | { type: 'SET_VALIDATION'; payload: { step: ProjectCreationStep; validation: StepValidation } }
  | { type: 'MARK_STEP_COMPLETE'; payload: ProjectCreationStep }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'LOAD_DRAFT'; payload: ProjectCreationForm }
  | { type: 'RESET' };

// =============================================================================
// Initial State
// =============================================================================

function createInitialState(): ProjectCreationState {
  return {
    currentStep: 'type_selection',
    currentStepIndex: 0,
    completedSteps: new Set(),
    formData: { ...DEFAULT_FORM_DATA },
    stepValidations: new Map(),
    isSubmitting: false,
    submitError: null,
    isDirty: false,
    hasDraft: false,
  };
}

// =============================================================================
// Reducer
// =============================================================================

function projectCreationReducer(
  state: ProjectCreationState,
  action: ProjectCreationAction
): ProjectCreationState {
  switch (action.type) {
    case 'SET_STEP': {
      const stepIndex = WIZARD_STEPS.indexOf(action.payload);
      return {
        ...state,
        currentStep: action.payload,
        currentStepIndex: stepIndex >= 0 ? stepIndex : state.currentStepIndex,
      };
    }

    case 'NEXT_STEP': {
      const nextIndex = Math.min(state.currentStepIndex + 1, WIZARD_STEPS.length - 1);
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(state.currentStep);
      return {
        ...state,
        currentStepIndex: nextIndex,
        currentStep: WIZARD_STEPS[nextIndex],
        completedSteps,
      };
    }

    case 'PREV_STEP': {
      const prevIndex = Math.max(state.currentStepIndex - 1, 0);
      return {
        ...state,
        currentStepIndex: prevIndex,
        currentStep: WIZARD_STEPS[prevIndex],
      };
    }

    case 'SET_PROJECT_TYPE': {
      // Reset source-specific fields when type changes
      const resetFields =
        action.payload.type === 'repository'
          ? { files: undefined, manualContent: undefined }
          : action.payload.type === 'files'
          ? { repositories: [], manualContent: undefined }
          : { repositories: [], files: undefined };

      return {
        ...state,
        formData: {
          ...state.formData,
          projectType: action.payload.type,
          persona: action.payload.persona,
          ...resetFields,
        },
        isDirty: true,
      };
    }

    case 'SET_BASIC_INFO':
      return {
        ...state,
        formData: {
          ...state.formData,
          name: action.payload.name,
          description: action.payload.description,
          privacy: action.payload.privacy,
        },
        isDirty: true,
      };

    case 'ADD_REPOSITORY':
      return {
        ...state,
        formData: {
          ...state.formData,
          repositories: [...state.formData.repositories, action.payload],
        },
        isDirty: true,
      };

    case 'REMOVE_REPOSITORY': {
      const newRepos = [...state.formData.repositories];
      newRepos.splice(action.payload, 1);
      return {
        ...state,
        formData: {
          ...state.formData,
          repositories: newRepos,
        },
        isDirty: true,
      };
    }

    case 'UPDATE_REPOSITORY': {
      const newRepos = [...state.formData.repositories];
      newRepos[action.payload.index] = {
        ...newRepos[action.payload.index],
        ...action.payload.data,
      };
      return {
        ...state,
        formData: {
          ...state.formData,
          repositories: newRepos,
        },
        isDirty: true,
      };
    }

    case 'SET_FILES':
      return {
        ...state,
        formData: {
          ...state.formData,
          files: action.payload,
        },
        isDirty: true,
      };

    case 'SET_MANUAL_CONTENT':
      return {
        ...state,
        formData: {
          ...state.formData,
          manualContent: action.payload,
        },
        isDirty: true,
      };

    case 'ADD_MEMBER':
      return {
        ...state,
        formData: {
          ...state.formData,
          members: [...state.formData.members, action.payload],
        },
        isDirty: true,
      };

    case 'REMOVE_MEMBER': {
      const newMembers = [...state.formData.members];
      newMembers.splice(action.payload, 1);
      return {
        ...state,
        formData: {
          ...state.formData,
          members: newMembers,
        },
        isDirty: true,
      };
    }

    case 'UPDATE_MEMBER': {
      const newMembers = [...state.formData.members];
      newMembers[action.payload.index] = {
        ...newMembers[action.payload.index],
        ...action.payload.data,
      };
      return {
        ...state,
        formData: {
          ...state.formData,
          members: newMembers,
        },
        isDirty: true,
      };
    }

    case 'SET_SETTINGS':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
        isDirty: true,
      };

    case 'SET_ADVANCED_SETTINGS':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
        isDirty: true,
      };

    case 'SET_TEAM_SETTINGS':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...(action.payload.members !== undefined && { members: action.payload.members }),
          ...(action.payload.defaultNotificationLevel !== undefined && { defaultNotificationLevel: action.payload.defaultNotificationLevel }),
        },
        isDirty: true,
      };

    case 'SET_VALIDATION': {
      const newValidations = new Map(state.stepValidations);
      newValidations.set(action.payload.step, action.payload.validation);
      return {
        ...state,
        stepValidations: newValidations,
      };
    }

    case 'MARK_STEP_COMPLETE': {
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(action.payload);
      return {
        ...state,
        completedSteps,
      };
    }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
        submitError: action.payload ? null : state.submitError,
      };

    case 'SET_SUBMIT_ERROR':
      return {
        ...state,
        submitError: action.payload,
        isSubmitting: false,
      };

    case 'LOAD_DRAFT':
      return {
        ...state,
        formData: action.payload,
        hasDraft: true,
        isDirty: false,
      };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

// =============================================================================
// Context Value Interface
// =============================================================================

interface ProjectCreationContextValue {
  // State
  state: ProjectCreationState;

  // Navigation
  goToStep: (step: ProjectCreationStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;

  // Form data setters
  setProjectType: (type: ProjectType, persona?: PersonaType) => void;
  setBasicInfo: (name: string, description: string, privacy: ProjectPrivacy) => void;
  addRepository: (repo: RepositoryInput) => void;
  removeRepository: (index: number) => void;
  updateRepository: (index: number, data: Partial<RepositoryInput>) => void;
  setFiles: (files: FileInput[]) => void;
  setManualContent: (content: string) => void;
  addMember: (member: MemberInput) => void;
  removeMember: (index: number) => void;
  updateMember: (index: number, data: Partial<MemberInput>) => void;
  setSettings: (settings: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'includeMetadata' | 'anonymizeSecrets' | 'customSettings'>>) => void;
  setAdvancedSettings: (settings: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'webhookUrl' | 'metadataOptions' | 'outputFormat' | 'embeddingModel' | 'patternFilters' | 'processingOptions'>>) => void;
  setTeamSettings: (settings: { members?: MemberInput[]; defaultNotificationLevel?: NotificationLevel }) => void;

  // Validation
  validateStep: (step: ProjectCreationStep) => StepValidation;
  getStepValidation: (step: ProjectCreationStep) => StepValidation | undefined;
  isStepValid: (step: ProjectCreationStep) => boolean;
  isFormValid: () => boolean;

  // Persistence
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
  hasDraft: () => boolean;

  // Actions
  reset: () => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
}

// =============================================================================
// Context
// =============================================================================

const ProjectCreationContext = createContext<ProjectCreationContextValue | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface ProjectCreationProviderProps {
  children: React.ReactNode;
}

export function ProjectCreationProvider({ children }: ProjectCreationProviderProps) {
  const [state, dispatch] = useReducer(projectCreationReducer, undefined, createInitialState);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        dispatch({ type: 'LOAD_DRAFT', payload: JSON.parse(draft) });
      }
    } catch (error) {
      console.error('Failed to load project creation draft:', error);
    }
  }, []);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (state.isDirty) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.formData));
      } catch (error) {
        console.error('Failed to save project creation draft:', error);
      }
    }
  }, [state.formData, state.isDirty]);

  // Navigation
  const goToStep = useCallback((step: ProjectCreationStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const canGoNext = useCallback(() => {
    return state.currentStepIndex < WIZARD_STEPS.length - 1;
  }, [state.currentStepIndex]);

  const canGoPrev = useCallback(() => {
    return state.currentStepIndex > 0;
  }, [state.currentStepIndex]);

  const isFirstStep = useCallback(() => {
    return state.currentStepIndex === 0;
  }, [state.currentStepIndex]);

  const isLastStep = useCallback(() => {
    return state.currentStepIndex === WIZARD_STEPS.length - 1;
  }, [state.currentStepIndex]);

  // Form setters
  const setProjectType = useCallback((type: ProjectType, persona?: PersonaType) => {
    dispatch({ type: 'SET_PROJECT_TYPE', payload: { type, persona } });
  }, []);

  const setBasicInfo = useCallback((name: string, description: string, privacy: ProjectPrivacy) => {
    dispatch({ type: 'SET_BASIC_INFO', payload: { name, description, privacy } });
  }, []);

  const addRepository = useCallback((repo: RepositoryInput) => {
    dispatch({ type: 'ADD_REPOSITORY', payload: repo });
  }, []);

  const removeRepository = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_REPOSITORY', payload: index });
  }, []);

  const updateRepository = useCallback((index: number, data: Partial<RepositoryInput>) => {
    dispatch({ type: 'UPDATE_REPOSITORY', payload: { index, data } });
  }, []);

  const setFiles = useCallback((files: FileInput[]) => {
    dispatch({ type: 'SET_FILES', payload: files });
  }, []);

  const setManualContent = useCallback((content: string) => {
    dispatch({ type: 'SET_MANUAL_CONTENT', payload: content });
  }, []);

  const addMember = useCallback((member: MemberInput) => {
    dispatch({ type: 'ADD_MEMBER', payload: member });
  }, []);

  const removeMember = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_MEMBER', payload: index });
  }, []);

  const updateMember = useCallback((index: number, data: Partial<MemberInput>) => {
    dispatch({ type: 'UPDATE_MEMBER', payload: { index, data } });
  }, []);

  const setSettings = useCallback(
    (settings: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'includeMetadata' | 'anonymizeSecrets' | 'customSettings'>>) => {
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    },
    []
  );

  const setAdvancedSettings = useCallback(
    (settings: Partial<Pick<ProjectCreationForm, 'chunkingStrategy' | 'webhookUrl' | 'metadataOptions' | 'outputFormat' | 'embeddingModel' | 'patternFilters' | 'processingOptions'>>) => {
      dispatch({ type: 'SET_ADVANCED_SETTINGS', payload: settings });
    },
    []
  );

  const setTeamSettings = useCallback(
    (settings: { members?: MemberInput[]; defaultNotificationLevel?: NotificationLevel }) => {
      dispatch({ type: 'SET_TEAM_SETTINGS', payload: settings });
    },
    []
  );

  // Validation
  const validateStep = useCallback(
    (step: ProjectCreationStep): StepValidation => {
      const errors: ValidationError[] = [];
      const { formData } = state;

      switch (step) {
        case 'type_selection':
          if (!formData.projectType) {
            errors.push({ field: 'projectType', message: 'Please select a project type' });
          }
          break;

        case 'basic_info':
          if (!formData.name.trim()) {
            errors.push({ field: 'name', message: 'Project name is required' });
          } else if (formData.name.length < 3) {
            errors.push({ field: 'name', message: 'Project name must be at least 3 characters' });
          } else if (formData.name.length > 50) {
            errors.push({ field: 'name', message: 'Project name cannot exceed 50 characters' });
          }
          break;

        case 'source_config':
          if (formData.projectType === 'repository' && formData.repositories.length === 0) {
            errors.push({ field: 'repositories', message: 'Please add at least one repository' });
          }
          if (formData.projectType === 'files' && (!formData.files || formData.files.length === 0)) {
            errors.push({ field: 'files', message: 'Please upload at least one file' });
          }
          if (formData.projectType === 'manual' && !formData.manualContent?.trim()) {
            errors.push({ field: 'manualContent', message: 'Please enter some content' });
          }
          break;

        case 'team_setup':
          // Team setup is optional, no validation errors
          break;

        case 'settings':
          // Settings have defaults, no validation errors
          break;

        case 'review':
          // Aggregate validation from all steps
          const allSteps: ProjectCreationStep[] = ['type_selection', 'basic_info', 'source_config'];
          for (const s of allSteps) {
            const stepValidation = validateStep(s);
            errors.push(...stepValidation.errors);
          }
          break;
      }

      const validation: StepValidation = {
        step,
        isValid: errors.length === 0,
        errors,
        touched: true,
      };

      dispatch({ type: 'SET_VALIDATION', payload: { step, validation } });

      return validation;
    },
    [state]
  );

  const getStepValidation = useCallback(
    (step: ProjectCreationStep) => {
      return state.stepValidations.get(step);
    },
    [state.stepValidations]
  );

  const isStepValid = useCallback(
    (step: ProjectCreationStep) => {
      const validation = state.stepValidations.get(step);
      if (!validation) {
        return validateStep(step).isValid;
      }
      return validation.isValid;
    },
    [state.stepValidations, validateStep]
  );

  const isFormValid = useCallback(() => {
    const requiredSteps: ProjectCreationStep[] = ['type_selection', 'basic_info', 'source_config'];
    return requiredSteps.every(step => isStepValid(step));
  }, [isStepValid]);

  // Persistence
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.formData));
    } catch (error) {
      console.error('Failed to save project creation draft:', error);
    }
  }, [state.formData]);

  const loadDraft = useCallback((): boolean => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        dispatch({ type: 'LOAD_DRAFT', payload: JSON.parse(draft) });
        return true;
      }
    } catch (error) {
      console.error('Failed to load project creation draft:', error);
    }
    return false;
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear project creation draft:', error);
    }
  }, []);

  const hasDraftFn = useCallback((): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }, []);

  // Actions
  const reset = useCallback(() => {
    clearDraft();
    dispatch({ type: 'RESET' });
  }, [clearDraft]);

  const setSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: submitting });
  }, []);

  const setSubmitError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: error });
  }, []);

  // Context value
  const value = useMemo<ProjectCreationContextValue>(
    () => ({
      state,
      goToStep,
      nextStep,
      prevStep,
      canGoNext,
      canGoPrev,
      isFirstStep,
      isLastStep,
      setProjectType,
      setBasicInfo,
      addRepository,
      removeRepository,
      updateRepository,
      setFiles,
      setManualContent,
      addMember,
      removeMember,
      updateMember,
      setSettings,
      setAdvancedSettings,
      setTeamSettings,
      validateStep,
      getStepValidation,
      isStepValid,
      isFormValid,
      saveDraft,
      loadDraft,
      clearDraft,
      hasDraft: hasDraftFn,
      reset,
      setSubmitting,
      setSubmitError,
    }),
    [
      state,
      goToStep,
      nextStep,
      prevStep,
      canGoNext,
      canGoPrev,
      isFirstStep,
      isLastStep,
      setProjectType,
      setBasicInfo,
      addRepository,
      removeRepository,
      updateRepository,
      setFiles,
      setManualContent,
      addMember,
      removeMember,
      updateMember,
      setSettings,
      setAdvancedSettings,
      setTeamSettings,
      validateStep,
      getStepValidation,
      isStepValid,
      isFormValid,
      saveDraft,
      loadDraft,
      clearDraft,
      hasDraftFn,
      reset,
      setSubmitting,
      setSubmitError,
    ]
  );

  return (
    <ProjectCreationContext.Provider value={value}>
      {children}
    </ProjectCreationContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useProjectCreation() {
  const context = useContext(ProjectCreationContext);
  if (context === undefined) {
    throw new Error('useProjectCreation must be used within a ProjectCreationProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export { ProjectCreationContext, WIZARD_STEPS };
export type { ProjectCreationState, ProjectCreationContextValue };
