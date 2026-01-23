import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type {
  ContextInspectorState,
  ContextInspectorAction,
  ContextItem,
  TabType,
  SourceItem,
} from '../types/contextInspector';

// Initial state
const initialState: ContextInspectorState = {
  isOpen: false,
  contextItem: null,
  activeTab: 'overview',
  isLoading: false,
  sources: [],
  sourcesLoading: false,
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
    case 'UPDATE_CONTEXT_NAME':
      return {
        ...state,
        contextItem: state.contextItem
          ? { ...state.contextItem, name: action.payload }
          : null,
      };
    case 'SET_SOURCES':
      return {
        ...state,
        sources: action.payload,
      };
    case 'SET_SOURCES_LOADING':
      return {
        ...state,
        sourcesLoading: action.payload,
      };
    case 'TOGGLE_SOURCE':
      return {
        ...state,
        sources: state.sources.map((source) =>
          source.id === action.payload
            ? { ...source, selected: !source.selected }
            : source
        ),
      };
    case 'TOGGLE_ALL_SOURCES':
      return {
        ...state,
        sources: state.sources.map((source) => ({
          ...source,
          selected: action.payload,
        })),
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
  updateContextName: (name: string) => void;
  setSources: (sources: SourceItem[]) => void;
  setSourcesLoading: (loading: boolean) => void;
  toggleSource: (sourceId: string) => void;
  toggleAllSources: (selected: boolean) => void;
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

  const updateContextName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_CONTEXT_NAME', payload: name });
  }, []);

  const setSources = useCallback((sources: SourceItem[]) => {
    dispatch({ type: 'SET_SOURCES', payload: sources });
  }, []);

  const setSourcesLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_SOURCES_LOADING', payload: loading });
  }, []);

  const toggleSource = useCallback((sourceId: string) => {
    dispatch({ type: 'TOGGLE_SOURCE', payload: sourceId });
  }, []);

  const toggleAllSources = useCallback((selected: boolean) => {
    dispatch({ type: 'TOGGLE_ALL_SOURCES', payload: selected });
  }, []);

  const value = useMemo(
    () => ({
      state,
      openModal,
      closeModal,
      setTab,
      setLoading,
      updateContextName,
      setSources,
      setSourcesLoading,
      toggleSource,
      toggleAllSources,
    }),
    [state, openModal, closeModal, setTab, setLoading, updateContextName, setSources, setSourcesLoading, toggleSource, toggleAllSources]
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
