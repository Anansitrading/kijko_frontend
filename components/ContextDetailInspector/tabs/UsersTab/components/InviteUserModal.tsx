import { useState, useRef, useEffect } from 'react';
import { X, Mail, UserPlus, Crown, Shield, Edit, Eye, ChevronDown, Check, Loader2 } from 'lucide-react';
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

const ROLE_ORDER: UserRole[] = ['admin', 'editor', 'viewer'];

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => Promise<void>;
}

export function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setEmail('');
      setSelectedRole('viewer');
      setError(null);
      setIsRoleDropdownOpen(false);
    }
  }, [isOpen]);

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
        className="relative w-full max-w-md bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl"
      >
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
            {error && (
              <p className="mt-1.5 text-xs text-red-400">{error}</p>
            )}
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
                    <CurrentIcon className={cn('w-4 h-4', currentConfig.color)} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{currentConfig.label}</p>
                    <p className="text-gray-500 text-xs">{currentConfig.description}</p>
                  </div>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isRoleDropdownOpen && 'rotate-180')} />
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
                          'w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors',
                          isSelected && 'bg-white/5'
                        )}
                      >
                        <div className={cn('p-1.5 rounded', config.bgColor)}>
                          <Icon className={cn('w-4 h-4', config.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{config.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                          </div>
                          <p className="text-gray-500 text-xs">{config.description}</p>
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
