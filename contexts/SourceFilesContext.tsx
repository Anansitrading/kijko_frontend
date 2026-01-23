import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';

// Types
export interface SourceFile {
  id: string;
  name: string;
  extension: string;
  size: number; // in bytes
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'css' | 'html' | 'python' | 'other';
}

interface SourceFilesState {
  files: SourceFile[];
  selectedFileIds: Set<string>;
  isLoading: boolean;
}

type SourceFilesAction =
  | { type: 'SET_FILES'; payload: SourceFile[] }
  | { type: 'ADD_FILES'; payload: SourceFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'TOGGLE_FILE_SELECTION'; payload: string }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_SELECTED_FILES'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean };

// Local storage key
const SOURCE_FILES_STORAGE_KEY = 'source_files_selection';

// Get file type from extension
function getFileType(extension: string): SourceFile['type'] {
  const ext = extension.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'html':
    case 'htm':
      return 'html';
    case 'py':
      return 'python';
    default:
      return 'other';
  }
}

// Load selection from localStorage
function loadSelectionFromStorage(): string[] {
  try {
    const stored = localStorage.getItem(SOURCE_FILES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load selection from storage:', error);
  }
  return [];
}

// Save selection to localStorage
function saveSelectionToStorage(selectedIds: string[]): void {
  try {
    localStorage.setItem(SOURCE_FILES_STORAGE_KEY, JSON.stringify(selectedIds));
  } catch (error) {
    console.error('Failed to save selection to storage:', error);
  }
}

// Mock source files data
const MOCK_SOURCE_FILES: SourceFile[] = [
  { id: '1', name: 'App.tsx', extension: 'tsx', size: 12400, type: 'typescript' },
  { id: '2', name: 'index.ts', extension: 'ts', size: 2100, type: 'typescript' },
  { id: '3', name: 'types.ts', extension: 'ts', size: 8500, type: 'typescript' },
  { id: '4', name: 'Sidebar.tsx', extension: 'tsx', size: 5600, type: 'typescript' },
  { id: '5', name: 'HypervisaView.tsx', extension: 'tsx', size: 15200, type: 'typescript' },
  { id: '6', name: 'package.json', extension: 'json', size: 3200, type: 'json' },
  { id: '7', name: 'README.md', extension: 'md', size: 4800, type: 'markdown' },
  { id: '8', name: 'index.css', extension: 'css', size: 6700, type: 'css' },
  { id: '9', name: 'vite.config.ts', extension: 'ts', size: 1800, type: 'typescript' },
  { id: '10', name: 'tailwind.config.js', extension: 'js', size: 2400, type: 'javascript' },
  { id: '11', name: 'ContextInspector.tsx', extension: 'tsx', size: 18900, type: 'typescript' },
  { id: '12', name: 'ChatHistoryPanel.tsx', extension: 'tsx', size: 9300, type: 'typescript' },
  { id: '13', name: 'SettingsContext.tsx', extension: 'tsx', size: 7800, type: 'typescript' },
  { id: '14', name: 'useTheme.ts', extension: 'ts', size: 1200, type: 'typescript' },
  { id: '15', name: 'cn.ts', extension: 'ts', size: 400, type: 'typescript' },
  { id: '16', name: 'ProjectsContext.tsx', extension: 'tsx', size: 11200, type: 'typescript' },
  { id: '17', name: 'NotificationContext.tsx', extension: 'tsx', size: 5400, type: 'typescript' },
  { id: '18', name: 'main.py', extension: 'py', size: 3600, type: 'python' },
  { id: '19', name: 'index.html', extension: 'html', size: 1100, type: 'html' },
  { id: '20', name: 'api-spec.json', extension: 'json', size: 45600, type: 'json' },
  { id: '21', name: 'EmptyState.tsx', extension: 'tsx', size: 2200, type: 'typescript' },
  { id: '22', name: 'StatusBadge.tsx', extension: 'tsx', size: 1800, type: 'typescript' },
  { id: '23', name: 'ProgressBar.tsx', extension: 'tsx', size: 1400, type: 'typescript' },
  { id: '24', name: 'tsconfig.json', extension: 'json', size: 800, type: 'json' },
];

// Initial state
const initialState: SourceFilesState = {
  files: MOCK_SOURCE_FILES,
  selectedFileIds: new Set<string>(),
  isLoading: false,
};

// Reducer
function sourceFilesReducer(state: SourceFilesState, action: SourceFilesAction): SourceFilesState {
  switch (action.type) {
    case 'SET_FILES':
      return {
        ...state,
        files: action.payload,
      };
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.payload],
      };
    case 'REMOVE_FILE': {
      const newSelectedIds = new Set(state.selectedFileIds);
      newSelectedIds.delete(action.payload);
      saveSelectionToStorage(Array.from(newSelectedIds));
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.payload),
        selectedFileIds: newSelectedIds,
      };
    }
    case 'TOGGLE_FILE_SELECTION': {
      const newSelectedIds = new Set(state.selectedFileIds);
      if (newSelectedIds.has(action.payload)) {
        newSelectedIds.delete(action.payload);
      } else {
        newSelectedIds.add(action.payload);
      }
      saveSelectionToStorage(Array.from(newSelectedIds));
      return {
        ...state,
        selectedFileIds: newSelectedIds,
      };
    }
    case 'SELECT_ALL': {
      const allIds = state.files.map((f) => f.id);
      saveSelectionToStorage(allIds);
      return {
        ...state,
        selectedFileIds: new Set(allIds),
      };
    }
    case 'DESELECT_ALL': {
      saveSelectionToStorage([]);
      return {
        ...state,
        selectedFileIds: new Set(),
      };
    }
    case 'SET_SELECTED_FILES': {
      saveSelectionToStorage(action.payload);
      return {
        ...state,
        selectedFileIds: new Set(action.payload),
      };
    }
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
interface SourceFilesContextValue {
  files: SourceFile[];
  selectedFileIds: Set<string>;
  selectedFiles: SourceFile[];
  selectedCount: number;
  totalCount: number;
  totalSize: number;
  selectedSize: number;
  isAllSelected: boolean;
  isLoading: boolean;
  toggleFileSelection: (fileId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  addFiles: (files: SourceFile[]) => void;
  removeFile: (fileId: string) => void;
  setFiles: (files: SourceFile[]) => void;
}

// Create context
const SourceFilesContext = createContext<SourceFilesContextValue | undefined>(undefined);

// Provider
interface SourceFilesProviderProps {
  children: React.ReactNode;
}

export function SourceFilesProvider({ children }: SourceFilesProviderProps) {
  const [state, dispatch] = useReducer(sourceFilesReducer, initialState);

  // Load selection from storage on mount
  useEffect(() => {
    const storedSelection = loadSelectionFromStorage();
    if (storedSelection.length > 0) {
      // Only select files that exist
      const validSelection = storedSelection.filter((id) =>
        state.files.some((f) => f.id === id)
      );
      dispatch({ type: 'SET_SELECTED_FILES', payload: validSelection });
    } else {
      // Select all files by default
      dispatch({ type: 'SELECT_ALL' });
    }
  }, []);

  const toggleFileSelection = useCallback((fileId: string) => {
    dispatch({ type: 'TOGGLE_FILE_SELECTION', payload: fileId });
  }, []);

  const selectAll = useCallback(() => {
    dispatch({ type: 'SELECT_ALL' });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL' });
  }, []);

  const addFiles = useCallback((files: SourceFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  }, []);

  const setFiles = useCallback((files: SourceFile[]) => {
    dispatch({ type: 'SET_FILES', payload: files });
  }, []);

  // Computed values
  const selectedFiles = useMemo(
    () => state.files.filter((f) => state.selectedFileIds.has(f.id)),
    [state.files, state.selectedFileIds]
  );

  const selectedCount = state.selectedFileIds.size;
  const totalCount = state.files.length;

  const totalSize = useMemo(
    () => state.files.reduce((sum, f) => sum + f.size, 0),
    [state.files]
  );

  const selectedSize = useMemo(
    () => selectedFiles.reduce((sum, f) => sum + f.size, 0),
    [selectedFiles]
  );

  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const value = useMemo(
    () => ({
      files: state.files,
      selectedFileIds: state.selectedFileIds,
      selectedFiles,
      selectedCount,
      totalCount,
      totalSize,
      selectedSize,
      isAllSelected,
      isLoading: state.isLoading,
      toggleFileSelection,
      selectAll,
      deselectAll,
      addFiles,
      removeFile,
      setFiles,
    }),
    [
      state.files,
      state.selectedFileIds,
      state.isLoading,
      selectedFiles,
      selectedCount,
      totalCount,
      totalSize,
      selectedSize,
      isAllSelected,
      toggleFileSelection,
      selectAll,
      deselectAll,
      addFiles,
      removeFile,
      setFiles,
    ]
  );

  return (
    <SourceFilesContext.Provider value={value}>
      {children}
    </SourceFilesContext.Provider>
  );
}

// Hook
export function useSourceFiles() {
  const context = useContext(SourceFilesContext);
  if (context === undefined) {
    throw new Error('useSourceFiles must be used within a SourceFilesProvider');
  }
  return context;
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Export for use in other files
export { getFileType, SourceFilesContext };
