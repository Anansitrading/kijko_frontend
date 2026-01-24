/**
 * Step 2: Source Configuration
 *
 * Main container component that routes to the appropriate variant:
 * - Step 2A: Single Repository Input (Alex/Sam path)
 * - Step 2B: Batch Repository Import (Maya/Enterprise path)
 * - Step 2C: File Upload
 *
 * The variant shown depends on:
 * - Project type selected in Step 1 (repository, files, manual)
 * - User persona (alex, maya, sam)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { GitBranch, FileUp, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Step2A } from './Step2A';
import { Step2B } from './Step2B';
import { Step2C } from './Step2C';
import { getOAuthConnections } from '../../../services/projectApi';
import type {
  ProjectType,
  PersonaType,
  RepositoryInput,
  FileInput,
  OAuthConnection,
} from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

type Step2Variant = '2A' | '2B' | '2C';

interface Step2Props {
  // From wizard context
  projectType: ProjectType;
  persona?: PersonaType;

  // Repository data
  repositories: RepositoryInput[];
  onAddRepository: (repo: RepositoryInput) => void;
  onAddRepositories: (repos: RepositoryInput[]) => void;
  onRemoveRepository: (index: number) => void;

  // File data
  files: FileInput[];
  onSetFiles: (files: FileInput[]) => void;

  // Navigation
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;

  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function determineVariant(projectType: ProjectType, persona?: PersonaType): Step2Variant {
  // Files type always shows file upload
  if (projectType === 'files') {
    return '2C';
  }

  // Maya persona gets batch import
  if (persona === 'maya') {
    return '2B';
  }

  // Alex and Sam get single repo input
  return '2A';
}

function getVariantInfo(variant: Step2Variant): {
  title: string;
  description: string;
  icon: React.ReactNode;
} {
  switch (variant) {
    case '2A':
      return {
        title: 'Add Repository',
        description: 'Enter the URL of the repository you want to analyze',
        icon: <GitBranch className="w-5 h-5" />,
      };
    case '2B':
      return {
        title: 'Import Repositories',
        description: 'Connect your code platform or import via CSV',
        icon: <Users className="w-5 h-5" />,
      };
    case '2C':
      return {
        title: 'Upload Files',
        description: 'Upload files or folders to analyze',
        icon: <FileUp className="w-5 h-5" />,
      };
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

interface VariantTabsProps {
  currentVariant: Step2Variant;
  onVariantChange: (variant: Step2Variant) => void;
  projectType: ProjectType;
}

function VariantTabs({ currentVariant, onVariantChange, projectType }: VariantTabsProps) {
  // Don't show tabs if project type is files (only 2C is valid)
  if (projectType === 'files') {
    return null;
  }

  // For repository type, allow switching between 2A and 2B
  const tabs: { variant: Step2Variant; label: string; icon: React.ReactNode }[] = [
    { variant: '2A', label: 'Single Repo', icon: <GitBranch className="w-4 h-4" /> },
    { variant: '2B', label: 'Batch Import', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.variant}
          type="button"
          onClick={() => onVariantChange(tab.variant)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all',
            currentVariant === tab.variant
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface StepHeaderProps {
  variant: Step2Variant;
}

function StepHeader({ variant }: StepHeaderProps) {
  const info = getVariantInfo(variant);

  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="p-3 bg-primary/10 rounded-xl text-primary">
        {info.icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{info.title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{info.description}</p>
      </div>
    </div>
  );
}

interface StepFooterProps {
  onNext: () => void;
  onBack: () => void;
  isNextDisabled: boolean;
  nextLabel?: string;
}

function StepFooter({ onNext, onBack, isNextDisabled, nextLabel = 'Continue' }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className={cn(
          'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all',
          isNextDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
        )}
      >
        {nextLabel}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Step2({
  projectType,
  persona,
  repositories,
  onAddRepository,
  onAddRepositories,
  onRemoveRepository,
  files,
  onSetFiles,
  onNext,
  onBack,
  isNextDisabled: externalIsNextDisabled,
  className,
}: Step2Props) {
  // Determine initial variant based on project type and persona
  const initialVariant = determineVariant(projectType, persona);
  const [currentVariant, setCurrentVariant] = useState<Step2Variant>(initialVariant);
  const [oauthConnections, setOauthConnections] = useState<OAuthConnection[]>([]);

  // Load OAuth connections on mount
  useEffect(() => {
    async function loadConnections() {
      try {
        const connections = await getOAuthConnections();
        setOauthConnections(connections);
      } catch (error) {
        console.error('Failed to load OAuth connections:', error);
      }
    }
    loadConnections();
  }, []);

  // Handle variant change
  const handleVariantChange = useCallback((variant: Step2Variant) => {
    setCurrentVariant(variant);
  }, []);

  // Handle OAuth connection change
  const handleOAuthConnectionChange = useCallback((connections: OAuthConnection[]) => {
    setOauthConnections(connections);
  }, []);

  // Determine if next is disabled
  const isNextDisabled = useMemo(() => {
    if (externalIsNextDisabled !== undefined) {
      return externalIsNextDisabled;
    }

    // For repository types, need at least one repo
    if (projectType === 'repository') {
      return repositories.length === 0;
    }

    // For files type, need at least one file
    if (projectType === 'files') {
      return files.length === 0;
    }

    return false;
  }, [externalIsNextDisabled, projectType, repositories.length, files.length]);

  // Render the appropriate variant
  const renderVariant = () => {
    switch (currentVariant) {
      case '2A':
        return (
          <Step2A
            repositories={repositories}
            onAddRepository={onAddRepository}
            onRemoveRepository={onRemoveRepository}
            oauthConnections={oauthConnections}
            onOAuthConnectionChange={handleOAuthConnectionChange}
          />
        );
      case '2B':
        return (
          <Step2B
            repositories={repositories}
            onAddRepositories={onAddRepositories}
            onRemoveRepository={onRemoveRepository}
            oauthConnections={oauthConnections}
            onOAuthConnectionChange={handleOAuthConnectionChange}
          />
        );
      case '2C':
        return (
          <Step2C
            files={files}
            onSetFiles={onSetFiles}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <StepHeader variant={currentVariant} />

      {/* Variant Tabs */}
      <VariantTabs
        currentVariant={currentVariant}
        onVariantChange={handleVariantChange}
        projectType={projectType}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderVariant()}
      </div>

      {/* Footer */}
      <StepFooter
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        nextLabel={persona === 'alex' ? 'Review & Finish' : 'Continue'}
      />
    </div>
  );
}

// Re-export sub-components for individual use
export { Step2A } from './Step2A';
export { Step2B } from './Step2B';
export { Step2C } from './Step2C';
export { RepoInfoCard, RepoInfoCardSkeleton } from './RepoInfoCard';
export { OAuthButtons, CompactOAuthButton } from './OAuthButtons';

// Helper hook for using with ProjectCreationContext
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return React.useMemo(factory, deps);
}
