import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type {
  ChatHistoryState,
  ChatHistoryAction,
  ChatSession,
  ChatHistoryItem,
  SourceFile,
  ChatHistoryContextValue,
} from '../types/chatHistory';
import { Message } from '../types';
import {
  AUTO_SAVE_DEBOUNCE_MS,
  MAX_TITLE_LENGTH,
} from '../types/chatHistory';
import {
  generateChatId,
  loadChatHistoryList,
  saveChatHistoryList,
  loadChatSession,
  saveChatSession,
  deleteChatSession as deleteSessionFromStorage,
  generateChatTitle,
  generateChatPreview,
  isLocalStorageAvailable,
} from '../utils/chatHistoryStorage';

// Initial state
const initialState: ChatHistoryState = {
  historyItems: [],
  activeChatId: null,
  activeSession: null,
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
};

// Reducer function
function chatHistoryReducer(
  state: ChatHistoryState,
  action: ChatHistoryAction
): ChatHistoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_HISTORY_ITEMS':
      return { ...state, historyItems: action.payload };

    case 'ADD_CHAT': {
      const newItem = action.payload.metadata;
      return {
        ...state,
        historyItems: [newItem, ...state.historyItems],
        activeChatId: action.payload.id,
        activeSession: action.payload,
        hasUnsavedChanges: false,
      };
    }

    case 'UPDATE_CHAT': {
      const updatedSession = action.payload;
      return {
        ...state,
        historyItems: state.historyItems.map((item) =>
          item.id === updatedSession.id ? updatedSession.metadata : item
        ),
        activeSession:
          state.activeChatId === updatedSession.id
            ? updatedSession
            : state.activeSession,
        hasUnsavedChanges: false,
      };
    }

    case 'DELETE_CHAT': {
      const deletedId = action.payload;
      const newItems = state.historyItems.filter((item) => item.id !== deletedId);
      const wasActive = state.activeChatId === deletedId;
      return {
        ...state,
        historyItems: newItems,
        activeChatId: wasActive ? null : state.activeChatId,
        activeSession: wasActive ? null : state.activeSession,
      };
    }

    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChatId: action.payload.id,
        activeSession: action.payload.session,
        hasUnsavedChanges: false,
      };

    case 'CLEAR_ACTIVE_CHAT':
      return {
        ...state,
        activeChatId: null,
        activeSession: null,
        hasUnsavedChanges: false,
      };

    case 'ADD_MESSAGE': {
      if (!state.activeSession) return state;

      const newMessage = action.payload;
      const messages = [...state.activeSession.messages, newMessage];
      const now = new Date();

      // Generate title from first user message if not set
      let title = state.activeSession.metadata.title;
      if (title === 'New Chat' && newMessage.role === 'user' && messages.filter(m => m.role === 'user').length === 1) {
        title = generateChatTitle(newMessage.content);
      }

      // Generate preview from last message
      const preview = generateChatPreview(newMessage.content);

      const updatedMetadata: ChatHistoryItem = {
        ...state.activeSession.metadata,
        title,
        preview,
        messageCount: messages.length,
        lastActivity: now,
      };

      const updatedSession: ChatSession = {
        ...state.activeSession,
        messages,
        metadata: updatedMetadata,
        updatedAt: now,
      };

      return {
        ...state,
        activeSession: updatedSession,
        historyItems: state.historyItems.map((item) =>
          item.id === updatedSession.id ? updatedMetadata : item
        ),
        hasUnsavedChanges: true,
      };
    }

    case 'SET_MESSAGES': {
      if (!state.activeSession) return state;

      const now = new Date();
      const lastMessage = action.payload[action.payload.length - 1];
      const preview = lastMessage ? generateChatPreview(lastMessage.content) : '';

      const updatedMetadata: ChatHistoryItem = {
        ...state.activeSession.metadata,
        preview,
        messageCount: action.payload.length,
        lastActivity: now,
      };

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          messages: action.payload,
          metadata: updatedMetadata,
          updatedAt: now,
        },
        historyItems: state.historyItems.map((item) =>
          item.id === state.activeSession!.id ? updatedMetadata : item
        ),
        hasUnsavedChanges: true,
      };
    }

    case 'UPDATE_SOURCE_FILES': {
      if (!state.activeSession) return state;

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          sourceFiles: action.payload,
          updatedAt: new Date(),
        },
        hasUnsavedChanges: true,
      };
    }

    case 'RENAME_CHAT': {
      const { id, title } = action.payload;
      const truncatedTitle = title.slice(0, MAX_TITLE_LENGTH);

      return {
        ...state,
        historyItems: state.historyItems.map((item) =>
          item.id === id ? { ...item, title: truncatedTitle } : item
        ),
        activeSession:
          state.activeSession?.id === id
            ? {
                ...state.activeSession,
                metadata: { ...state.activeSession.metadata, title: truncatedTitle },
              }
            : state.activeSession,
        hasUnsavedChanges: true,
      };
    }

    case 'SET_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };

    case 'SYNC_FROM_STORAGE':
      return {
        ...state,
        historyItems: action.payload.items,
        activeSession: action.payload.activeSession,
        activeChatId: action.payload.activeSession?.id ?? null,
      };

    default:
      return state;
  }
}

// Create context
const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(undefined);

// Provider props
interface ChatHistoryProviderProps {
  children: React.ReactNode;
}

// Provider component
export function ChatHistoryProvider({ children }: ChatHistoryProviderProps) {
  const [state, dispatch] = useReducer(chatHistoryReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    if (!isLocalStorageAvailable()) {
      dispatch({ type: 'SET_ERROR', payload: 'localStorage is not available' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const items = loadChatHistoryList();
      dispatch({ type: 'SET_HISTORY_ITEMS', payload: items });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat history' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Auto-save debounced effect
  useEffect(() => {
    if (!state.hasUnsavedChanges || !state.activeSession) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (state.activeSession) {
        dispatch({ type: 'SET_SAVING', payload: true });

        const success = saveChatSession(state.activeSession);
        if (success) {
          saveChatHistoryList(state.historyItems);
          dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
        }

        dispatch({ type: 'SET_SAVING', payload: false });
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.hasUnsavedChanges, state.activeSession, state.historyItems]);

  // Create a new chat
  const createNewChat = useCallback((retainSourceFiles = false) => {
    // Save current session before creating new one
    if (state.activeSession && state.hasUnsavedChanges) {
      saveChatSession(state.activeSession);
      saveChatHistoryList(state.historyItems);
    }

    const now = new Date();
    const id = generateChatId();

    const metadata: ChatHistoryItem = {
      id,
      timestamp: now,
      title: 'New Chat',
      preview: '',
      messageCount: 0,
      lastActivity: now,
    };

    const newSession: ChatSession = {
      id,
      metadata,
      messages: [],
      sourceFiles: retainSourceFiles && state.activeSession
        ? [...state.activeSession.sourceFiles]
        : [],
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: 'ADD_CHAT', payload: newSession });

    // Save immediately
    saveChatSession(newSession);
    saveChatHistoryList([metadata, ...state.historyItems]);
  }, [state.activeSession, state.hasUnsavedChanges, state.historyItems]);

  // Load a chat session
  const loadChat = useCallback(async (id: string) => {
    // Save current session before loading another
    if (state.activeSession && state.hasUnsavedChanges) {
      saveChatSession(state.activeSession);
      saveChatHistoryList(state.historyItems);
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const session = loadChatSession(id);
      if (session) {
        dispatch({ type: 'SET_ACTIVE_CHAT', payload: { id, session } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: `Chat session ${id} not found` });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeSession, state.hasUnsavedChanges, state.historyItems]);

  // Delete a chat session
  const deleteChat = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const success = deleteSessionFromStorage(id);
      if (success) {
        dispatch({ type: 'DELETE_CHAT', payload: id });
        const newItems = state.historyItems.filter((item) => item.id !== id);
        saveChatHistoryList(newItems);
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat session' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.historyItems]);

  // Rename a chat
  const renameChat = useCallback(async (id: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    dispatch({ type: 'RENAME_CHAT', payload: { id, title: trimmedTitle } });

    // Update in storage
    const session = state.activeSession?.id === id
      ? state.activeSession
      : loadChatSession(id);

    if (session) {
      const updatedSession = {
        ...session,
        metadata: {
          ...session.metadata,
          title: trimmedTitle.slice(0, MAX_TITLE_LENGTH),
        },
        updatedAt: new Date(),
      };
      saveChatSession(updatedSession);
      saveChatHistoryList(
        state.historyItems.map((item) =>
          item.id === id ? updatedSession.metadata : item
        )
      );
    }
  }, [state.activeSession, state.historyItems]);

  // Add a message to the current session
  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  // Update source files for the current session
  const updateSourceFiles = useCallback((files: SourceFile[]) => {
    dispatch({ type: 'UPDATE_SOURCE_FILES', payload: files });
  }, []);

  // Save the current session immediately
  const saveCurrentSession = useCallback(async () => {
    if (!state.activeSession) return;

    dispatch({ type: 'SET_SAVING', payload: true });

    try {
      const success = saveChatSession(state.activeSession);
      if (success) {
        saveChatHistoryList(state.historyItems);
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save chat session' });
      }
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.activeSession, state.historyItems]);

  // Get the current session
  const getCurrentSession = useCallback(() => {
    return state.activeSession;
  }, [state.activeSession]);

  const value = useMemo<ChatHistoryContextValue>(
    () => ({
      state,
      createNewChat,
      loadChat,
      deleteChat,
      renameChat,
      addMessage,
      updateSourceFiles,
      saveCurrentSession,
      getCurrentSession,
    }),
    [
      state,
      createNewChat,
      loadChat,
      deleteChat,
      renameChat,
      addMessage,
      updateSourceFiles,
      saveCurrentSession,
      getCurrentSession,
    ]
  );

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

// Custom hook to use the context
export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}

// Export context for testing purposes
export { ChatHistoryContext };
