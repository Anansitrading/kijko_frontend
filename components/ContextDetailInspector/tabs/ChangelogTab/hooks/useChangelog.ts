import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChangelogEntry, ChangelogEntryType, TimeRange, UserAccess } from '../../../../../types/contextInspector';

// Mock users for changelog entries
const MOCK_USERS: Record<string, UserAccess> = {
  you: {
    id: 'user-1',
    name: 'You',
    email: 'you@example.com',
    role: 'owner',
    lastActive: new Date(),
    avatar: undefined,
  },
  sarah: {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    role: 'admin',
    lastActive: new Date(Date.now() - 86400000),
    avatar: undefined,
  },
  mike: {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'editor',
    lastActive: new Date(Date.now() - 172800000),
    avatar: undefined,
  },
};

// Generate mock changelog entries
function generateMockChangelog(): ChangelogEntry[] {
  const now = new Date();

  return [
    {
      id: 'cl-1',
      type: 'ingestion',
      number: 12,
      timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
      author: MOCK_USERS.you,
      filesAdded: 127,
      filesRemoved: 3,
      filesModified: 45,
      addedFiles: [
        'src/features/real-time/websocket.ts',
        'src/features/real-time/events.ts',
        'src/features/real-time/handlers/connection.ts',
        'src/features/real-time/handlers/message.ts',
        'src/features/real-time/types.ts',
      ],
      removedFiles: [
        'src/legacy/old-client.ts',
        'src/legacy/deprecated.ts',
      ],
      modifiedFiles: [
        { path: 'src/core/client.ts', linesAdded: 234, linesRemoved: 89 },
        { path: 'src/core/config.ts', linesAdded: 45, linesRemoved: 12 },
        { path: 'src/utils/helpers.ts', linesAdded: 23, linesRemoved: 5 },
      ],
    },
    {
      id: 'cl-2',
      type: 'ingestion',
      number: 11,
      timestamp: new Date(now.getTime() - 259200000), // 3 days ago
      author: MOCK_USERS.sarah,
      filesAdded: 45,
      filesRemoved: 1,
      filesModified: 12,
      addedFiles: [
        'src/components/Dashboard/index.tsx',
        'src/components/Dashboard/Metrics.tsx',
        'src/components/Dashboard/Charts.tsx',
      ],
      removedFiles: [
        'src/components/OldDashboard.tsx',
      ],
      modifiedFiles: [
        { path: 'src/App.tsx', linesAdded: 15, linesRemoved: 8 },
        { path: 'src/routes/index.ts', linesAdded: 5, linesRemoved: 2 },
      ],
    },
    {
      id: 'cl-3',
      type: 'enrichment',
      timestamp: new Date(now.getTime() - 345600000), // 4 days ago
      author: 'System',
      description: 'Knowledge Graph rebuilt',
      filesAdded: 156, // repurposed for entities
      filesModified: 423, // repurposed for relationships
    },
    {
      id: 'cl-4',
      type: 'config',
      timestamp: new Date(now.getTime() - 518400000), // 6 days ago
      author: MOCK_USERS.you,
      description: 'Updated compression settings: ratio increased to 85%',
    },
    {
      id: 'cl-5',
      type: 'access',
      timestamp: new Date(now.getTime() - 604800000), // 7 days ago
      author: MOCK_USERS.you,
      description: 'Added Sarah Chen as Admin',
    },
    {
      id: 'cl-6',
      type: 'ingestion',
      number: 10,
      timestamp: new Date(now.getTime() - 864000000), // 10 days ago
      author: MOCK_USERS.mike,
      filesAdded: 23,
      filesRemoved: 0,
      filesModified: 8,
      addedFiles: [
        'src/hooks/useAuth.ts',
        'src/hooks/useApi.ts',
        'src/hooks/useStorage.ts',
      ],
      removedFiles: [],
      modifiedFiles: [
        { path: 'src/index.tsx', linesAdded: 10, linesRemoved: 3 },
      ],
    },
    {
      id: 'cl-7',
      type: 'enrichment',
      timestamp: new Date(now.getTime() - 1209600000), // 14 days ago
      author: 'System',
      description: 'LSP index updated',
      filesAdded: 89, // symbols indexed
      filesModified: 234, // files processed
    },
    {
      id: 'cl-8',
      type: 'ingestion',
      number: 9,
      timestamp: new Date(now.getTime() - 1728000000), // 20 days ago
      author: MOCK_USERS.sarah,
      filesAdded: 67,
      filesRemoved: 12,
      filesModified: 34,
      addedFiles: [
        'src/services/api.ts',
        'src/services/auth.ts',
      ],
      removedFiles: [
        'src/old-services/legacy-api.ts',
      ],
      modifiedFiles: [
        { path: 'package.json', linesAdded: 5, linesRemoved: 2 },
      ],
    },
    {
      id: 'cl-9',
      type: 'access',
      timestamp: new Date(now.getTime() - 2592000000), // 30 days ago
      author: MOCK_USERS.you,
      description: 'Added Mike Johnson as Editor',
    },
    {
      id: 'cl-10',
      type: 'config',
      timestamp: new Date(now.getTime() - 5184000000), // 60 days ago
      author: MOCK_USERS.sarah,
      description: 'Enabled ChromaCode embeddings with 1536 dimensions',
    },
    {
      id: 'cl-11',
      type: 'ingestion',
      number: 8,
      timestamp: new Date(now.getTime() - 6048000000), // 70 days ago
      author: MOCK_USERS.you,
      filesAdded: 156,
      filesRemoved: 23,
      filesModified: 89,
      addedFiles: [
        'src/components/Modal/index.tsx',
        'src/components/Button/index.tsx',
      ],
      removedFiles: [],
      modifiedFiles: [
        { path: 'src/styles/globals.css', linesAdded: 120, linesRemoved: 45 },
      ],
    },
  ];
}

export interface UseChangelogOptions {
  type?: ChangelogEntryType | 'all';
  time?: TimeRange;
  limit?: number;
}

export interface UseChangelogReturn {
  entries: ChangelogEntry[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

function getTimeRangeMs(time: TimeRange): number {
  switch (time) {
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return 90 * 24 * 60 * 60 * 1000;
    case 'all':
    default:
      return Infinity;
  }
}

export function useChangelog(
  contextId: string,
  options: UseChangelogOptions = {}
): UseChangelogReturn {
  const { type = 'all', time = '30d', limit = 10 } = options;

  const [allEntries] = useState<ChangelogEntry[]>(() => generateMockChangelog());
  const [displayCount, setDisplayCount] = useState(limit);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // Simulate initial loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [contextId, type, time]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(limit);
  }, [type, time, limit]);

  // Filter entries based on type and time
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const timeRange = getTimeRangeMs(time);

    return allEntries.filter((entry) => {
      // Type filter
      if (type !== 'all' && entry.type !== type) {
        return false;
      }

      // Time filter
      const entryTime = entry.timestamp.getTime();
      if (now - entryTime > timeRange) {
        return false;
      }

      return true;
    });
  }, [allEntries, type, time]);

  // Paginated entries
  const entries = useMemo(() => {
    return filteredEntries.slice(0, displayCount);
  }, [filteredEntries, displayCount]);

  const hasMore = displayCount < filteredEntries.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + limit, filteredEntries.length));
  }, [limit, filteredEntries.length]);

  // Refetch (in real implementation, this would re-fetch from API)
  const refetch = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    entries,
    isLoading,
    error,
    loadMore,
    hasMore,
    totalCount: filteredEntries.length,
    refetch,
  };
}
