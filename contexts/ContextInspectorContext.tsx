import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type {
  ContextInspectorState,
  ContextInspectorAction,
  ContextItem,
  TabType,
} from '../types/contextInspector';

// Initial state
const initialState: ContextInspectorState = {
  isOpen: false,
  contextItem: null,
  activeTab: 'overview',
  isLoading: false,
};

// Reducer function
function contextInspectorReducer(
  state: ContextInspectorState,
  action: ContextInspectorAction
): ContextInspectorState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        isOpen: true,
        contextItem: action.payload,
        activeTab: 'overview', // Reset to first tab when opening
        isLoading: false,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        isOpen: false,
        // Keep contextItem for potential animation purposes
      };
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Context interface
interface ContextInspectorContextValue {
  state: ContextInspectorState;
  openModal: (contextItem: ContextItem) => void;
  closeModal: () => void;
  setTab: (tab: TabType) => void;
  setLoading: (loading: boolean) => void;
}

// Create context
const ContextInspectorContext = createContext<ContextInspectorContextValue | undefined>(undefined);

// Provider props
interface ContextInspectorProviderProps {
  children: React.ReactNode;
}

// Provider component
export function ContextInspectorProvider({ children }: ContextInspectorProviderProps) {
  const [state, dispatch] = useReducer(contextInspectorReducer, initialState);

  const openModal = useCallback((contextItem: ContextItem) => {
    dispatch({ type: 'OPEN_MODAL', payload: contextItem });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const setTab = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const value = useMemo(
    () => ({
      state,
      openModal,
      closeModal,
      setTab,
      setLoading,
    }),
    [state, openModal, closeModal, setTab, setLoading]
  );

  return (
    <ContextInspectorContext.Provider value={value}>
      {children}
    </ContextInspectorContext.Provider>
  );
}

// Custom hook to use the context
export function useContextInspector() {
  const context = useContext(ContextInspectorContext);
  if (context === undefined) {
    throw new Error('useContextInspector must be used within a ContextInspectorProvider');
  }
  return context;
}

// Export context for testing purposes
export { ContextInspectorContext };
