import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type {
  SettingsState,
  SettingsAction,
  SettingsSection,
  SettingsValue,
  Theme,
  AIModel,
} from '../types/settings';

// Local storage key for settings persistence
const SETTINGS_STORAGE_KEY = 'user_settings';

// Initial state
// Note: 'profile' section moved to user dropdown modal (task_1_5)
// Note: 'general' section removed - functionality moved to My Profile modal
const initialState: SettingsState = {
  activeSection: 'security',
  settings: {},
  isLoading: true,
  saveStatus: 'idle',
  saveError: null,
  pendingSaves: new Set(),
};

// Load settings from localStorage
function loadSettingsFromStorage(): Record<string, SettingsValue> {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings from storage:', error);
  }
  return {};
}

// Save settings to localStorage
function saveSettingsToStorage(settings: Record<string, SettingsValue>): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
}

// Apply theme to document
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Reducer function
function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'SET_SECTION':
      return {
        ...state,
        activeSection: action.payload,
      };
    case 'SET_SETTING': {
      const newSettings = {
        ...state.settings,
        [action.payload.key]: action.payload.value,
      };
      // Persist to localStorage
      saveSettingsToStorage(newSettings);
      // Apply theme if theme setting changed
      if (action.payload.key === 'theme') {
        applyTheme(action.payload.value as Theme);
      }
      return {
        ...state,
        settings: newSettings,
      };
    }
    case 'SET_SETTINGS': {
      const newSettings = {
        ...state.settings,
        ...action.payload,
      };
      // Persist to localStorage
      saveSettingsToStorage(newSettings);
      // Apply theme if present in new settings
      if ('theme' in action.payload) {
        applyTheme(action.payload.theme as Theme);
      }
      return {
        ...state,
        settings: newSettings,
        isLoading: false,
      };
    }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload,
        // Clear error when status changes to non-error
        saveError: action.payload === 'error' ? state.saveError : null,
      };
    case 'SET_SAVE_ERROR':
      return {
        ...state,
        saveError: action.payload,
        saveStatus: action.payload ? 'error' : state.saveStatus,
      };
    case 'ADD_PENDING_SAVE': {
      const newPending = new Set(state.pendingSaves);
      newPending.add(action.payload);
      return {
        ...state,
        pendingSaves: newPending,
      };
    }
    case 'REMOVE_PENDING_SAVE': {
      const newPending = new Set(state.pendingSaves);
      newPending.delete(action.payload);
      return {
        ...state,
        pendingSaves: newPending,
      };
    }
    case 'RESET_SETTINGS':
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

// Context interface
interface SettingsContextValue {
  state: SettingsState;
  setSection: (section: SettingsSection) => void;
  setSetting: (key: string, value: SettingsValue) => void;
  getSetting: <T extends SettingsValue>(key: string, defaultValue: T) => T;
  setSettings: (settings: Record<string, SettingsValue>) => void;
  setLoading: (loading: boolean) => void;
  setSaveStatus: (status: SettingsState['saveStatus']) => void;
  setSaveError: (error: string | null) => void;
  addPendingSave: (key: string) => void;
  removePendingSave: (key: string) => void;
  resetSettings: () => void;
  // Theme convenience methods
  getTheme: () => Theme;
  setTheme: (theme: Theme) => void;
  // AI Model convenience methods
  getAIModel: () => AIModel;
  setAIModel: (model: AIModel) => void;
}

// Create context
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// Provider props
interface SettingsProviderProps {
  children: React.ReactNode;
}

// Provider component
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Load settings from storage on mount
  useEffect(() => {
    const storedSettings = loadSettingsFromStorage();
    dispatch({ type: 'SET_SETTINGS', payload: storedSettings });
  }, []);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          // Apply theme if it changed
          if (newSettings.theme) {
            applyTheme(newSettings.theme as Theme);
          }
          dispatch({ type: 'SET_SETTINGS', payload: newSettings });
        } catch (error) {
          console.error('Failed to sync settings from other tab:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setSection = useCallback((section: SettingsSection) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  }, []);

  const setSetting = useCallback((key: string, value: SettingsValue) => {
    dispatch({ type: 'SET_SETTING', payload: { key, value } });
  }, []);

  const getSetting = useCallback(<T extends SettingsValue>(key: string, defaultValue: T): T => {
    if (key in state.settings) {
      return state.settings[key] as T;
    }
    return defaultValue;
  }, [state.settings]);

  const setSettings = useCallback((settings: Record<string, SettingsValue>) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setSaveStatus = useCallback((status: SettingsState['saveStatus']) => {
    dispatch({ type: 'SET_SAVE_STATUS', payload: status });
  }, []);

  const setSaveError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_SAVE_ERROR', payload: error });
  }, []);

  const addPendingSave = useCallback((key: string) => {
    dispatch({ type: 'ADD_PENDING_SAVE', payload: key });
  }, []);

  const removePendingSave = useCallback((key: string) => {
    dispatch({ type: 'REMOVE_PENDING_SAVE', payload: key });
  }, []);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
  }, []);

  // Theme convenience methods
  const getTheme = useCallback((): Theme => {
    return (state.settings.theme as Theme) || 'dark';
  }, [state.settings.theme]);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_SETTING', payload: { key: 'theme', value: theme } });
  }, []);

  // AI Model convenience methods
  const getAIModel = useCallback((): AIModel => {
    return (state.settings.ai_model as AIModel) || 'claude';
  }, [state.settings.ai_model]);

  const setAIModel = useCallback((model: AIModel) => {
    dispatch({ type: 'SET_SETTING', payload: { key: 'ai_model', value: model } });
  }, []);

  const value = useMemo(
    () => ({
      state,
      setSection,
      setSetting,
      getSetting,
      setSettings,
      setLoading,
      setSaveStatus,
      setSaveError,
      addPendingSave,
      removePendingSave,
      resetSettings,
      getTheme,
      setTheme,
      getAIModel,
      setAIModel,
    }),
    [
      state,
      setSection,
      setSetting,
      getSetting,
      setSettings,
      setLoading,
      setSaveStatus,
      setSaveError,
      addPendingSave,
      removePendingSave,
      resetSettings,
      getTheme,
      setTheme,
      getAIModel,
      setAIModel,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Export context for testing purposes
export { SettingsContext };
