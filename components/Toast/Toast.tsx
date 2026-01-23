import { useEffect, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ToastState, ToastType } from './useToast';

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

const TOAST_ICONS: Record<ToastType, typeof AlertTriangle> = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  warning: {
    bg: 'bg-amber-900/90',
    border: 'border-amber-500/50',
    icon: 'text-amber-400',
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500/50',
    icon: 'text-blue-400',
  },
  success: {
    bg: 'bg-emerald-900/90',
    border: 'border-emerald-500/50',
    icon: 'text-emerald-400',
  },
};

export function Toast({ toast, onClose }: ToastProps) {
  // Handle click outside or on toast to close
  const handleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    if (!toast) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon = TOAST_ICONS[toast.type];
  const styles = TOAST_STYLES[toast.type];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      onClick={handleClick}
    >
      {/* Semi-transparent backdrop - allows click through but catches clicks on toast area */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={handleClick}
      />

      {/* Toast */}
      <div
        role="alert"
        aria-live="polite"
        onClick={handleClick}
        className={cn(
          'relative pointer-events-auto cursor-pointer',
          'flex items-center gap-3 px-5 py-4 rounded-xl',
          'border shadow-2xl backdrop-blur-sm',
          'animate-in fade-in zoom-in-95 duration-200',
          'transition-all',
          styles.bg,
          styles.border,
          toast.visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', styles.icon)} />
        <span className="text-white text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
