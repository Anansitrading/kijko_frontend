import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  RefreshCw,
  Download,
  Check,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface NextStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  completed: boolean;
  recommended?: boolean;
}

interface NextStepsChecklistProps {
  projectId: string;
  steps?: NextStep[];
  onQueryCode?: () => void;
  onExploreDashboard?: () => void;
  onInviteTeammates?: () => void;
  onSetupAutoRefresh?: () => void;
  onExportForAPI?: () => void;
  onSkipOnboarding?: () => void;
  showSkipButton?: boolean;
  className?: string;
}

// =============================================================================
// LocalStorage Helpers
// =============================================================================

const STORAGE_KEY_PREFIX = 'kijko_next_steps_';

function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function loadCompletedSteps(projectId: string): Set<string> {
  try {
    const stored = localStorage.getItem(getStorageKey(projectId));
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.warn('Failed to load completed steps from localStorage:', e);
  }
  return new Set();
}

function saveCompletedSteps(projectId: string, completedIds: Set<string>): void {
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify([...completedIds]));
  } catch (e) {
    console.warn('Failed to save completed steps to localStorage:', e);
  }
}

// =============================================================================
// Default Steps Configuration
// =============================================================================

function createDefaultSteps(handlers: {
  onQueryCode?: () => void;
  onExploreDashboard?: () => void;
  onInviteTeammates?: () => void;
  onSetupAutoRefresh?: () => void;
  onExportForAPI?: () => void;
}): Omit<NextStep, 'completed'>[] {
  return [
    {
      id: 'query-code',
      label: 'Query your code',
      description: 'Ask questions about your codebase using natural language',
      icon: <MessageSquare className="w-4 h-4" />,
      action: handlers.onQueryCode || (() => {}),
      recommended: true,
    },
    {
      id: 'explore-dashboard',
      label: 'Explore the dashboard',
      description: 'View metrics, browse chunks, and understand your codebase',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: handlers.onExploreDashboard || (() => {}),
    },
    {
      id: 'invite-teammates',
      label: 'Invite teammates',
      description: 'Share access with your team for collaborative development',
      icon: <Users className="w-4 h-4" />,
      action: handlers.onInviteTeammates || (() => {}),
    },
    {
      id: 'setup-auto-refresh',
      label: 'Set up auto-refresh',
      description: 'Keep your context up-to-date with automatic syncing',
      icon: <RefreshCw className="w-4 h-4" />,
      action: handlers.onSetupAutoRefresh || (() => {}),
    },
    {
      id: 'export-api',
      label: 'Export for API',
      description: 'Get API access to use your optimized context programmatically',
      icon: <Download className="w-4 h-4" />,
      action: handlers.onExportForAPI || (() => {}),
    },
  ];
}

// =============================================================================
// Step Item Component
// =============================================================================

interface StepItemProps {
  step: NextStep;
  onToggle: (id: string) => void;
  onAction: (id: string) => void;
}

function StepItem({ step, onToggle, onAction }: StepItemProps) {
  const handleClick = () => {
    if (!step.completed) {
      step.action();
      onAction(step.id);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(step.id);
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        step.completed
          ? 'border-slate-700 bg-slate-800/30'
          : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        className={cn(
          'shrink-0 mt-0.5 w-5 h-5 rounded-md border transition-all',
          step.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600 hover:border-blue-500 group-hover:border-blue-500'
        )}
        aria-label={step.completed ? `Mark "${step.label}" as incomplete` : `Mark "${step.label}" as complete`}
      >
        {step.completed && (
          <Check className="w-4 h-4 text-white mx-auto" />
        )}
      </button>

      {/* Icon */}
      <div
        className={cn(
          'shrink-0 p-2 rounded-md transition-colors',
          step.completed
            ? 'bg-slate-700 text-slate-400'
            : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20'
        )}
      >
        {step.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium transition-colors',
              step.completed
                ? 'text-slate-500 line-through'
                : 'text-slate-200 group-hover:text-white'
            )}
          >
            {step.label}
          </span>
          {step.recommended && !step.completed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs">
              <Sparkles className="w-3 h-3" />
              Recommended
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-xs mt-0.5 transition-colors',
            step.completed ? 'text-slate-600' : 'text-slate-400'
          )}
        >
          {step.description}
        </p>
      </div>

      {/* Arrow */}
      {!step.completed && (
        <ChevronRight
          className="shrink-0 w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors"
        />
      )}
    </div>
  );
}

// =============================================================================
// Progress Indicator
// =============================================================================

interface ProgressIndicatorProps {
  completed: number;
  total: number;
}

function ProgressIndicator({ completed, total }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 tabular-nums shrink-0">
        {completed}/{total} completed
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function NextStepsChecklist({
  projectId,
  steps: customSteps,
  onQueryCode,
  onExploreDashboard,
  onInviteTeammates,
  onSetupAutoRefresh,
  onExportForAPI,
  onSkipOnboarding,
  showSkipButton = true,
  className,
}: NextStepsChecklistProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() =>
    loadCompletedSteps(projectId)
  );

  // Build steps with completion state
  const defaultSteps = createDefaultSteps({
    onQueryCode,
    onExploreDashboard,
    onInviteTeammates,
    onSetupAutoRefresh,
    onExportForAPI,
  });

  const steps: NextStep[] = (customSteps || defaultSteps).map(step => ({
    ...step,
    completed: completedIds.has(step.id),
  }));

  // Persist to localStorage when completed steps change
  useEffect(() => {
    saveCompletedSteps(projectId, completedIds);
  }, [projectId, completedIds]);

  const handleToggle = useCallback((id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback((id: string) => {
    // Mark as completed when action is triggered
    setCompletedIds(prev => new Set([...prev, id]));
  }, []);

  const completedCount = steps.filter(s => s.completed).length;
  const allCompleted = completedCount === steps.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            What you can do now
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {allCompleted
              ? 'All steps completed! You\'re all set.'
              : 'Complete these steps to get the most out of your project'}
          </p>
        </div>
        {showSkipButton && !allCompleted && onSkipOnboarding && (
          <button
            onClick={onSkipOnboarding}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3 h-3" />
            Skip onboarding
          </button>
        )}
      </div>

      {/* Progress */}
      <ProgressIndicator completed={completedCount} total={steps.length} />

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map(step => (
          <StepItem
            key={step.id}
            step={step}
            onToggle={handleToggle}
            onAction={handleAction}
          />
        ))}
      </div>

      {/* Completion Message */}
      {allCompleted && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-emerald-400">
            Great job! You've completed all the getting started steps.
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Version (for sidebar)
// =============================================================================

interface CompactNextStepsProps {
  projectId: string;
  onViewAll: () => void;
  className?: string;
}

export function CompactNextSteps({ projectId, onViewAll, className }: CompactNextStepsProps) {
  const completedIds = loadCompletedSteps(projectId);
  const totalSteps = 5; // Default steps count
  const completedCount = Math.min(completedIds.size, totalSteps);

  return (
    <button
      onClick={onViewAll}
      className={cn(
        'flex items-center justify-between w-full p-3 rounded-lg',
        'bg-slate-800/50 border border-slate-700',
        'hover:border-blue-500/50 hover:bg-slate-800 transition-all',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-blue-500/10">
          <Check className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-left">
          <span className="text-sm text-slate-200">Getting Started</span>
          <span className="text-xs text-slate-500 block">
            {completedCount}/{totalSteps} steps complete
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500" />
    </button>
  );
}

// =============================================================================
// Mock Data for Development
// =============================================================================

export function createMockNextSteps(): NextStep[] {
  return [
    {
      id: 'query-code',
      label: 'Query your code',
      description: 'Ask questions about your codebase using natural language',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => console.log('Query code'),
      completed: true,
      recommended: true,
    },
    {
      id: 'explore-dashboard',
      label: 'Explore the dashboard',
      description: 'View metrics, browse chunks, and understand your codebase',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => console.log('Explore dashboard'),
      completed: false,
    },
    {
      id: 'invite-teammates',
      label: 'Invite teammates',
      description: 'Share access with your team for collaborative development',
      icon: <Users className="w-4 h-4" />,
      action: () => console.log('Invite teammates'),
      completed: false,
    },
  ];
}
