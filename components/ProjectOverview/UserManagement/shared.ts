// User Management - Shared types, configs, mock data, and utility functions

import {
  Eye,
  MessageSquare,
  Database,
  Shield,
  Settings,
  Crown,
  Edit,
} from 'lucide-react';
import type {
  UserAccess,
  UserRole,
  ActivityEvent,
  ActivityEventType,
  TimeRange,
} from '../../../types/contextInspector';
import type { Project } from '../../../types';

// Re-export types used by consumers
export type { UserAccess, UserRole, ActivityEvent, ActivityEventType, TimeRange };
export type { Project };

// ============================================
// Types
// ============================================

export interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

// ============================================
// Role Configuration
// ============================================

export const ROLE_CONFIG: Record<
  UserRole,
  {
    icon: typeof Crown;
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  owner: {
    icon: Crown,
    label: 'Owner',
    description: 'Full control, can delete, manage users',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'Can ingest, configure, view all activity',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  editor: {
    icon: Edit,
    label: 'Editor',
    description: 'Can chat, view, suggest changes',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access, can chat',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
};

export const ROLE_ORDER: UserRole[] = ['owner', 'admin', 'editor', 'viewer'];

// ============================================
// Activity Event Configuration
// ============================================

export const EVENT_CONFIG: Record<
  ActivityEventType,
  { icon: typeof Eye; color: string; bgColor: string; label: string }
> = {
  view: {
    icon: Eye,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'View',
  },
  chat: {
    icon: MessageSquare,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    label: 'Chat',
  },
  ingestion: {
    icon: Database,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Ingestion',
  },
  permission: {
    icon: Shield,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    label: 'Permission',
  },
  config: {
    icon: Settings,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    label: 'Config',
  },
};

// ============================================
// Mock Data (Replace with Supabase integration)
// ============================================

export const MOCK_USERS: UserAccess[] = [
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
    lastActive: new Date(Date.now() - 42 * 60 * 1000),
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

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: '1',
    type: 'view',
    user: MOCK_USERS[0],
    description: 'viewed /src/core/client.ts',
    timestamp: new Date(Date.now() - 14 * 60 * 1000),
  },
  {
    id: '2',
    type: 'chat',
    user: MOCK_USERS[1],
    description: 'asked about authentication flow',
    timestamp: new Date(Date.now() - 27 * 60 * 1000),
  },
  {
    id: '3',
    type: 'ingestion',
    user: MOCK_USERS[0],
    description: 'triggered re-ingestion of 12 files',
    timestamp: new Date(Date.now() - 57 * 60 * 1000),
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
];

// ============================================
// Utility Functions
// ============================================

export function formatLastActive(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getTimeRangeMs(range: TimeRange): number {
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
