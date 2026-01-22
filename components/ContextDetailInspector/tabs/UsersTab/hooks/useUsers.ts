import { useState, useCallback, useEffect } from 'react';
import type { UserAccess, UserRole } from '../../../../../types/contextInspector';

// Mock users data
const MOCK_USERS: UserAccess[] = [
  {
    id: '1',
    name: 'You',
    email: 'user@kijko.ai',
    role: 'owner',
    lastActive: new Date(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'editor',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'viewer',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export interface UseUsersReturn {
  users: UserAccess[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredUsers: UserAccess[];
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  inviteUser: (email: string, role: UserRole) => Promise<void>;
  resendInvite: (userId: string) => Promise<void>;
  isUpdating: boolean;
}

export function useUsers(contextId: string): UseUsersReturn {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 400));
        setUsers(MOCK_USERS);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [contextId]);

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Update user role
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      setError('Failed to update user role');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Remove user
  const removeUser = useCallback(async (userId: string) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      setError('Failed to remove user');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Invite user
  const inviteUser = useCallback(async (email: string, role: UserRole) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newUser: UserAccess = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        lastActive: new Date(),
      };
      setUsers((prev) => [...prev, newUser]);
    } catch (err) {
      setError('Failed to invite user');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Resend invite
  const resendInvite = useCallback(async (userId: string) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      // In real implementation, this would resend the invite email
    } catch (err) {
      setError('Failed to resend invite');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    updateUserRole,
    removeUser,
    inviteUser,
    resendInvite,
    isUpdating,
  };
}
