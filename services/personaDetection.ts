/**
 * Persona Detection Service
 * Sprint PC6: Implements intelligent persona detection with scoring algorithm
 */

import type {
  PersonaType,
  PersonaSignals,
  PersonaScore,
  PersonaDetectionResult,
  PersonaFlow,
  ProjectCreationStep
} from '@/types/project';
import { PERSONA_FLOWS } from '@/types/project';

// Re-export types for consumers
export type { PersonaSignals };

// Session storage key for caching persona
const PERSONA_CACHE_KEY = 'kijko_detected_persona';
const PERSONA_OVERRIDE_KEY = 'kijko_persona_override';

/**
 * Score weights for each persona signal
 */
const ALEX_WEIGHTS = {
  teamSize1: 30,
  usesLightweightTools: 20,
  focusOnCost: 25
};

const MAYA_WEIGHTS = {
  teamSizeOver50: 40,
  downloadsSecurityDocs: 30,
  asksAboutCompliance: 25
};

const SAM_WEIGHTS = {
  usesAPIFrequently: 35,
  readsDocumentation: 20,
  participatesInCommunity: 25
};

/**
 * Calculate Alex persona score
 */
function calculateAlexScore(signals: PersonaSignals): number {
  let score = 0;

  if (signals.teamSize === 1) {
    score += ALEX_WEIGHTS.teamSize1;
  } else if (signals.teamSize <= 5) {
    score += ALEX_WEIGHTS.teamSize1 * 0.5;
  }

  if (signals.usesLightweightTools) {
    score += ALEX_WEIGHTS.usesLightweightTools;
  }

  if (signals.focusOnCost) {
    score += ALEX_WEIGHTS.focusOnCost;
  }

  return score;
}

/**
 * Calculate Maya persona score
 */
function calculateMayaScore(signals: PersonaSignals): number {
  let score = 0;

  if (signals.teamSize > 50) {
    score += MAYA_WEIGHTS.teamSizeOver50;
  } else if (signals.teamSize > 10) {
    score += MAYA_WEIGHTS.teamSizeOver50 * 0.6;
  } else if (signals.teamSize > 5) {
    score += MAYA_WEIGHTS.teamSizeOver50 * 0.3;
  }

  if (signals.downloadsSecurityDocs) {
    score += MAYA_WEIGHTS.downloadsSecurityDocs;
  }

  if (signals.asksAboutCompliance) {
    score += MAYA_WEIGHTS.asksAboutCompliance;
  }

  return score;
}

/**
 * Calculate Sam persona score
 */
function calculateSamScore(signals: PersonaSignals): number {
  let score = 0;

  if (signals.usesAPIFrequently) {
    score += SAM_WEIGHTS.usesAPIFrequently;
  }

  if (signals.readsDocumentation) {
    score += SAM_WEIGHTS.readsDocumentation;
  }

  if (signals.participatesInCommunity) {
    score += SAM_WEIGHTS.participatesInCommunity;
  }

  return score;
}

/**
 * Get the highest scoring persona
 */
function getHighestScoring(scores: PersonaScore[]): PersonaType {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  // If top scores are very close (within 10 points), prefer alex as default
  if (sorted.length >= 2 && sorted[0].score - sorted[1].score <= 10) {
    // Check if alex is one of the top 2
    const topTwo = sorted.slice(0, 2).map(s => s.type);
    if (topTwo.includes('alex')) {
      return 'alex';
    }
  }

  return sorted[0]?.type || 'alex';
}

/**
 * Calculate confidence level based on score distribution
 */
function calculateConfidence(scores: PersonaScore[]): 'high' | 'medium' | 'low' {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  if (sorted.length < 2) return 'low';

  const gap = sorted[0].score - sorted[1].score;
  const topScore = sorted[0].score;

  if (topScore === 0) return 'low';
  if (gap >= 30 && topScore >= 50) return 'high';
  if (gap >= 15 && topScore >= 30) return 'medium';

  return 'low';
}

/**
 * Detect persona based on user signals
 */
export function detectPersona(signals: PersonaSignals): PersonaDetectionResult {
  const scores: PersonaScore[] = [
    { type: 'alex', score: calculateAlexScore(signals) },
    { type: 'maya', score: calculateMayaScore(signals) },
    { type: 'sam', score: calculateSamScore(signals) }
  ];

  const persona = getHighestScoring(scores);
  const confidence = calculateConfidence(scores);

  return {
    persona,
    scores,
    confidence,
    signals
  };
}

/**
 * Get default signals (solo developer, cost-conscious)
 */
export function getDefaultSignals(): PersonaSignals {
  return {
    teamSize: 1,
    usesLightweightTools: true,
    focusOnCost: true,
    downloadsSecurityDocs: false,
    asksAboutCompliance: false,
    usesAPIFrequently: false,
    readsDocumentation: false,
    participatesInCommunity: false
  };
}

/**
 * Cache detected persona in session storage
 */
export function cachePersona(result: PersonaDetectionResult): void {
  try {
    sessionStorage.setItem(PERSONA_CACHE_KEY, JSON.stringify(result));
  } catch (error) {
    console.warn('Failed to cache persona:', error);
  }
}

/**
 * Get cached persona from session storage
 */
export function getCachedPersona(): PersonaDetectionResult | null {
  try {
    const cached = sessionStorage.getItem(PERSONA_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to get cached persona:', error);
  }
  return null;
}

/**
 * Clear cached persona
 */
export function clearCachedPersona(): void {
  try {
    sessionStorage.removeItem(PERSONA_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear cached persona:', error);
  }
}

/**
 * Set persona override (user manually selected)
 */
export function setPersonaOverride(persona: PersonaType | null): void {
  try {
    if (persona) {
      localStorage.setItem(PERSONA_OVERRIDE_KEY, persona);
    } else {
      localStorage.removeItem(PERSONA_OVERRIDE_KEY);
    }
  } catch (error) {
    console.warn('Failed to set persona override:', error);
  }
}

/**
 * Get persona override
 */
export function getPersonaOverride(): PersonaType | null {
  try {
    const override = localStorage.getItem(PERSONA_OVERRIDE_KEY);
    if (override && ['alex', 'maya', 'sam'].includes(override)) {
      return override as PersonaType;
    }
  } catch (error) {
    console.warn('Failed to get persona override:', error);
  }
  return null;
}

/**
 * Check if "show all options" is enabled
 */
export function isShowAllOptionsEnabled(): boolean {
  try {
    return localStorage.getItem('kijko_show_all_options') === 'true';
  } catch {
    return false;
  }
}

/**
 * Set "show all options" preference
 */
export function setShowAllOptions(enabled: boolean): void {
  try {
    localStorage.setItem('kijko_show_all_options', String(enabled));
  } catch (error) {
    console.warn('Failed to set show all options:', error);
  }
}

/**
 * Get flow configuration for a persona
 */
export function getPersonaFlow(persona: PersonaType): PersonaFlow {
  return PERSONA_FLOWS[persona];
}

/**
 * Get next step based on current step and persona flow
 */
export function getNextStep(
  currentStep: number | string,
  persona: PersonaType,
  showAllOptions: boolean = false
): number | string | null {
  const flow = showAllOptions ? PERSONA_FLOWS.maya : getPersonaFlow(persona);
  const steps = flow.steps;

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= steps.length - 1) {
    return null;
  }

  return steps[currentIndex + 1];
}

/**
 * Get previous step based on current step and persona flow
 */
export function getPreviousStep(
  currentStep: number | string,
  persona: PersonaType,
  showAllOptions: boolean = false
): number | string | null {
  const flow = showAllOptions ? PERSONA_FLOWS.maya : getPersonaFlow(persona);
  const steps = flow.steps;

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }

  return steps[currentIndex - 1];
}

/**
 * Check if a step is visible for the persona
 */
export function isStepVisible(
  step: number,
  persona: PersonaType,
  showAllOptions: boolean = false
): boolean {
  if (showAllOptions) return true;

  const flow = getPersonaFlow(persona);
  return !flow.hiddenSteps.includes(step);
}

/**
 * Get visible steps for a persona
 */
export function getVisibleSteps(
  persona: PersonaType,
  showAllOptions: boolean = false
): (number | string)[] {
  if (showAllOptions) {
    return PERSONA_FLOWS.maya.steps;
  }
  return getPersonaFlow(persona).steps;
}

/**
 * Calculate progress percentage based on visible steps
 */
export function calculateProgress(
  currentStep: number | string,
  persona: PersonaType,
  showAllOptions: boolean = false
): number {
  const steps = getVisibleSteps(persona, showAllOptions);
  const currentIndex = steps.indexOf(currentStep);

  if (currentIndex === -1) return 0;

  return Math.round(((currentIndex + 1) / steps.length) * 100);
}

/**
 * Map wizard step name to step number/variant
 */
export function mapStepNameToNumber(step: ProjectCreationStep): number | string {
  const mapping: Record<ProjectCreationStep, number | string> = {
    'type_selection': 1,
    'basic_info': 1,
    'source_config': '2a',
    'team_setup': 3,
    'settings': 4,
    'review': 5
  };
  return mapping[step] || 1;
}

/**
 * Get default form values for a persona
 */
export function getPersonaDefaults(persona: PersonaType): Partial<import('@/types/project').ProjectCreationForm> {
  return getPersonaFlow(persona).defaults;
}
