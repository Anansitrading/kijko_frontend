// User Management - User list sub-components

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Clock,
  ChevronDown,
  Check,
  MoreVertical,
  UserMinus,
  Mail,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { UserAccess, UserRole } from './shared';
import { ROLE_CONFIG, ROLE_ORDER, formatLastActive, getInitials } from './shared';

// ============================================
// UserSearch Component
// ============================================

interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserSearch({ value, onChange }: UserSearchProps) {
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

// ============================================
// PermissionDropdown Component
// ============================================

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

// ============================================
// UserSettingsMenu Component
// ============================================

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

// ============================================
// UserCard Component
// ============================================

interface UserCardProps {
  user: UserAccess;
  isCurrentUser: boolean;
  onRoleChange: (role: UserRole) => void;
  onRemove: () => void;
  onResendInvite: () => void;
  disabled?: boolean;
}

export function UserCard({
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
