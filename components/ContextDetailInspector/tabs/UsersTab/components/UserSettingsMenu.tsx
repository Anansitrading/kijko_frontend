import { useState, useRef, useEffect } from 'react';
import { MoreVertical, UserMinus, Mail, User } from 'lucide-react';
import { cn } from '../../../../../utils/cn';

interface UserSettingsMenuProps {
  onRemoveAccess: () => void;
  onResendInvite: () => void;
  onViewProfile?: () => void;
  disabled?: boolean;
  isOwner?: boolean;
}

export function UserSettingsMenu({
  onRemoveAccess,
  onResendInvite,
  onViewProfile,
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
        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          {onViewProfile && (
            <button
              onClick={() => {
                onViewProfile();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-300 hover:bg-white/5 transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </button>
          )}
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
