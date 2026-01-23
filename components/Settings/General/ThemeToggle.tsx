// ThemeToggle component - Segmented theme switcher (Light/Dark)
// Setting Sprint 3: General Settings

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { useAutoSave } from '../../../hooks/useAutoSave';
import SettingsRow from '../SettingsRow';
import type { Theme } from '../../../types/settings';

interface ThemeToggleProps {
  /** Show as a compact button without label row */
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, isDark, setTheme } = useTheme();
  const { save } = useAutoSave();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    save('theme', newTheme, true);
  };

  if (compact) {
    return (
      <button
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        onClick={() => handleThemeChange(isDark ? 'light' : 'dark')}
        className="p-2 rounded-lg transition-colors duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-muted-foreground hover:text-foreground"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <SettingsRow
      label="Theme"
      description="Choose between light and dark mode for the interface"
    >
      <div className="flex items-center bg-secondary rounded-lg p-1 border border-border">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleThemeChange(value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200
              ${theme === value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </SettingsRow>
  );
}

export default ThemeToggle;
