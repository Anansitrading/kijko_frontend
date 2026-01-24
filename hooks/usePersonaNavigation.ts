/**
 * usePersonaNavigation Hook
 * Sprint PC6: Dynamic step navigation based on detected persona
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { PersonaType, PersonaFlow, ProjectCreationStep } from '@/types/project';
import { PERSONA_FLOWS } from '@/types/project';
import {
  detectPersona,
  getDefaultSignals,
  getCachedPersona,
  cachePersona,
  getPersonaOverride,
  setPersonaOverride,
  isShowAllOptionsEnabled,
  setShowAllOptions as persistShowAllOptions,
  getNextStep,
  getPreviousStep,
  isStepVisible,
  getVisibleSteps,
  calculateProgress,
  getPersonaDefaults,
  type PersonaSignals
} from '@/services/personaDetection';

export interface UsePersonaNavigationOptions {
  initialStep?: number | string;
  onStepChange?: (step: number | string) => void;
  onPersonaDetected?: (persona: PersonaType) => void;
}

export interface UsePersonaNavigationReturn {
  // Current state
  currentStep: number | string;
  persona: PersonaType;
  showAllOptions: boolean;
  progress: number;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number | string) => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Step visibility
  isStepVisible: (step: number) => boolean;
  visibleSteps: (number | string)[];
  hiddenSteps: number[];

  // Persona management
  setPersona: (persona: PersonaType) => void;
  toggleShowAllOptions: () => void;
  flow: PersonaFlow;
  defaults: Partial<import('@/types/project').ProjectCreationForm>;

  // Initialization
  initializePersona: (signals?: Partial<PersonaSignals>) => void;
}

export function usePersonaNavigation(
  options: UsePersonaNavigationOptions = {}
): UsePersonaNavigationReturn {
  const { initialStep = 1, onStepChange, onPersonaDetected } = options;

  // State
  const [currentStep, setCurrentStep] = useState<number | string>(initialStep);
  const [persona, setPersonaState] = useState<PersonaType>(() => {
    // Check for override first
    const override = getPersonaOverride();
    if (override) return override;

    // Then check cache
    const cached = getCachedPersona();
    if (cached) return cached.persona;

    // Default to alex
    return 'alex';
  });
  const [showAllOptions, setShowAllOptionsState] = useState<boolean>(isShowAllOptionsEnabled);

  // Derived values
  const flow = useMemo(() => {
    if (showAllOptions) {
      return PERSONA_FLOWS.maya; // Full flow when showing all options
    }
    return PERSONA_FLOWS[persona];
  }, [persona, showAllOptions]);

  const visibleSteps = useMemo(
    () => getVisibleSteps(persona, showAllOptions),
    [persona, showAllOptions]
  );

  const hiddenSteps = useMemo(() => {
    if (showAllOptions) return [];
    return PERSONA_FLOWS[persona].hiddenSteps;
  }, [persona, showAllOptions]);

  const progress = useMemo(
    () => calculateProgress(currentStep, persona, showAllOptions),
    [currentStep, persona, showAllOptions]
  );

  const canGoNext = useMemo(() => {
    const next = getNextStep(currentStep, persona, showAllOptions);
    return next !== null;
  }, [currentStep, persona, showAllOptions]);

  const canGoPrev = useMemo(() => {
    const prev = getPreviousStep(currentStep, persona, showAllOptions);
    return prev !== null;
  }, [currentStep, persona, showAllOptions]);

  const defaults = useMemo(() => getPersonaDefaults(persona), [persona]);

  // Navigation handlers
  const nextStep = useCallback(() => {
    const next = getNextStep(currentStep, persona, showAllOptions);
    if (next !== null) {
      setCurrentStep(next);
      onStepChange?.(next);
    }
  }, [currentStep, persona, showAllOptions, onStepChange]);

  const prevStep = useCallback(() => {
    const prev = getPreviousStep(currentStep, persona, showAllOptions);
    if (prev !== null) {
      setCurrentStep(prev);
      onStepChange?.(prev);
    }
  }, [currentStep, persona, showAllOptions, onStepChange]);

  const goToStep = useCallback(
    (step: number | string) => {
      // Validate step is in flow
      if (visibleSteps.includes(step)) {
        setCurrentStep(step);
        onStepChange?.(step);
      }
    },
    [visibleSteps, onStepChange]
  );

  const checkStepVisibility = useCallback(
    (step: number) => isStepVisible(step, persona, showAllOptions),
    [persona, showAllOptions]
  );

  // Persona management
  const setPersona = useCallback(
    (newPersona: PersonaType) => {
      setPersonaState(newPersona);
      setPersonaOverride(newPersona);
      onPersonaDetected?.(newPersona);
    },
    [onPersonaDetected]
  );

  const toggleShowAllOptions = useCallback(() => {
    const newValue = !showAllOptions;
    setShowAllOptionsState(newValue);
    persistShowAllOptions(newValue);
  }, [showAllOptions]);

  // Initialize persona from signals
  const initializePersona = useCallback(
    (signals?: Partial<PersonaSignals>) => {
      // Check for override first
      const override = getPersonaOverride();
      if (override) {
        setPersonaState(override);
        onPersonaDetected?.(override);
        return;
      }

      // Check cache
      const cached = getCachedPersona();
      if (cached) {
        setPersonaState(cached.persona);
        onPersonaDetected?.(cached.persona);
        return;
      }

      // Detect from signals
      const fullSignals = {
        ...getDefaultSignals(),
        ...signals
      };

      const result = detectPersona(fullSignals);
      cachePersona(result);
      setPersonaState(result.persona);
      onPersonaDetected?.(result.persona);
    },
    [onPersonaDetected]
  );

  // Auto-initialize on mount if no persona set
  useEffect(() => {
    const override = getPersonaOverride();
    const cached = getCachedPersona();

    if (!override && !cached) {
      initializePersona();
    }
  }, [initializePersona]);

  return {
    // Current state
    currentStep,
    persona,
    showAllOptions,
    progress,

    // Navigation
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,

    // Step visibility
    isStepVisible: checkStepVisibility,
    visibleSteps,
    hiddenSteps,

    // Persona management
    setPersona,
    toggleShowAllOptions,
    flow,
    defaults,

    // Initialization
    initializePersona
  };
}

export default usePersonaNavigation;
