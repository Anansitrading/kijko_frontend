import { useState, useEffect, useCallback } from 'react';
import type { AISummary } from '../types/contextInspector';

// Mock data for development
const mockSummary: AISummary = {
  description:
    'This codebase is a comprehensive React-based management dashboard for context monitoring and analysis. It provides real-time tracking of code contexts, compression metrics, and enrichment features. The architecture follows modern React patterns with TypeScript for type safety and Tailwind CSS for styling.',
  keyComponents: [
    'ContextDetailInspector - Main modal for viewing context details',
    'CompressionTab - Handles compression metrics and history',
    'EnrichmentsTab - Manages LSP, Knowledge Graph, and ChromaCode',
    'UsersTab - User access and activity management',
    'ChangelogTab - Version history and diff viewing',
  ],
  generatedAt: new Date(),
};

interface UseContextSummaryReturn {
  summary: AISummary | null;
  isLoading: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
}

export function useContextSummary(contextId: string): UseContextSummaryReturn {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In production, this would be:
      // const response = await fetch(`/api/context/${contextId}/summary`);
      // const data = await response.json();

      setSummary({
        ...mockSummary,
        generatedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  }, [contextId]);

  const regenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call for regeneration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, this would be:
      // const response = await fetch(`/api/context/${contextId}/summary/regenerate`, { method: 'POST' });
      // const data = await response.json();

      setSummary({
        ...mockSummary,
        description:
          'This is a sophisticated React application designed for context management and code analysis. It features a modular architecture with dedicated tabs for overview, compression analytics, enrichment tracking, user management, and version history. Built with TypeScript and modern React patterns.',
        generatedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate summary');
    } finally {
      setIsLoading(false);
    }
  }, [contextId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    regenerate,
  };
}
