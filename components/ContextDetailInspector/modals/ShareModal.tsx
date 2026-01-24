// Share Modal Component
// Modal for sharing projects with users via email

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Share2,
  Search,
  Crown,
  Shield,
  Edit,
  Eye,
  ChevronDown,
  Check,
  Loader2,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useProjectSharing, ProjectUserWithTime } from '../../../hooks/useProjectSharing';
import type { ProjectUser } from '../../../services/supabase';

type UserRole = ProjectUser['role'];

const ROLE_CONFIG: Record<
  UserRole,
  { icon: typeof Crown; label: string; description: string; color: string; bgColor: string }
> = {
  owner: {
    icon: Crown,
    label: 'Owner',
    description: 'Full control, can delete project',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'Can manage users and settings',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  editor: {
    icon: Edit,
    label: 'Editor',
    description: 'Can edit and contribute',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
};

const ROLE_ORDER: UserRole[] = ['admin', 'editor', 'viewer'];

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ShareModal({ isOpen, onClose, projectId, projectName }: ShareModalProps) {
  const {
    users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    addUser,
    updateRole,
    removeUser,
    isUpdating,
  } = useProjectSharing(projectId);

  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedRole('viewer');
      setIsRoleDropdownOpen(false);
      setEditingUserId(null);
      setAddError(null);
    }
  }, [isOpen, setSearchQuery]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRoleDropdownOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isRoleDropdownOpen, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleAddUser = async (email: string, name: string) => {
    setAddError(null);
    try {
      await addUser(email, name, selectedRole);
    } catch (err) {
      setAddError('Failed to add user. Please try again.');
    }
  };

  const handleInviteByEmail = async () => {
    if (!searchQuery.trim()) return;

    if (!validateEmail(searchQuery)) {
      setAddError('Please enter a valid email address');
      return;
    }

    // If no search results, invite by email
    const name = searchQuery.split('@')[0];
    await handleAddUser(searchQuery, name);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateRole(userId, newRole);
      setEditingUserId(null);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
    } catch (err) {
      // Error handled in hook
    }
  };

  if (!isOpen) return null;

  const currentConfig = ROLE_CONFIG[selectedRole];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Share Project</h2>
              <p className="text-sm text-gray-400 truncate max-w-[300px]">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Search & Add Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Add people by email
            </label>

            <div className="flex gap-2">
              {/* Email Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAddError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      if (searchResults.length > 0) {
                        handleAddUser(searchResults[0].email, searchResults[0].name);
                      } else if (validateEmail(searchQuery)) {
                        handleInviteByEmail();
                      }
                    }
                  }}
                  placeholder="Search by name or email..."
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg',
                    'text-white text-sm placeholder-gray-500',
                    'focus:outline-none focus:ring-1 transition-colors',
                    addError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-blue-500 focus:ring-blue-500'
                  )}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Role Selector */}
              <div className="relative w-32" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg',
                    'text-left hover:border-white/20 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CurrentIcon className={cn('w-4 h-4', currentConfig.color)} />
                    <span className="text-white text-sm">{currentConfig.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gray-400 transition-transform',
                      isRoleDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                    {ROLE_ORDER.map((role) => {
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
                            'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors',
                            isSelected && 'bg-white/5'
                          )}
                        >
                          <Icon className={cn('w-4 h-4', config.color)} />
                          <span className="text-white text-sm flex-1">{config.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {addError && <p className="text-xs text-red-400">{addError}</p>}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleAddUser(result.email, result.name)}
                    disabled={isUpdating}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-medium text-blue-400">
                      {result.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{result.name}</p>
                      <p className="text-xs text-gray-500 truncate">{result.email}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Invite by email prompt */}
            {searchQuery.trim() &&
              validateEmail(searchQuery) &&
              searchResults.length === 0 &&
              !isSearching && (
                <button
                  onClick={handleInviteByEmail}
                  disabled={isUpdating}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">
                    Invite <span className="font-medium">{searchQuery}</span> as {selectedRole}
                  </span>
                </button>
              )}
          </div>

          {/* Current Users */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Current users ({users.length})
              </label>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-400 text-sm">{error}</div>
            ) : (
              <div className="space-y-1">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isEditing={editingUserId === user.id}
                    onEditStart={() => setEditingUserId(user.id)}
                    onEditEnd={() => setEditingUserId(null)}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemoveUser}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// User Row Component
interface UserRowProps {
  user: ProjectUserWithTime;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onRemove: (userId: string) => void;
  isUpdating: boolean;
}

function UserRow({
  user,
  isEditing,
  onEditStart,
  onEditEnd,
  onRoleChange,
  onRemove,
  isUpdating,
}: UserRowProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = ROLE_CONFIG[user.role];
  const Icon = config.icon;
  const isOwner = user.role === 'owner';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onEditEnd();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, onEditEnd]);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-white truncate">{user.name}</p>
          {isOwner && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/10 text-yellow-400 rounded">
              Owner
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Time */}
      <span className="text-xs text-gray-500 whitespace-nowrap">{user.timeAgo}</span>

      {/* Role Dropdown */}
      {!isOwner && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={onEditStart}
            disabled={isUpdating}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded border transition-colors',
              'border-white/10 hover:border-white/20',
              config.bgColor
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {isEditing && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
              {ROLE_ORDER.map((role) => {
                const roleConfig = ROLE_CONFIG[role];
                const RoleIcon = roleConfig.icon;
                const isSelected = role === user.role;

                return (
                  <button
                    key={role}
                    onClick={() => onRoleChange(user.id, role)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors',
                      isSelected && 'bg-white/5'
                    )}
                  >
                    <RoleIcon className={cn('w-4 h-4', roleConfig.color)} />
                    <span className="text-sm text-white flex-1">{roleConfig.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                );
              })}

              <div className="border-t border-white/10">
                <button
                  onClick={() => onRemove(user.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Remove</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ShareModal;
