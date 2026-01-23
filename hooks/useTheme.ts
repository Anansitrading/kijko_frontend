// useTheme hook - Convenience hook for theme management
// Setting Sprint 3: General Settings

import { useSettings } from '../contexts/SettingsContext';
import type { Theme } from '../types/settings';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

export function useTheme(): UseThemeReturn {
  const { getTheme, setTheme } = useSettings();

  const theme = getTheme();
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };
}
