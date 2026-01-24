/**
 * Completion Screen Component
 * Sprint PC6: Unified completion screen that routes to persona-specific CTAs
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { AlexCompletionCTA } from './AlexCompletionCTA';
import { MayaCompletionCTA } from './MayaCompletionCTA';
import { SamCompletionCTA } from './SamCompletionCTA';
import type {
  PersonaType,
  CompletionData,
  AlexQuickWin,
  MayaNextStep,
  SamAdvancedOption
} from '@/types/project';

interface CompletionScreenProps {
  data: CompletionData;
  // Alex-specific handlers
  onCopyToCursor?: () => void;
  onView?: () => void;
  onShare?: () => void;
  onAlexQuickWin?: (win: AlexQuickWin) => void;
  // Maya-specific handlers
  onInviteMore?: () => void;
  onViewResults?: () => void;
  onViewReport?: () => void;
  onMayaNextStep?: (step: MayaNextStep) => void;
  // Sam-specific handlers
  onApiDocs?: () => void;
  onQueryNow?: () => void;
  onGetApiKey?: () => void;
  onSamAdvancedOption?: (option: SamAdvancedOption) => void;
  // Common
  className?: string;
}

export function CompletionScreen({
  data,
  onCopyToCursor = () => {},
  onView = () => {},
  onShare = () => {},
  onAlexQuickWin,
  onInviteMore = () => {},
  onViewResults = () => {},
  onViewReport = () => {},
  onMayaNextStep,
  onApiDocs = () => {},
  onQueryNow = () => {},
  onGetApiKey = () => {},
  onSamAdvancedOption,
  className
}: CompletionScreenProps) {
  const { persona, projectId, projectName } = data;

  switch (persona) {
    case 'alex':
      if (!data.alexMetrics) {
        console.warn('Alex metrics not provided for Alex persona completion');
        return null;
      }
      return (
        <AlexCompletionCTA
          projectId={projectId}
          projectName={projectName}
          metrics={data.alexMetrics}
          onCopyToCursor={onCopyToCursor}
          onView={onView}
          onShare={onShare}
          onQuickWinClick={onAlexQuickWin}
          className={className}
        />
      );

    case 'maya':
      if (!data.mayaMetrics) {
        console.warn('Maya metrics not provided for Maya persona completion');
        return null;
      }
      return (
        <MayaCompletionCTA
          projectId={projectId}
          projectName={projectName}
          metrics={data.mayaMetrics}
          onInviteMore={onInviteMore}
          onViewResults={onViewResults}
          onViewReport={onViewReport}
          onNextStepClick={onMayaNextStep}
          className={className}
        />
      );

    case 'sam':
      if (!data.samMetrics) {
        console.warn('Sam metrics not provided for Sam persona completion');
        return null;
      }
      return (
        <SamCompletionCTA
          projectId={projectId}
          projectName={projectName}
          metrics={data.samMetrics}
          onApiDocs={onApiDocs}
          onQueryNow={onQueryNow}
          onGetApiKey={onGetApiKey}
          onAdvancedOptionClick={onSamAdvancedOption}
          className={className}
        />
      );

    default:
      // Fallback to Alex if unknown persona
      if (data.alexMetrics) {
        return (
          <AlexCompletionCTA
            projectId={projectId}
            projectName={projectName}
            metrics={data.alexMetrics}
            onCopyToCursor={onCopyToCursor}
            onView={onView}
            onShare={onShare}
            onQuickWinClick={onAlexQuickWin}
            className={className}
          />
        );
      }
      return (
        <div className={cn('p-6 rounded-lg border border-border', className)}>
          <p className="text-muted-foreground">
            Completion data not available.
          </p>
        </div>
      );
  }
}
