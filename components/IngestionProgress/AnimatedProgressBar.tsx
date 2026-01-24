import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

type ProgressState = 'idle' | 'in_progress' | 'complete' | 'error' | 'indeterminate';
type ProgressSize = 'sm' | 'md' | 'lg';

interface AnimatedProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current state of the progress */
  state?: ProgressState;
  /** Size variant */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'left' | 'right' | 'inside' | 'above';
  /** Custom label text (overrides percentage) */
  label?: string;
  /** Enable stripe animation for active processing */
  showStripes?: boolean;
  /** Enable gradient animation */
  showGradient?: boolean;
  /** Enable pulse animation for indeterminate state */
  showPulse?: boolean;
  /** Custom colors override */
  colors?: {
    background?: string;
    fill?: string;
    text?: string;
  };
  /** Respect reduced motion preferences */
  respectReducedMotion?: boolean;
  className?: string;
}

// =============================================================================
// Reduced Motion Hook
// =============================================================================

function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// Size Configuration
// =============================================================================

const sizeConfig: Record<ProgressSize, { height: string; text: string }> = {
  sm: { height: 'h-1.5', text: 'text-xs' },
  md: { height: 'h-2.5', text: 'text-sm' },
  lg: { height: 'h-4', text: 'text-sm' },
};

// =============================================================================
// State Color Configuration
// =============================================================================

const stateColors: Record<ProgressState, { bg: string; fill: string; text: string }> = {
  idle: {
    bg: 'bg-slate-700',
    fill: 'bg-slate-500',
    text: 'text-slate-400',
  },
  in_progress: {
    bg: 'bg-blue-500/20',
    fill: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    text: 'text-blue-400',
  },
  complete: {
    bg: 'bg-emerald-500/20',
    fill: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  error: {
    bg: 'bg-red-500/20',
    fill: 'bg-red-500',
    text: 'text-red-400',
  },
  indeterminate: {
    bg: 'bg-blue-500/20',
    fill: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600',
    text: 'text-blue-400',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function AnimatedProgressBar({
  percentage,
  state = 'in_progress',
  size = 'md',
  showLabel = true,
  labelPosition = 'right',
  label,
  showStripes = false,
  showGradient = true,
  showPulse = false,
  colors,
  respectReducedMotion = true,
  className,
}: AnimatedProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const sizeStyles = sizeConfig[size];
  const stateStyles = stateColors[state];

  // Override colors if provided
  const bgColor = colors?.background || stateStyles.bg;
  const fillColor = colors?.fill || stateStyles.fill;
  const textColor = colors?.text || stateStyles.text;

  // Determine if we should show stripes
  const displayStripes = showStripes && (state === 'in_progress' || state === 'indeterminate') && shouldAnimate;

  // Determine if we should show gradient animation
  const displayGradient = showGradient && state === 'in_progress' && shouldAnimate;

  // Determine if we should show pulse
  const displayPulse = (showPulse || state === 'indeterminate') && shouldAnimate;

  const labelText = label ?? `${clampedPercentage.toFixed(0)}%`;

  const renderLabel = () => (
    <span className={cn('font-medium tabular-nums', sizeStyles.text, textColor)}>
      {labelText}
    </span>
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Label above */}
      {showLabel && labelPosition === 'above' && (
        <div className="mb-1">{renderLabel()}</div>
      )}

      <div className="flex items-center gap-3">
        {/* Label left */}
        {showLabel && labelPosition === 'left' && renderLabel()}

        {/* Progress bar container */}
        <div
          className={cn(
            'flex-1 rounded-full overflow-hidden relative',
            bgColor,
            sizeStyles.height
          )}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Progress fill */}
          <div
            className={cn(
              'h-full rounded-full relative overflow-hidden',
              fillColor,
              shouldAnimate && 'transition-all duration-300 ease-out',
              displayPulse && 'animate-pulse'
            )}
            style={{
              width: state === 'indeterminate' ? '30%' : `${clampedPercentage}%`,
              ...(state === 'indeterminate' && shouldAnimate ? {
                animation: 'progress-indeterminate 1.5s ease-in-out infinite',
              } : {}),
            }}
          >
            {/* Gradient animation overlay */}
            {displayGradient && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: 'gradient-shift 2s ease-in-out infinite',
                  backgroundSize: '200% 100%',
                }}
              />
            )}

            {/* Stripe animation overlay */}
            {displayStripes && (
              <div
                className="absolute inset-0"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 255, 255, 0.1) 10px,
                    rgba(255, 255, 255, 0.1) 20px
                  )`,
                  animation: 'stripe-move 1s linear infinite',
                }}
              />
            )}
          </div>

          {/* Inside label */}
          {showLabel && labelPosition === 'inside' && size === 'lg' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-xs font-medium', 'text-white drop-shadow')}>
                {labelText}
              </span>
            </div>
          )}
        </div>

        {/* Label right */}
        {showLabel && labelPosition === 'right' && renderLabel()}
      </div>
    </div>
  );
}

// =============================================================================
// Specialized Progress Bar Variants
// =============================================================================

interface PhaseProgressBarProps {
  percentage: number;
  isActive: boolean;
  isComplete: boolean;
  hasError?: boolean;
  className?: string;
}

export function PhaseProgressBar({
  percentage,
  isActive,
  isComplete,
  hasError = false,
  className,
}: PhaseProgressBarProps) {
  const state: ProgressState = hasError
    ? 'error'
    : isComplete
    ? 'complete'
    : isActive
    ? 'in_progress'
    : 'idle';

  return (
    <AnimatedProgressBar
      percentage={isComplete ? 100 : percentage}
      state={state}
      size="sm"
      showLabel={false}
      showStripes={isActive && !isComplete}
      showGradient={isActive && !isComplete}
      className={className}
    />
  );
}

interface IngestionProgressBarProps {
  percentage: number;
  phaseName: string;
  className?: string;
}

export function IngestionProgressBar({
  percentage,
  phaseName,
  className,
}: IngestionProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{phaseName}</span>
        <span className="text-blue-400 font-medium tabular-nums">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <AnimatedProgressBar
        percentage={percentage}
        state="in_progress"
        size="md"
        showLabel={false}
        showStripes={true}
        showGradient={true}
      />
    </div>
  );
}

// =============================================================================
// CSS Keyframes (add to global CSS or Tailwind config)
// =============================================================================

/*
Add these to your global CSS or tailwind.config.js:

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes stripe-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}

@keyframes progress-indeterminate {
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
}

// Or add these as Tailwind plugin animations
*/

// =============================================================================
// Inline Styles for Animations (fallback if CSS not available)
// =============================================================================

export const progressBarStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes stripe-move {
    0% { background-position: 0 0; }
    100% { background-position: 40px 0; }
  }

  @keyframes progress-indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
`;

// =============================================================================
// Style Injector Component
// =============================================================================

export function ProgressBarStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: progressBarStyles }} />
  );
}

// =============================================================================
// Mock Data
// =============================================================================

export function createMockProgressData() {
  return {
    phases: [
      { name: 'Repository Fetch', percentage: 100, isActive: false, isComplete: true },
      { name: 'Parsing & Analysis', percentage: 100, isActive: false, isComplete: true },
      { name: 'Semantic Chunking', percentage: 67, isActive: true, isComplete: false },
      { name: 'Final Optimization', percentage: 0, isActive: false, isComplete: false },
    ],
    overall: 67,
  };
}
