import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { IngestionConfig } from '../types';

// Types
export interface SelectedFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
}

interface IngestionState {
  isModalOpen: boolean;
  selectedFile: SelectedFile | null;
  isProcessing: boolean;
  processingProgress: number;
  error: string | null;
}

type IngestionAction =
  | { type: 'OPEN_MODAL'; payload: SelectedFile }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Initial state
const initialState: IngestionState = {
  isModalOpen: false,
  selectedFile: null,
  isProcessing: false,
  processingProgress: 0,
  error: null,
};

// Reducer
function ingestionReducer(state: IngestionState, action: IngestionAction): IngestionState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        isModalOpen: true,
        selectedFile: action.payload,
        error: null,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        isModalOpen: false,
        selectedFile: null,
        isProcessing: false,
        processingProgress: 0,
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'SET_PROGRESS':
      return {
        ...state,
        processingProgress: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context interface
interface IngestionContextValue {
  isModalOpen: boolean;
  selectedFile: SelectedFile | null;
  isProcessing: boolean;
  processingProgress: number;
  error: string | null;
  openIngestionModal: (file: SelectedFile) => void;
  closeIngestionModal: () => void;
  startProcessing: () => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create context
const IngestionContext = createContext<IngestionContextValue | undefined>(undefined);

// Provider
interface IngestionProviderProps {
  children: React.ReactNode;
}

export function IngestionProvider({ children }: IngestionProviderProps) {
  const [state, dispatch] = useReducer(ingestionReducer, initialState);

  const openIngestionModal = useCallback((file: SelectedFile) => {
    dispatch({ type: 'OPEN_MODAL', payload: file });
  }, []);

  const closeIngestionModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const startProcessing = useCallback(() => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
  }, []);

  const setProgress = useCallback((progress: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      isModalOpen: state.isModalOpen,
      selectedFile: state.selectedFile,
      isProcessing: state.isProcessing,
      processingProgress: state.processingProgress,
      error: state.error,
      openIngestionModal,
      closeIngestionModal,
      startProcessing,
      setProgress,
      setError,
      reset,
    }),
    [
      state.isModalOpen,
      state.selectedFile,
      state.isProcessing,
      state.processingProgress,
      state.error,
      openIngestionModal,
      closeIngestionModal,
      startProcessing,
      setProgress,
      setError,
      reset,
    ]
  );

  return (
    <IngestionContext.Provider value={value}>
      {children}
    </IngestionContext.Provider>
  );
}

// Hook
export function useIngestion() {
  const context = useContext(IngestionContext);
  if (context === undefined) {
    throw new Error('useIngestion must be used within an IngestionProvider');
  }
  return context;
}

// Helper to format file size
export function formatFileSizeFromBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
