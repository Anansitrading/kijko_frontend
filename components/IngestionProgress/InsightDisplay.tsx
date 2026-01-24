import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Insight, InsightType } from './InsightGenerator';

// =============================================================================
// Types
// =============================================================================

interface InsightDisplayProps {
  insights: Insight[];
  maxVisible?: number;
  autoDismissMs?: number;
  showExpandAll?: boolean;
  className?: string;
}

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  isNew?: boolean;
}

// =============================================================================
// Styling Configuration
// =============================================================================

const insightTypeStyles: Record<InsightType, {
  bg: string;
  border: string;
  text: string;
  icon: string;
}> = {
  positive: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
  neutral: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400',
  },
};

// =============================================================================
// Individual Insight Card
// =============================================================================

function InsightCard({ insight, onDismiss, isNew = false }: InsightCardProps) {
  const styles = insightTypeStyles[insight.type];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300',
        styles.bg,
        styles.border,
        isNew && 'animate-slide-in-right'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className={cn('text-lg shrink-0', styles.icon)} role="img" aria-hidden="true">
        {insight.icon}
      </span>

      {/* Message */}
      <p className={cn('flex-1 text-sm', styles.text)}>
        {insight.message}
      </p>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className={cn(
          'shrink-0 p-1 rounded-md transition-colors',
          'hover:bg-white/10 text-slate-400 hover:text-slate-200'
        )}
        aria-label="Dismiss insight"
      >
        <X size={14} />
      </button>
    </div>
  );
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
// Main Component
// =============================================================================

export function InsightDisplay({
  insights,
  maxVisible = 5,
  autoDismissMs = 10000,
  showExpandAll = true,
  className,
}: InsightDisplayProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [newInsightIds, setNewInsightIds] = useState<Set<string>>(new Set());
  const previousInsightsRef = useRef<string[]>([]);
  const prefersReducedMotion = useReducedMotion();

  // Track new insights for animation
  useEffect(() => {
    const currentIds = insights.map(i => i.id);
    const previousIds = previousInsightsRef.current;

    const newIds = currentIds.filter(id => !previousIds.includes(id));
    if (newIds.length > 0 && !prefersReducedMotion) {
      setNewInsightIds(new Set(newIds));

      // Clear "new" status after animation
      const timer = setTimeout(() => {
        setNewInsightIds(new Set());
      }, 500);

      return () => clearTimeout(timer);
    }

    previousInsightsRef.current = currentIds;
  }, [insights, prefersReducedMotion]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timers: NodeJS.Timeout[] = [];

    insights.forEach(insight => {
      if (!dismissedIds.has(insight.id)) {
        const timer = setTimeout(() => {
          setDismissedIds(prev => new Set([...prev, insight.id]));
        }, autoDismissMs);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [insights, autoDismissMs, dismissedIds]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  // Filter out dismissed insights
  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id));

  // Determine which insights to show
  const displayedInsights = isExpanded
    ? visibleInsights
    : visibleInsights.slice(0, maxVisible);

  const hasHiddenInsights = visibleInsights.length > maxVisible;
  const hiddenCount = visibleInsights.length - maxVisible;

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Insights List */}
      <div className="space-y-2">
        {displayedInsights.map(insight => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismiss}
            isNew={newInsightIds.has(insight.id)}
          />
        ))}
      </div>

      {/* Expand/Collapse Button */}
      {showExpandAll && hasHiddenInsights && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 rounded-lg',
            'text-sm text-slate-400 hover:text-slate-200',
            'hover:bg-slate-800/50 transition-colors'
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              View {hiddenCount} more insight{hiddenCount > 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Compact Insight Display (for sidebar/footer)
// =============================================================================

interface CompactInsightDisplayProps {
  insights: Insight[];
  className?: string;
}

export function CompactInsightDisplay({ insights, className }: CompactInsightDisplayProps) {
  if (insights.length === 0) return null;

  // Only show the highest priority insight
  const topInsight = insights[0];
  const styles = insightTypeStyles[topInsight.type];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
        styles.bg,
        styles.border,
        className
      )}
    >
      <span className={styles.icon} role="img" aria-hidden="true">
        {topInsight.icon}
      </span>
      <span className={styles.text}>{topInsight.message}</span>
      {insights.length > 1 && (
        <span className="text-slate-500 text-xs">
          +{insights.length - 1} more
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Inline Insight (single insight display)
// =============================================================================

interface InlineInsightProps {
  insight: Insight;
  className?: string;
}

export function InlineInsight({ insight, className }: InlineInsightProps) {
  const styles = insightTypeStyles[insight.type];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', styles.text, className)}>
      <span role="img" aria-hidden="true">{insight.icon}</span>
      {insight.message}
    </span>
  );
}

// =============================================================================
// CSS Animation Styles (to be added to global CSS or Tailwind config)
// =============================================================================

/*
Add to your tailwind.config.js or global CSS:

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
*/

// =============================================================================
// Mock Data for Development
// =============================================================================

export function createMockInsights(): Insight[] {
  return [
    {
      id: 'insight-1',
      type: 'positive',
      icon: '🚀',
      message: 'Exceptional 77% reduction achieved!',
      priority: 1,
      timestamp: new Date(),
    },
    {
      id: 'insight-2',
      type: 'neutral',
      icon: '💡',
      message: 'Your code fits 4x in Claude\'s context window',
      priority: 2,
      timestamp: new Date(),
    },
    {
      id: 'insight-3',
      type: 'positive',
      icon: '✨',
      message: 'Perfect chunk size for optimal query relevance',
      priority: 1,
      phase: 'chunking',
      timestamp: new Date(),
    },
    {
      id: 'insight-4',
      type: 'positive',
      icon: '💰',
      message: 'That\'s 7 cups of coffee saved per month!',
      priority: 3,
      timestamp: new Date(),
    },
    {
      id: 'insight-5',
      type: 'warning',
      icon: '⚠️',
      message: 'Some chunks are large - consider more granular settings',
      priority: 3,
      phase: 'chunking',
      timestamp: new Date(),
    },
  ];
}
