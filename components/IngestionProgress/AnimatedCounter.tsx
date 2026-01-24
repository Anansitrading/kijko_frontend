import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

type FormatType = 'number' | 'percent' | 'currency' | 'tokens';
type EasingFunction = (t: number) => number;

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: FormatType;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  currency?: string;
  locale?: string;
  className?: string;
  /** Start counting from this value instead of 0 */
  startFrom?: number;
  /** Easing function - defaults to easeOut */
  easing?: 'linear' | 'easeOut' | 'easeInOut';
  /** Respect reduced motion preferences */
  respectReducedMotion?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

// =============================================================================
// Easing Functions
// =============================================================================

const easingFunctions: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

// =============================================================================
// Formatting Functions
// =============================================================================

function formatValue(
  value: number,
  format: FormatType,
  decimals: number,
  currency: string,
  locale: string
): string {
  switch (format) {
    case 'percent':
      return `${value.toFixed(decimals)}%`;

    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case 'tokens':
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(decimals)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(decimals)}K`;
      }
      return value.toFixed(decimals === 0 ? 0 : decimals);

    case 'number':
    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
  }
}

// =============================================================================
// Hook for checking reduced motion preference
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

export function AnimatedCounter({
  value,
  duration = 1000,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 0,
  currency = 'EUR',
  locale = 'en-US',
  className,
  startFrom = 0,
  easing = 'easeOut',
  respectReducedMotion = true,
  onComplete,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(startFrom);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef(startFrom);
  const prefersReducedMotion = useReducedMotion();

  const animate = useCallback((currentTime: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunctions[easing](progress);

    const currentValue = previousValueRef.current + (value - previousValueRef.current) * easedProgress;
    setDisplayValue(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
      onComplete?.();
    }
  }, [value, duration, easing, onComplete]);

  useEffect(() => {
    // Skip animation if reduced motion is preferred and respected
    if (respectReducedMotion && prefersReducedMotion) {
      setDisplayValue(value);
      previousValueRef.current = value;
      onComplete?.();
      return;
    }

    // Skip animation if value hasn't changed
    if (value === previousValueRef.current) {
      return;
    }

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset start time for new animation
    startTimeRef.current = null;

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animate, respectReducedMotion, prefersReducedMotion, onComplete]);

  // Update previous value after animation completes or value changes
  useEffect(() => {
    previousValueRef.current = displayValue;
  }, [displayValue]);

  const formattedValue = formatValue(displayValue, format, decimals, currency, locale);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// =============================================================================
// Compound Components for Common Use Cases
// =============================================================================

interface TokenCounterProps {
  value: number;
  duration?: number;
  className?: string;
  showSuffix?: boolean;
}

export function TokenCounter({
  value,
  duration = 1000,
  className,
  showSuffix = true
}: TokenCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      format="tokens"
      suffix={showSuffix ? ' tokens' : ''}
      decimals={1}
      className={className}
    />
  );
}

interface PercentCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function PercentCounter({
  value,
  duration = 1000,
  className,
  decimals = 1
}: PercentCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      format="percent"
      decimals={decimals}
      className={className}
    />
  );
}

interface CurrencyCounterProps {
  value: number;
  currency?: string;
  duration?: number;
  className?: string;
}

export function CurrencyCounter({
  value,
  currency = 'EUR',
  duration = 1000,
  className
}: CurrencyCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      format="currency"
      currency={currency}
      decimals={2}
      className={className}
    />
  );
}

// =============================================================================
// Demo/Mock Data
// =============================================================================

export function createMockCounterDemo() {
  return {
    tokens: 42500,
    percent: 77.1,
    cost: 2.58,
    files: 127,
  };
}
