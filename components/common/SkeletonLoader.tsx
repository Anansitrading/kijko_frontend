import { cn } from '../../utils/cn';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: number;
}

export function SkeletonLoader({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
  gap = 8,
}: SkeletonLoaderProps) {
  const baseClasses = cn(
    'animate-pulse bg-white/5',
    variant === 'circular' && 'rounded-full',
    variant === 'text' && 'rounded h-4',
    variant === 'rectangular' && 'rounded-lg'
  );

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? 40 : '100%'),
    height: height ?? (variant === 'circular' ? 40 : variant === 'text' ? 16 : 48),
  };

  if (count === 1) {
    return <div className={cn(baseClasses, className)} style={style} />;
  }

  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(baseClasses, className)} style={style} />
      ))}
    </div>
  );
}

// Pre-configured skeleton variants
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white/5 border border-white/10 rounded-lg p-4 space-y-3', className)}>
      <SkeletonLoader height={20} width="60%" />
      <SkeletonLoader height={16} width="80%" />
      <SkeletonLoader height={16} width="40%" />
    </div>
  );
}

export function SkeletonList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <SkeletonLoader variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-2">
            <SkeletonLoader height={14} width="70%" />
            <SkeletonLoader height={12} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
          <SkeletonLoader height={12} width="50%" className="mb-2" />
          <SkeletonLoader height={28} width="70%" />
        </div>
      ))}
    </div>
  );
}
