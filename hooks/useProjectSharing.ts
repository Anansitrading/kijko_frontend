// Project Sharing Hook
// Manages project users with Supabase real-time subscriptions

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ProjectUser,
  UserSearchResult,
  RealtimeChannel,
  fetchProjectUsers,
  addProjectUser,
  updateProjectUserRole,
  removeProjectUser,
  searchUsers,
  subscribeToProjectUsers,
  formatTimeAgo,
  getSupabaseClient,
} from '../services/supabase';

export interface ProjectUserWithTime extends ProjectUser {
  timeAgo: string;
}

export interface UseProjectSharingReturn {
  users: ProjectUserWithTime[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  addUser: (email: string, name: string, role: ProjectUser['role']) => Promise<void>;
  updateRole: (userId: string, newRole: ProjectUser['role']) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  isUpdating: boolean;
  refresh: () => Promise<void>;
}

export function useProjectSharing(projectId: string): UseProjectSharingReturn {
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users on mount and when projectId changes
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectUsers(projectId);
      setUsers(data);
    } catch (err) {
      setError('Failed to load project users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const supabase = getSupabaseClient();
    if (supabase) {
      channelRef.current = subscribeToProjectUsers(
        projectId,
        // On insert
        (newUser) => {
          setUsers((prev) => {
            // Avoid duplicates
            if (prev.some((u) => u.id === newUser.id)) return prev;
            return [...prev, newUser];
          });
        },
        // On update
        (updatedUser) => {
          setUsers((prev) =>
            prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
          );
        },
        // On delete
        (deletedId) => {
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
        }
      );
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [projectId, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        // Filter out users already in the project
        const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
        const filteredResults = results.filter(
          (r) => !existingEmails.has(r.email.toLowerCase())
        );
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, users]);

  // Add user
  const addUser = useCallback(
    async (email: string, name: string, role: ProjectUser['role']) => {
      setIsUpdating(true);
      setError(null);
      try {
        const newUser = await addProjectUser(
          projectId,
          email,
          name,
          role,
          'current-user' // TODO: Get from auth context
        );
        // Optimistic update (real-time will also add it, but this gives immediate feedback)
        setUsers((prev) => {
          if (prev.some((u) => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
        setSearchQuery('');
        setSearchResults([]);
      } catch (err) {
        setError('Failed to add user');
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [projectId]
  );

  // Update role
  const updateRole = useCallback(
    async (userId: string, newRole: ProjectUser['role']) => {
      setIsUpdating(true);
      setError(null);
      try {
        await updateProjectUserRole(userId, newRole);
        // Optimistic update
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } catch (err) {
        setError('Failed to update role');
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Remove user
  const removeUserById = useCallback(async (userId: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await removeProjectUser(userId);
      // Optimistic update
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError('Failed to remove user');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Add timeAgo to users
  const usersWithTime: ProjectUserWithTime[] = users.map((u) => ({
    ...u,
    timeAgo: formatTimeAgo(u.added_at),
  }));

  return {
    users: usersWithTime,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    addUser,
    updateRole,
    removeUser: removeUserById,
    isUpdating,
    refresh: fetchUsers,
  };
}

// Export for context menu usage - lighter version that just fetches users
export function useProjectUsers(projectId: string | null) {
  const [users, setUsers] = useState<ProjectUserWithTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    fetchProjectUsers(projectId)
      .then((data) => {
        setUsers(data.map((u) => ({ ...u, timeAgo: formatTimeAgo(u.added_at) })));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // Set up real-time subscription
    const supabase = getSupabaseClient();
    if (supabase) {
      channelRef.current = subscribeToProjectUsers(
        projectId,
        (newUser) => {
          setUsers((prev) => {
            if (prev.some((u) => u.id === newUser.id)) return prev;
            return [...prev, { ...newUser, timeAgo: formatTimeAgo(newUser.added_at) }];
          });
        },
        (updatedUser) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === updatedUser.id
                ? { ...updatedUser, timeAgo: formatTimeAgo(updatedUser.added_at) }
                : u
            )
          );
        },
        (deletedId) => {
          setUsers((prev) => prev.filter((u) => u.id !== deletedId));
        }
      );
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [projectId]);

  return { users, isLoading, userCount: users.length };
}
