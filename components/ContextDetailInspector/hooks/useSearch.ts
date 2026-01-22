// Search Hook for Global Search Modal
// Provides search functionality across users, activity, and changelog

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import type { SearchResult, SearchResultType, TabType } from '../../../types/contextInspector';

interface UseSearchOptions {
  contextId: string;
  debounceMs?: number;
}

interface UseSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  groupedResults: Record<SearchResultType, SearchResult[]>;
}

// Mock data for search results
const MOCK_USERS = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@kijko.ai', role: 'Admin' },
  { id: 'u2', name: 'Marcus Johnson', email: 'marcus@kijko.ai', role: 'Editor' },
  { id: 'u3', name: 'Elena Rodriguez', email: 'elena@kijko.ai', role: 'Viewer' },
  { id: 'u4', name: 'James Wilson', email: 'james@kijko.ai', role: 'Editor' },
];

const MOCK_ACTIVITY = [
  { id: 'a1', type: 'view', user: 'Sarah Chen', description: 'Viewed auth/oauth.ts', time: '2 hours ago' },
  { id: 'a2', type: 'chat', user: 'Marcus Johnson', description: 'Asked about authentication', time: '3 hours ago' },
  { id: 'a3', type: 'ingestion', user: 'System', description: 'Ingestion #12 completed', time: '1 day ago' },
  { id: 'a4', type: 'config', user: 'Sarah Chen', description: 'Updated compression settings', time: '2 days ago' },
];

const MOCK_CHANGELOG = [
  { id: 'c1', type: 'ingestion', description: 'Ingestion #12 - websocket changes', number: 12 },
  { id: 'c2', type: 'ingestion', description: 'Ingestion #11 - auth refactor', number: 11 },
  { id: 'c3', type: 'enrichment', description: 'Knowledge Graph updated', number: null },
  { id: 'c4', type: 'config', description: 'ChromaCode reconfigured', number: null },
];

export function useSearch(query: string, options: UseSearchOptions): UseSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, options.debounceMs ?? 300);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search users
    MOCK_USERS.forEach(user => {
      if (
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: `${user.email} - ${user.role}`,
          tab: 'users' as TabType,
          metadata: { email: user.email, role: user.role },
        });
      }
    });

    // Search activity
    MOCK_ACTIVITY.forEach(activity => {
      if (
        activity.description.toLowerCase().includes(lowerQuery) ||
        activity.user.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: activity.id,
          type: 'activity',
          title: activity.description,
          subtitle: `${activity.user} - ${activity.time}`,
          tab: 'users' as TabType, // Activity is shown in Users tab
          metadata: { activityType: activity.type, user: activity.user },
        });
      }
    });

    // Search changelog
    MOCK_CHANGELOG.forEach(entry => {
      if (entry.description.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: entry.id,
          type: 'changelog',
          title: entry.description,
          subtitle: entry.number ? `#${entry.number}` : entry.type,
          tab: 'changelog' as TabType,
          metadata: { entryType: entry.type, number: entry.number },
        });
      }
    });

    return searchResults;
  }, [debouncedQuery]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const grouped: Record<SearchResultType, SearchResult[]> = {
      user: [],
      activity: [],
      changelog: [],
      file: [],
    };

    results.forEach(result => {
      grouped[result.type].push(result);
    });

    return grouped;
  }, [results]);

  // Simulate loading state when query changes
  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [query]);

  return {
    results,
    isLoading,
    error,
    groupedResults,
  };
}

export default useSearch;
