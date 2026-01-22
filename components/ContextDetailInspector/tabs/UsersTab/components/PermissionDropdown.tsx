import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Crown, Shield, Edit, Eye, Check } from 'lucide-react';
import { cn } from '../../../../../utils/cn';
import type { UserRole } from '../../../../../types/contextInspector';

const ROLE_CONFIG: Record<UserRole, { icon: typeof Crown; label: string; description: string; color: string; bgColor: string }> = {
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

interface PermissionDropdownProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  disabled?: boolean;
  isCurrentUser?: boolean;
}

export function PermissionDropdown({
  currentRole,
  onRoleChange,
  disabled = false,
  isCurrentUser = false,
}: PermissionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const currentConfig = ROLE_CONFIG[currentRole];
  const CurrentIcon = currentConfig.icon;

  const handleSelect = (role: UserRole) => {
    if (role !== currentRole) {
      onRoleChange(role);
    }
    setIsOpen(false);
  };

  // Owner can't change their own role
  const isDisabled = disabled || isCurrentUser;

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
        {!isDisabled && <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
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
                    <span className="text-white font-medium text-sm">{config.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{config.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
