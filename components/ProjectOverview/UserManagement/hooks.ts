// User Management - Custom hooks

import { useState, useEffect, useCallback } from 'react';
import type {
  UserAccess,
  UserRole,
  ActivityEvent,
  ActivityEventType,
  TimeRange,
} from './shared';
import { MOCK_USERS, MOCK_ACTIVITY, getTimeRangeMs } from './shared';

// ============================================
// Custom Hook: useProjectUsers
// ============================================

export interface UseProjectUsersReturn {
  users: UserAccess[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredUsers: UserAccess[];
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  inviteUser: (email: string, role: UserRole) => Promise<void>;
  isUpdating: boolean;
}

export function useProjectUsers(projectId: string): UseProjectUsersReturn {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with Supabase call
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUsers(MOCK_USERS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [projectId]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      setIsUpdating(true);
      try {
        // TODO: Replace with Supabase call
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const removeUser = useCallback(async (userId: string) => {
    setIsUpdating(true);
    try {
      // TODO: Replace with Supabase call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const inviteUser = useCallback(async (email: string, role: UserRole) => {
    setIsUpdating(true);
    try {
      // TODO: Replace with Supabase call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newUser: UserAccess = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        lastActive: new Date(),
      };
      setUsers((prev) => [...prev, newUser]);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    users,
    isLoading,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    updateUserRole,
    removeUser,
    inviteUser,
    isUpdating,
  };
}

// ============================================
// Custom Hook: useProjectActivity
// ============================================

export interface UseProjectActivityReturn {
  activities: ActivityEvent[];
  isLoading: boolean;
  typeFilter: ActivityEventType | 'all';
  setTypeFilter: (type: ActivityEventType | 'all') => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredActivities: ActivityEvent[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

export function useProjectActivity(projectId: string): UseProjectActivityReturn {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ActivityEventType | 'all'>(
    'all'
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with Supabase call
        await new Promise((resolve) => setTimeout(resolve, 300));
        setActivities(MOCK_ACTIVITY);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, [projectId]);

  const filteredActivities = activities.filter((activity) => {
    const now = Date.now();
    const rangeMs = getTimeRangeMs(timeRange);

    if (typeFilter !== 'all' && activity.type !== typeFilter) {
      return false;
    }

    if (rangeMs !== Infinity) {
      const activityTime = activity.timestamp.getTime();
      if (now - activityTime > rangeMs) {
        return false;
      }
    }

    return true;
  });

  const displayedActivities = filteredActivities.slice(0, displayCount);
  const hasMore = displayCount < filteredActivities.length;

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDisplayCount((prev) => Math.min(prev + 5, filteredActivities.length));
    setIsLoadingMore(false);
  }, [filteredActivities.length]);

  useEffect(() => {
    setDisplayCount(5);
  }, [typeFilter, timeRange]);

  return {
    activities,
    isLoading,
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
