import { Check, AlertTriangle, Download, Search, Scissors, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PhaseInfo, PhaseStatus } from '../../types/ingestionProgress';

// =============================================================================
// Types
// =============================================================================

interface PhaseIndicatorProps {
  phases: PhaseInfo[];
  currentPhaseIndex: number;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

// =============================================================================
// Icon Mapping
// =============================================================================

const phaseIcons = {
  repository_fetch: Download,
  parsing: Search,
  chunking: Scissors,
  optimization: Zap,
  indexing: Download, // fallback
};

// =============================================================================
// Status Styling
// =============================================================================

function getStatusStyles(status: PhaseStatus) {
  switch (status) {
    case 'completed':
      return {
        circle: 'bg-emerald-600 border-emerald-500 text-white',
        label: 'text-emerald-400',
        line: 'bg-emerald-500',
      };
    case 'active':
      return {
        circle: 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40',
        label: 'text-blue-400',
        line: 'bg-slate-600',
      };
    case 'error':
      return {
        circle: 'bg-red-600 border-red-500 text-white',
        label: 'text-red-400',
        line: 'bg-red-500/30',
      };
    default:
      return {
        circle: 'bg-slate-800 border-slate-600 text-slate-400',
        label: 'text-slate-500',
        line: 'bg-slate-700',
      };
  }
}

// =============================================================================
// Phase Circle Component
// =============================================================================

function PhaseCircle({ phase, index }: { phase: PhaseInfo; index: number }) {
  const styles = getStatusStyles(phase.status);
  const Icon = phaseIcons[phase.phase] || Download;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
          styles.circle,
          phase.status === 'active' && 'animate-pulse'
        )}
      >
        {phase.status === 'completed' ? (
          <Check size={18} />
        ) : phase.status === 'error' ? (
          <AlertTriangle size={18} />
        ) : (
          <Icon size={18} />
        )}
      </div>
      <span
        className={cn(
          'text-[10px] mt-2 font-mono uppercase tracking-wide text-center max-w-[80px]',
          styles.label
        )}
      >
        {phase.shortLabel}
      </span>
    </div>
  );
}

// =============================================================================
// Connector Line Component
// =============================================================================

function ConnectorLine({
  prevStatus,
  isVertical
}: {
  prevStatus: PhaseStatus;
  isVertical?: boolean;
}) {
  const isCompleted = prevStatus === 'completed';

  return (
    <div
      className={cn(
        'transition-all duration-500',
        isVertical
          ? 'w-0.5 h-8 mx-auto'
          : 'flex-1 h-0.5 mx-2',
        isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
      )}
    >
      {isCompleted && (
        <div
          className={cn(
            'h-full bg-emerald-400/50',
            isVertical ? 'w-full animate-pulse' : 'w-full animate-pulse'
          )}
        />
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PhaseIndicator({
  phases,
  currentPhaseIndex,
  layout = 'horizontal',
  className,
}: PhaseIndicatorProps) {
  const displayPhases = phases.slice(0, 4); // Only show first 4 phases

  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center py-4', className)}>
        {displayPhases.map((phase, index) => (
          <div key={phase.phase} className="flex flex-col items-center">
            <PhaseCircle phase={phase} index={index} />
            {index < displayPhases.length - 1 && (
              <ConnectorLine prevStatus={phase.status} isVertical />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/30',
        className
      )}
    >
      {displayPhases.map((phase, index) => (
        <div key={phase.phase} className="contents">
          <PhaseCircle phase={phase} index={index} />
          {index < displayPhases.length - 1 && (
            <ConnectorLine prevStatus={phase.status} />
          )}
        </div>
      ))}
    </div>
  );
}
