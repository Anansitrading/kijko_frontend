// Settings Base Types
// Foundation & Settings Infrastructure

import type React from 'react';

// Theme type
export type Theme = 'light' | 'dark';

// AI Model types
export type AIModel = 'claude' | 'gemini' | 'gpt4' | 'gpt4o';

export interface AIModelOption {
  id: AIModel;
  name: string;
  provider: string;
  description: string;
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'claude', name: 'Claude', provider: 'Anthropic', description: 'Advanced reasoning and analysis' },
  { id: 'gemini', name: 'Gemini', provider: 'Google', description: 'Multimodal AI capabilities' },
  { id: 'gpt4', name: 'GPT-4', provider: 'OpenAI', description: 'General purpose AI' },
  { id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Optimized for speed' },
];

// Settings section navigation
// Note: 'integrations' was moved to dedicated Dashboard tab (task_1_4)
// Note: 'profile' was moved to user dropdown modal (task_1_5)
// Note: 'general' was removed - functionality moved to My Profile modal
export type SettingsSection =
  | 'notifications'
  | 'security'
  | 'billing'
  | 'members'
  | 'advanced-security'
  | 'audit-log';

// Save status states
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Settings value types
export type SettingsValue = string | number | boolean | string[] | Record<string, unknown>;

// Individual setting definition
export interface SettingDefinition {
  key: string;
  type: 'text' | 'toggle' | 'dropdown' | 'number';
  label: string;
  description?: string;
  defaultValue: SettingsValue;
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

// User settings data (stored in database)
export interface UserSettings {
  id: string;
  userId: string;
  settingsKey: string;
  settingsValue: SettingsValue;
  createdAt: Date;
  updatedAt: Date;
}

// Settings state for context
export interface SettingsState {
  activeSection: SettingsSection;
  settings: Record<string, SettingsValue>;
  isLoading: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  pendingSaves: Set<string>;
}

// Settings actions for reducer
export type SettingsAction =
  | { type: 'SET_SECTION'; payload: SettingsSection }
  | { type: 'SET_SETTING'; payload: { key: string; value: SettingsValue } }
  | { type: 'SET_SETTINGS'; payload: Record<string, SettingsValue> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
  | { type: 'SET_SAVE_ERROR'; payload: string | null }
  | { type: 'ADD_PENDING_SAVE'; payload: string }
  | { type: 'REMOVE_PENDING_SAVE'; payload: string }
  | { type: 'RESET_SETTINGS' };

// Sidebar navigation item
export interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
}

// Auto-save hook options
export interface UseAutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  onSuccess?: (key: string, value: SettingsValue) => void;
  onError?: (key: string, error: Error) => void;
}

// Auto-save hook return type
export interface UseAutoSaveReturn {
  save: (key: string, value: SettingsValue, immediate?: boolean) => Promise<void>;
  status: SaveStatus;
  error: string | null;
  retry: () => Promise<void>;
  cancel: () => void;
}

// Component Props
export interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export interface SettingsToggleProps {
  settingKey: string;
  label: string;
  description?: string;
  defaultValue?: boolean;
  disabled?: boolean;
}

export interface SettingsDropdownProps {
  settingKey: string;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  disabled?: boolean;
}

export interface SettingsInputProps {
  settingKey: string;
  label: string;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  defaultValue?: string;
  disabled?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

export interface SaveStatusProps {
  status: SaveStatus;
  error?: string | null;
  onRetry?: () => void;
}

export interface SettingsLayoutProps {
  children: React.ReactNode;
}
