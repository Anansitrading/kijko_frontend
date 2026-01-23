import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Crown, ShieldCheck, Shield, Eye, Check } from 'lucide-react';
import type { TeamRole } from '../../../types/settings';
import { TEAM_ROLES } from '../../../types/settings';

interface RoleSelectProps {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  disabled?: boolean;
  disabledRoles?: TeamRole[];
  size?: 'sm' | 'md';
}

// Role icon component
function RoleIcon({ role, className = '' }: { role: TeamRole; className?: string }) {
  switch (role) {
    case 'owner':
      return <Crown className={`text-amber-400 ${className}`} />;
    case 'admin':
      return <ShieldCheck className={`text-blue-400 ${className}`} />;
    case 'member':
      return <Shield className={`text-gray-400 ${className}`} />;
    case 'viewer':
      return <Eye className={`text-gray-500 ${className}`} />;
    default:
      return null;
  }
}

// Role badge colors
function getRoleBadgeClass(role: TeamRole): string {
  switch (role) {
    case 'owner':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30';
    case 'admin':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
    case 'member':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/30';
    case 'viewer':
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30 hover:bg-gray-600/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
  }
}

const ROLE_ORDER: TeamRole[] = ['owner', 'admin', 'member', 'viewer'];

export function RoleSelect({
  value,
  onChange,
  disabled = false,
  disabledRoles = [],
  size = 'md',
}: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (role: TeamRole) => {
    if (role !== value && !disabledRoles.includes(role)) {
      onChange(role);
    }
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 font-medium rounded border transition-colors
          ${sizeClasses}
          ${getRoleBadgeClass(value)}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <RoleIcon role={value} className={iconSize} />
        <span>{TEAM_ROLES[value].label}</span>
        {!disabled && (
          <ChevronDown
            className={`${iconSize} ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 py-1 bg-[#1a1f26] border border-white/10 rounded-lg shadow-xl">
          {ROLE_ORDER.map((role) => {
            const isSelected = role === value;
            const isDisabled = disabledRoles.includes(role);
            const roleConfig = TEAM_ROLES[role];

            return (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                disabled={isDisabled}
                className={`
                  flex items-start gap-3 w-full px-3 py-2.5 text-left transition-colors
                  ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <RoleIcon role={role} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {roleConfig.label}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{roleConfig.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoleSelect;
