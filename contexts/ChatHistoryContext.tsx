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
  STORAGE_KEYS,
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
  openTabIds: [],
  openTabSessions: {},
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
        openTabIds: [...state.openTabIds, action.payload.id],
        openTabSessions: {
          ...state.openTabSessions,
          [action.payload.id]: action.payload,
        },
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
      const newTabIds = state.openTabIds.filter(id => id !== deletedId);
      const { [deletedId]: _removedDeleted, ...remainingDeletedSessions } = state.openTabSessions;

      let newActiveChatId = wasActive ? null : state.activeChatId;
      let newActiveSession = wasActive ? null : state.activeSession;
      if (wasActive && newTabIds.length > 0) {
        const closedIndex = state.openTabIds.indexOf(deletedId);
        const newFocusIndex = Math.min(closedIndex, newTabIds.length - 1);
        newActiveChatId = newTabIds[newFocusIndex];
        newActiveSession = remainingDeletedSessions[newActiveChatId] || null;
      }

      return {
        ...state,
        historyItems: newItems,
        activeChatId: newActiveChatId,
        activeSession: newActiveSession,
        openTabIds: newTabIds,
        openTabSessions: remainingDeletedSessions,
      };
    }

    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChatId: action.payload.id,
        activeSession: action.payload.session,
        openTabIds: state.openTabIds.includes(action.payload.id)
          ? state.openTabIds
          : [...state.openTabIds, action.payload.id],
        openTabSessions: {
          ...state.openTabSessions,
          [action.payload.id]: action.payload.session,
        },
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
        openTabSessions: state.openTabIds.includes(updatedSession.id)
          ? { ...state.openTabSessions, [updatedSession.id]: updatedSession }
          : state.openTabSessions,
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

      const updatedMsgSession: ChatSession = {
        ...state.activeSession,
        messages: action.payload,
        metadata: updatedMetadata,
        updatedAt: now,
      };

      return {
        ...state,
        activeSession: updatedMsgSession,
        historyItems: state.historyItems.map((item) =>
          item.id === state.activeSession!.id ? updatedMetadata : item
        ),
        openTabSessions: state.openTabIds.includes(state.activeSession.id)
          ? { ...state.openTabSessions, [state.activeSession.id]: updatedMsgSession }
          : state.openTabSessions,
        hasUnsavedChanges: true,
      };
    }

    case 'UPDATE_SOURCE_FILES': {
      if (!state.activeSession) return state;

      const updatedSrcSession: ChatSession = {
        ...state.activeSession,
        sourceFiles: action.payload,
        updatedAt: new Date(),
      };

      return {
        ...state,
        activeSession: updatedSrcSession,
        openTabSessions: state.openTabIds.includes(state.activeSession.id)
          ? { ...state.openTabSessions, [state.activeSession.id]: updatedSrcSession }
          : state.openTabSessions,
        hasUnsavedChanges: true,
      };
    }

    case 'RENAME_CHAT': {
      const { id, title } = action.payload;
      const truncatedTitle = title.slice(0, MAX_TITLE_LENGTH);

      const renamedActiveSession =
        state.activeSession?.id === id
          ? {
              ...state.activeSession,
              metadata: { ...state.activeSession.metadata, title: truncatedTitle },
            }
          : state.activeSession;

      // Update tab session if open
      const updatedRenameTabSessions = state.openTabSessions[id]
        ? {
            ...state.openTabSessions,
            [id]: {
              ...state.openTabSessions[id],
              metadata: { ...state.openTabSessions[id].metadata, title: truncatedTitle },
            },
          }
        : state.openTabSessions;

      return {
        ...state,
        historyItems: state.historyItems.map((item) =>
          item.id === id ? { ...item, title: truncatedTitle } : item
        ),
        activeSession: renamedActiveSession,
        openTabSessions: updatedRenameTabSessions,
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

    case 'OPEN_TAB': {
      const { id: openId, session: openSession } = action.payload;
      const alreadyOpen = state.openTabIds.includes(openId);
      return {
        ...state,
        activeChatId: openId,
        activeSession: openSession,
        openTabIds: alreadyOpen ? state.openTabIds : [...state.openTabIds, openId],
        openTabSessions: {
          ...state.openTabSessions,
          [openId]: openSession,
        },
        hasUnsavedChanges: false,
      };
    }

    case 'CLOSE_TAB': {
      const closedId = action.payload;
      const newClosedTabIds = state.openTabIds.filter(id => id !== closedId);
      const { [closedId]: _removedClosed, ...remainingClosedSessions } = state.openTabSessions;

      const wasClosedActive = state.activeChatId === closedId;
      let newClosedActiveChatId = wasClosedActive ? null : state.activeChatId;
      let newClosedActiveSession = wasClosedActive ? null : state.activeSession;

      if (wasClosedActive && newClosedTabIds.length > 0) {
        const closedIndex = state.openTabIds.indexOf(closedId);
        const newFocusIndex = Math.min(closedIndex, newClosedTabIds.length - 1);
        newClosedActiveChatId = newClosedTabIds[newFocusIndex];
        newClosedActiveSession = remainingClosedSessions[newClosedActiveChatId] || null;
      }

      return {
        ...state,
        activeChatId: newClosedActiveChatId,
        activeSession: newClosedActiveSession,
        openTabIds: newClosedTabIds,
        openTabSessions: remainingClosedSessions,
      };
    }

    case 'FOCUS_TAB': {
      const focusId = action.payload;
      const focusSession = state.openTabSessions[focusId] || null;
      return {
        ...state,
        activeChatId: focusId,
        activeSession: focusSession,
      };
    }

    case 'SET_OPEN_TABS':
      return {
        ...state,
        openTabIds: action.payload,
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

      // Restore open tabs from localStorage
      const storedTabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
      if (storedTabs) {
        const tabIds: string[] = JSON.parse(storedTabs);
        const validTabIds: string[] = [];

        for (const id of tabIds) {
          const session = loadChatSession(id);
          if (session) {
            validTabIds.push(id);
            dispatch({ type: 'OPEN_TAB', payload: { id, session } });
          }
        }

        // Focus the first tab if any were restored
        if (validTabIds.length > 0) {
          dispatch({ type: 'FOCUS_TAB', payload: validTabIds[0] });
        }
      }
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
  const createNewChat = useCallback((retainSourceFiles = false, initialTitle?: string): string => {
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
      title: initialTitle || 'New Chat',
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

    return id;
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

  // Open a chat as a tab (and focus it)
  const openTab = useCallback(async (id: string) => {
    // If already open, just focus it
    if (state.openTabSessions[id]) {
      dispatch({ type: 'FOCUS_TAB', payload: id });
      return;
    }

    // Load from storage and open as tab
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const session = loadChatSession(id);
      if (session) {
        dispatch({ type: 'OPEN_TAB', payload: { id, session } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: `Chat session ${id} not found` });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open chat tab' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.openTabSessions]);

  // Close a tab (save session, remove from tabs)
  const closeTab = useCallback((id: string) => {
    // Save the session before closing
    const session = state.openTabSessions[id];
    if (session) {
      saveChatSession(session);
      saveChatHistoryList(state.historyItems);
    }
    dispatch({ type: 'CLOSE_TAB', payload: id });
  }, [state.openTabSessions, state.historyItems]);

  // Switch focus to another open tab
  const focusTab = useCallback((id: string) => {
    // Save current focused session before switching
    if (state.activeSession && state.hasUnsavedChanges) {
      saveChatSession(state.activeSession);
      saveChatHistoryList(state.historyItems);
    }
    dispatch({ type: 'FOCUS_TAB', payload: id });
  }, [state.activeSession, state.hasUnsavedChanges, state.historyItems]);

  // Persist open tab IDs to localStorage
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(state.openTabIds));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [state.openTabIds]);

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
      openTab,
      closeTab,
      focusTab,
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
      openTab,
      closeTab,
      focusTab,
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
