import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatusType = 'active' | 'partial' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { icon: typeof Check; label: string; classes: string }> = {
  active: {
    icon: Check,
    label: 'Active',
    classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  partial: {
    icon: AlertTriangle,
    label: 'Partial',
    classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  inactive: {
    icon: X,
    label: 'Inactive',
    classes: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        config.classes,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      {displayLabel}
    </span>
  );
}

export function getStatusFromBoolean(active: boolean, coverage?: number): StatusType {
  if (!active) return 'inactive';
  if (coverage !== undefined && coverage < 50) return 'partial';
  return 'active';
}
