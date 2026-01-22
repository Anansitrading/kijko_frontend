// Update Indicator Component
// Shows "X new updates" badge with click to refresh

import { Bell } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface UpdateIndicatorProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function UpdateIndicator({ count, onClick, className }: UpdateIndicatorProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        'bg-blue-500/10 hover:bg-blue-500/20',
        'border border-blue-500/30 rounded-full',
        'text-blue-400 text-sm font-medium',
        'transition-all duration-200',
        'animate-in fade-in slide-in-from-top-1 duration-300',
        className
      )}
      aria-live="polite"
      aria-label={`${count} new update${count !== 1 ? 's' : ''}. Click to refresh.`}
    >
      <Bell className="w-4 h-4" />
      <span>
        {count} new update{count !== 1 ? 's' : ''}
      </span>
    </button>
  );
}

// ============================================
// Tab Badge Variant
// ============================================

interface TabUpdateBadgeProps {
  count: number;
  className?: string;
}

export function TabUpdateBadge({ count, className }: TabUpdateBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'bg-blue-500 text-white',
        'text-[10px] font-bold rounded-full',
        'animate-in zoom-in duration-200',
        className
      )}
      aria-label={`${count} new`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default UpdateIndicator;
