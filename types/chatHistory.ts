// Chat History TypeScript Interfaces
// Sprint EX4: Chat History - Data Management & Persistence

import { Message } from '../types';

// ==========================================
// Core Data Structures
// ==========================================

// Source file type for chat session context
export type SourceFileType = 'code' | 'document' | 'image' | 'json' | 'text' | 'other';

// Source file associated with a chat session
export interface SourceFile {
  id: string;
  name: string;
  type: SourceFileType;
  size: number; // in bytes
  selected: boolean;
  path?: string;
}

// Chat history list item (lightweight for list display)
export interface ChatHistoryItem {
  id: string;
  timestamp: Date;
  title: string;
  preview: string;
  messageCount: number;
  lastActivity: Date;
}

// Full chat session with all data
export interface ChatSession {
  id: string;
  metadata: ChatHistoryItem;
  messages: Message[];
  sourceFiles: SourceFile[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// State Management
// ==========================================

// Chat history state
export interface ChatHistoryState {
  // List of all chat history items (lightweight metadata)
  historyItems: ChatHistoryItem[];
  // Currently active chat ID (null if no active chat or new unsaved chat)
  activeChatId: string | null;
  // Full session data for active chat
  activeSession: ChatSession | null;
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  // Error state
  error: string | null;
  // Unsaved changes flag
  hasUnsavedChanges: boolean;
}

// Chat history actions
export type ChatHistoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HISTORY_ITEMS'; payload: ChatHistoryItem[] }
  | { type: 'ADD_CHAT'; payload: ChatSession }
  | { type: 'UPDATE_CHAT'; payload: ChatSession }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'SET_ACTIVE_CHAT'; payload: { id: string; session: ChatSession } }
  | { type: 'CLEAR_ACTIVE_CHAT' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'UPDATE_SOURCE_FILES'; payload: SourceFile[] }
  | { type: 'RENAME_CHAT'; payload: { id: string; title: string } }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SYNC_FROM_STORAGE'; payload: { items: ChatHistoryItem[]; activeSession: ChatSession | null } };

// ==========================================
// Persistence
// ==========================================

// Versioned storage structure for future migrations
export interface StoredChatHistory {
  version: number;
  items: ChatHistoryItem[];
  activeChatId: string | null;
}

// Serializable chat session for localStorage
export interface StoredChatSession {
  version: number;
  session: Omit<ChatSession, 'createdAt' | 'updatedAt' | 'metadata'> & {
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    metadata: Omit<ChatHistoryItem, 'timestamp' | 'lastActivity'> & {
      timestamp: string;
      lastActivity: string;
    };
  };
}

// ==========================================
// Storage Keys
// ==========================================

export const STORAGE_KEYS = {
  CHAT_HISTORY: 'kijko_chat_history',
  CHAT_SESSION_PREFIX: 'kijko_chat_session_',
  getChatSessionKey: (id: string) => `kijko_chat_session_${id}`,
  // Panel state persistence (Sprint EX5 Feature 3)
  PANEL_STATES: 'kijko_panel_states',
} as const;

// Panel state persistence types (Sprint EX5 Feature 3)
export interface PanelStates {
  sourceFilesCollapsed: boolean;
  chatHistoryCollapsed: boolean;
}

// ==========================================
// Constants
// ==========================================

export const CHAT_HISTORY_VERSION = 1;
export const MAX_TITLE_LENGTH = 100;
export const AUTO_SAVE_DEBOUNCE_MS = 1500;
export const MAX_PREVIEW_LENGTH = 100;

// ==========================================
// Context Types
// ==========================================

export interface ChatHistoryContextValue {
  state: ChatHistoryState;
  // Actions
  createNewChat: (retainSourceFiles?: boolean) => void;
  loadChat: (id: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateSourceFiles: (files: SourceFile[]) => void;
  saveCurrentSession: () => Promise<void>;
  // Computed
  getCurrentSession: () => ChatSession | null;
}
