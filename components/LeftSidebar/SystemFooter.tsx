import { Settings, Sun, Moon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../hooks/useTheme';
import { useAutoSave } from '../../hooks/useAutoSave';

type SystemStatus = 'optimal' | 'warning' | 'error';

interface SystemFooterProps {
  status?: SystemStatus;
  onOpenSettings: () => void;
  className?: string;
}

export function SystemFooter({
  status = 'optimal',
  onOpenSettings,
  className
}: SystemFooterProps) {
  const { isDark, toggleTheme } = useTheme();
  const { save } = useAutoSave();

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    toggleTheme();
    save('theme', newTheme, true);
  };

  const statusConfig = {
    optimal: {
      label: 'SYSTEM OPTIMAL',
      dotClass: 'bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      textClass: 'text-accent',
    },
    warning: {
      label: 'SYSTEM WARNING',
      dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      textClass: 'text-amber-400',
    },
    error: {
      label: 'SYSTEM ERROR',
      dotClass: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]',
      textClass: 'text-red-400',
    },
  };

  const { label, dotClass, textClass } = statusConfig[status];

  return (
    <div className={cn("p-4 border-t border-sidebar-border", className)}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className={cn("w-2 h-2 rounded-full", dotClass)} />
        <span className={cn("text-xs font-mono", textClass)}>
          {label}
        </span>
      </div>

      {/* Settings and Theme Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenSettings}
          className={cn(
            "flex items-center gap-2",
            "text-xs text-muted-foreground hover:text-sidebar-foreground",
            "px-2 py-1",
            "transition-colors group"
          )}
        >
          <Settings
            size={14}
            className="transition-transform duration-500 group-hover:rotate-90"
          />
          System Settings
        </button>

        <button
          onClick={handleThemeToggle}
          className={cn(
            "p-2",
            "text-muted-foreground hover:text-sidebar-foreground",
            "hover:bg-sidebar-accent rounded-lg",
            "transition-colors"
          )}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
