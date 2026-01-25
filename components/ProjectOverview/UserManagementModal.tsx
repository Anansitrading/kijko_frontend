// User Management Modal
// Modal popup for managing project users, triggered from project context menu

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Users,
  UserPlus,
  Search,
  Clock,
  Loader2,
  Eye,
  MessageSquare,
  Database,
  Shield,
  Settings,
  Filter,
  Calendar,
  ChevronDown,
  Crown,
  Edit,
  Check,
  MoreVertical,
  UserMinus,
  Mail,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project } from '../../types';
import type {
  UserAccess,
  UserRole,
  ActivityEvent,
  ActivityEventType,
  TimeRange,
} from '../../types/contextInspector';

// ============================================
// Types
// ============================================

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

// ============================================
// Role Configuration
// ============================================

const ROLE_CONFIG: Record<
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

const ROLE_ORDER: UserRole[] = ['owner', 'admin', 'editor', 'viewer'];

// ============================================
// Activity Event Configuration
// ============================================

const EVENT_CONFIG: Record<
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

const MOCK_ACTIVITY: ActivityEvent[] = [
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

function formatLastActive(date: Date): string {
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

function formatTimestamp(date: Date): string {
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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

// ============================================
// Custom Hook: useProjectUsers
// ============================================

interface UseProjectUsersReturn {
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

function useProjectUsers(projectId: string): UseProjectUsersReturn {
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

interface UseProjectActivityReturn {
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

function useProjectActivity(projectId: string): UseProjectActivityReturn {
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

// ============================================
// Sub-components
// ============================================

// User Search Component
interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function UserSearch({ value, onChange }: UserSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search users..."
        className={cn(
          'w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg',
          'text-white text-sm placeholder-gray-500',
          'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          'transition-colors duration-150'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

// Permission Dropdown Component
interface PermissionDropdownProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  disabled?: boolean;
  isCurrentUser?: boolean;
}

function PermissionDropdown({
  currentRole,
  onRoleChange,
  disabled = false,
  isCurrentUser = false,
}: PermissionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentConfig = ROLE_CONFIG[currentRole];
  const CurrentIcon = currentConfig.icon;
  const isDisabled = disabled || isCurrentUser;

  const handleSelect = (role: UserRole) => {
    if (role !== currentRole) {
      onRoleChange(role);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors text-sm',
          isDisabled
            ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
            : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300 cursor-pointer'
        )}
      >
        <CurrentIcon className={cn('w-3.5 h-3.5', currentConfig.color)} />
        <span className="capitalize">{currentConfig.label}</span>
        {!isDisabled && (
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-[60] overflow-hidden">
          {ROLE_ORDER.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            const isSelected = role === currentRole;

            return (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition-colors',
                  isSelected && 'bg-white/5'
                )}
              >
                <div className={cn('p-1.5 rounded', config.bgColor)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      {config.label}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {config.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// User Settings Menu Component
interface UserSettingsMenuProps {
  onRemoveAccess: () => void;
  onResendInvite: () => void;
  disabled?: boolean;
  isOwner?: boolean;
}

function UserSettingsMenu({
  onRemoveAccess,
  onResendInvite,
  disabled = false,
  isOwner = false,
}: UserSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (isOwner) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          disabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-[60] overflow-hidden">
          <button
            onClick={() => {
              onResendInvite();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-300 hover:bg-white/5 transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Resend Invite</span>
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={() => {
              onRemoveAccess();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            <UserMinus className="w-4 h-4" />
            <span>Remove Access</span>
          </button>
        </div>
      )}
    </div>
  );
}

// User Card Component
interface UserCardProps {
  user: UserAccess;
  isCurrentUser: boolean;
  onRoleChange: (role: UserRole) => void;
  onRemove: () => void;
  onResendInvite: () => void;
  disabled?: boolean;
}

function UserCard({
  user,
  isCurrentUser,
  onRoleChange,
  onRemove,
  onResendInvite,
  disabled,
}: UserCardProps) {
  const isOnline = Date.now() - user.lastActive.getTime() < 10 * 60 * 1000;

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {getInitials(user.name)}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f1419]" />
          )}
        </div>
        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{user.name}</p>
            {isCurrentUser && (
              <span className="text-xs text-gray-500">(You)</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Last Active */}
        <div className="hidden sm:flex items-center gap-1 text-gray-500 text-sm">
          <Clock className="w-3 h-3" />
          <span>{formatLastActive(user.lastActive)}</span>
        </div>
        {/* Permission Dropdown */}
        <PermissionDropdown
          currentRole={user.role}
          onRoleChange={onRoleChange}
          disabled={disabled}
          isCurrentUser={isCurrentUser}
        />
        {/* Settings Menu */}
        <UserSettingsMenu
          onRemoveAccess={onRemove}
          onResendInvite={onResendInvite}
          disabled={disabled}
          isOwner={isCurrentUser}
        />
      </div>
    </div>
  );
}

// Activity Filter Component
const TYPE_OPTIONS: {
  value: ActivityEventType | 'all';
  label: string;
  icon: typeof Eye;
}[] = [
  { value: 'all', label: 'All Activity', icon: Filter },
  { value: 'view', label: 'Views', icon: Eye },
  { value: 'chat', label: 'Chats', icon: MessageSquare },
  { value: 'ingestion', label: 'Ingestions', icon: Database },
  { value: 'permission', label: 'Permissions', icon: Shield },
  { value: 'config', label: 'Config Changes', icon: Settings },
];

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

interface FilterDropdownProps {
  value: string;
  options: { value: string; label: string; icon?: typeof Eye }[];
  onChange: (value: string) => void;
  icon?: typeof Eye;
}

function FilterDropdown({
  value,
  options,
  onChange,
  icon: ButtonIcon,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors text-sm',
          'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
        )}
      >
        {ButtonIcon && <ButtonIcon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="hidden sm:inline">{selectedOption?.label}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-[60] overflow-hidden">
          {options.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-sm',
                  option.value === value ? 'text-white bg-white/5' : 'text-gray-400'
                )}
              >
                {OptionIcon && <OptionIcon className="w-3.5 h-3.5" />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ActivityFilterProps {
  typeFilter: ActivityEventType | 'all';
  onTypeFilterChange: (type: ActivityEventType | 'all') => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

function ActivityFilter({
  typeFilter,
  onTypeFilterChange,
  timeRange,
  onTimeRangeChange,
}: ActivityFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <FilterDropdown
        value={typeFilter}
        options={TYPE_OPTIONS}
        onChange={(v) => onTypeFilterChange(v as ActivityEventType | 'all')}
        icon={Filter}
      />
      <FilterDropdown
        value={timeRange}
        options={TIME_OPTIONS}
        onChange={(v) => onTimeRangeChange(v as TimeRange)}
        icon={Calendar}
      />
    </div>
  );
}

// Activity Event Component
interface ActivityEventComponentProps {
  event: ActivityEvent;
}

function ActivityEventComponent({ event }: ActivityEventComponentProps) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
      <div className={cn('p-2 rounded-lg shrink-0', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          <span className="font-medium">{event.user.name}</span>{' '}
          <span className="text-gray-400">{event.description}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// Permission Info Component
function PermissionInfo() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-400" />
        <h4 className="text-sm font-medium text-white">Permission Levels</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLE_ORDER.map((role) => {
          const { icon: Icon, label, description, color } = ROLE_CONFIG[role];
          return (
            <div key={role} className="flex items-center gap-2 text-sm">
              <Icon className={cn('w-4 h-4 shrink-0', color)} />
              <span className="text-gray-300">
                <span className="font-medium">{label}:</span>{' '}
                <span className="text-gray-500 text-xs">{description}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Invite User Modal Component
interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => Promise<void>;
}

function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setSelectedRole('viewer');
      setError(null);
      setIsRoleDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(email, selectedRole);
      onClose();
    } catch (err) {
      setError('Failed to send invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentConfig = ROLE_CONFIG[selectedRole];
  const CurrentIcon = currentConfig.icon;
  const ROLE_ORDER_NO_OWNER: UserRole[] = ['admin', 'editor', 'viewer'];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Invite User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="user@example.com"
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg',
                  'text-white text-sm placeholder-gray-500',
                  'focus:outline-none focus:ring-1 transition-colors',
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                )}
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permission Level
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg',
                  'text-left hover:border-white/20 transition-colors'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded', currentConfig.bgColor)}>
                    <CurrentIcon
                      className={cn('w-4 h-4', currentConfig.color)}
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {currentConfig.label}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {currentConfig.description}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform',
                    isRoleDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-[80] overflow-hidden">
                  {ROLE_ORDER_NO_OWNER.map((role) => {
                    const config = ROLE_CONFIG[role];
                    const Icon = config.icon;
                    const isSelected = role === selectedRole;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors',
                          isSelected && 'bg-white/5'
                        )}
                      >
                        <div className={cn('p-1.5 rounded', config.bgColor)}>
                          <Icon className={cn('w-4 h-4', config.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">
                              {config.label}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            )}
                          </div>
                          <p className="text-gray-500 text-xs">
                            {config.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isLoading || !email.trim()
                  ? 'bg-blue-500/50 text-blue-200 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Invite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-white/5 rounded-lg w-full" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

type ModalTab = 'users' | 'activity';

export function UserManagementModal({
  isOpen,
  onClose,
  project,
}: UserManagementModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('users');

  const {
    filteredUsers,
    isLoading: usersLoading,
    searchQuery,
    setSearchQuery,
    updateUserRole,
    removeUser,
    inviteUser,
    isUpdating,
  } = useProjectUsers(project.id);

  const {
    filteredActivities,
    isLoading: activityLoading,
    typeFilter,
    setTypeFilter,
    timeRange,
    setTimeRange,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useProjectActivity(project.id);

  // Current user is the first owner (for demo purposes)
  const currentUserId = filteredUsers.find((u) => u.role === 'owner')?.id;

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isInviteModalOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isInviteModalOpen]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isInviteModalOpen) {
        onClose();
      }
    },
    [onClose, isInviteModalOpen]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-management-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2
                id="user-management-title"
                className="text-lg font-semibold text-white"
              >
                Manage Users
              </h2>
              <p className="text-sm text-gray-500">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'users'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'activity'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <Clock className="w-4 h-4" />
            Activity Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'users' && (
            <>
              {usersLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <UserSearch value={searchQuery} onChange={setSearchQuery} />

                  {/* User List */}
                  {filteredUsers.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {searchQuery
                          ? 'No users match your search'
                          : 'No users yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          isCurrentUser={user.id === currentUserId}
                          onRoleChange={(role) => updateUserRole(user.id, role)}
                          onRemove={() => removeUser(user.id)}
                          onResendInvite={() => {
                            /* TODO: Implement resend */
                          }}
                          disabled={isUpdating}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {activityLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex justify-end">
                    <ActivityFilter
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                    />
                  </div>

                  {/* Activity List */}
                  {filteredActivities.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                      <p className="text-gray-400">
                        No activity for the selected filters
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {filteredActivities.map((event) => (
                          <ActivityEventComponent key={event.id} event={event} />
                        ))}
                      </div>
                      {hasMore && (
                        <button
                          onClick={loadMore}
                          disabled={isLoadingMore}
                          className="w-full mt-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <span>Load More</span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteUser}
      />
    </div>
  );
}

export default UserManagementModal;
