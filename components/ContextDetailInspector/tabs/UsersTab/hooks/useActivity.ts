import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ActivityEvent, ActivityEventType, TimeRange, UserAccess } from '../../../../../types/contextInspector';

// Mock activity data
const MOCK_USERS: UserAccess[] = [
  { id: '1', name: 'You', email: 'user@kijko.ai', role: 'owner', lastActive: new Date() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', lastActive: new Date() },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'editor', lastActive: new Date() },
];

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: '1',
    type: 'view',
    user: MOCK_USERS[0],
    description: 'viewed /src/core/client.ts',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '2',
    type: 'chat',
    user: MOCK_USERS[1],
    description: 'asked about authentication flow',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '3',
    type: 'ingestion',
    user: MOCK_USERS[0],
    description: 'triggered re-ingestion of 12 files',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: '4',
    type: 'permission',
    user: MOCK_USERS[0],
    description: 'changed Bob Johnson from viewer to editor',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'config',
    user: MOCK_USERS[1],
    description: 'updated compression settings',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '6',
    type: 'view',
    user: MOCK_USERS[2],
    description: 'viewed /src/utils/helpers.ts',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: '7',
    type: 'chat',
    user: MOCK_USERS[2],
    description: 'asked about API endpoints',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '8',
    type: 'ingestion',
    user: MOCK_USERS[1],
    description: 'added new documentation files',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: '9',
    type: 'view',
    user: MOCK_USERS[0],
    description: 'viewed /README.md',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: '10',
    type: 'permission',
    user: MOCK_USERS[0],
    description: 'invited Alice Brown as viewer',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export interface UseActivityReturn {
  activities: ActivityEvent[];
  isLoading: boolean;
  error: string | null;
  typeFilter: ActivityEventType | 'all';
  setTypeFilter: (type: ActivityEventType | 'all') => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredActivities: ActivityEvent[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

function getTimeRangeMs(range: TimeRange): number {
  switch (range) {
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return 90 * 24 * 60 * 60 * 1000;
    case 'all':
      return Infinity;
  }
}

export function useActivity(contextId: string): UseActivityReturn {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ActivityEventType | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch activities on mount
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 400));
        setActivities(MOCK_ACTIVITY);
      } catch (err) {
        setError('Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, [contextId]);

  // Filter activities by type and time range
  const filteredActivities = useMemo(() => {
    const now = Date.now();
    const rangeMs = getTimeRangeMs(timeRange);

    return activities.filter((activity) => {
      // Type filter
      if (typeFilter !== 'all' && activity.type !== typeFilter) {
        return false;
      }
      // Time range filter
      if (rangeMs !== Infinity) {
        const activityTime = activity.timestamp.getTime();
        if (now - activityTime > rangeMs) {
          return false;
        }
      }
      return true;
    });
  }, [activities, typeFilter, timeRange]);

  // Paginated activities
  const displayedActivities = filteredActivities.slice(0, displayCount);
  const hasMore = displayCount < filteredActivities.length;

  // Load more activities
  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDisplayCount((prev) => Math.min(prev + 5, filteredActivities.length));
    setIsLoadingMore(false);
  }, [filteredActivities.length]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(5);
  }, [typeFilter, timeRange]);

  return {
    activities,
    isLoading,
    error,
    typeFilter,
    setTypeFilter,
    timeRange,
    setTimeRange,
    filteredActivities: displayedActivities,
    hasMore,
    loadMore,
    isLoadingMore,
  };
}
