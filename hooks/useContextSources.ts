import { useEffect, useCallback } from 'react';
import { useContextInspector } from '../contexts/ContextInspectorContext';
import type { SourceItem, SourceFileType } from '../types/contextInspector';

// Helper to determine file type from extension
function getFileType(filename: string): SourceFileType {
  const ext = filename.split('.').pop()?.toLowerCase();
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
      return 'css';
    case 'html':
      return 'html';
    case 'py':
      return 'python';
    case 'yml':
    case 'yaml':
      return 'yaml';
    default:
      return 'other';
  }
}

// Mock data for development
const mockSources: SourceItem[] = [
  {
    id: 'src-1',
    name: 'ContextDetailInspector.tsx',
    path: 'components/ContextDetailInspector/index.tsx',
    fileType: 'typescript',
    size: 4520,
    selected: true,
  },
  {
    id: 'src-2',
    name: 'ModalHeader.tsx',
    path: 'components/ContextDetailInspector/ModalHeader.tsx',
    fileType: 'typescript',
    size: 3280,
    selected: true,
  },
  {
    id: 'src-3',
    name: 'OverviewTab.tsx',
    path: 'components/ContextDetailInspector/tabs/OverviewTab/index.tsx',
    fileType: 'typescript',
    size: 1890,
    selected: true,
  },
  {
    id: 'src-4',
    name: 'ChatPanel.tsx',
    path: 'components/ContextDetailInspector/tabs/OverviewTab/ChatPanel.tsx',
    fileType: 'typescript',
    size: 5120,
    selected: true,
  },
  {
    id: 'src-5',
    name: 'SummaryPanel.tsx',
    path: 'components/ContextDetailInspector/tabs/OverviewTab/SummaryPanel.tsx',
    fileType: 'typescript',
    size: 4350,
    selected: true,
  },
  {
    id: 'src-6',
    name: 'package.json',
    path: 'package.json',
    fileType: 'json',
    size: 1240,
    selected: true,
  },
  {
    id: 'src-7',
    name: 'README.md',
    path: 'README.md',
    fileType: 'markdown',
    size: 2890,
    selected: false,
  },
  {
    id: 'src-8',
    name: 'tailwind.config.js',
    path: 'tailwind.config.js',
    fileType: 'javascript',
    size: 890,
    selected: true,
  },
  {
    id: 'src-9',
    name: 'contextInspector.ts',
    path: 'types/contextInspector.ts',
    fileType: 'typescript',
    size: 6780,
    selected: true,
  },
  {
    id: 'src-10',
    name: 'globals.css',
    path: 'styles/globals.css',
    fileType: 'css',
    size: 1560,
    selected: false,
  },
  {
    id: 'src-11',
    name: 'useContextSummary.ts',
    path: 'hooks/useContextSummary.ts',
    fileType: 'typescript',
    size: 2340,
    selected: true,
  },
  {
    id: 'src-12',
    name: 'useContextChat.ts',
    path: 'hooks/useContextChat.ts',
    fileType: 'typescript',
    size: 2890,
    selected: true,
  },
];

interface UseContextSourcesReturn {
  sources: SourceItem[];
  isLoading: boolean;
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  toggleSource: (sourceId: string) => void;
  toggleAll: (selected: boolean) => void;
}

export function useContextSources(contextId: string): UseContextSourcesReturn {
  const { state, setSources, setSourcesLoading, toggleSource, toggleAllSources } = useContextInspector();
  const { sources, sourcesLoading } = state;

  const fetchSources = useCallback(async () => {
    setSourcesLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      // In production, this would be:
      // const response = await fetch(`/api/context/${contextId}/sources`);
      // const data = await response.json();

      setSources(mockSources);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setSourcesLoading(false);
    }
  }, [contextId, setSources, setSourcesLoading]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const selectedCount = sources.filter((s) => s.selected).length;
  const totalCount = sources.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const handleToggleAll = useCallback((selected: boolean) => {
    toggleAllSources(selected);
  }, [toggleAllSources]);

  return {
    sources,
    isLoading: sourcesLoading,
    selectedCount,
    totalCount,
    allSelected,
    toggleSource,
    toggleAll: handleToggleAll,
  };
}

// Export helper for external use
export { getFileType };
