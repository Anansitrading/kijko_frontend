import { useEffect, useRef } from 'react';
import { FolderOpen, Pencil, Share2, Trash2, Crown, Shield, Edit, Eye, Loader2 } from 'lucide-react';
import { Project } from '../../types';
import { useProjectUsers, ProjectUserWithTime } from '../../hooks/useProjectSharing';
import { cn } from '../../utils/cn';

interface ProjectContextMenuProps {
  project: Project;
  x: number;
  y: number;
  onClose: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onRename?: () => void;
  onShare?: () => void;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-yellow-400',
  admin: 'text-purple-400',
  editor: 'text-blue-400',
  viewer: 'text-gray-400',
};

export function ProjectContextMenu({
  project,
  x,
  y,
  onClose,
  onOpen,
  onDelete,
  onRename,
  onShare,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { users, isLoading, userCount } = useProjectUsers(project.id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport - account for users list
  const menuHeight = 200 + (users.length * 56); // Base height + user rows
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 280),
    y: Math.min(y, window.innerHeight - Math.min(menuHeight, 500)),
  };

  const menuItems = [
    {
      icon: FolderOpen,
      label: 'Open',
      onClick: onOpen,
    },
    {
      icon: Pencil,
      label: 'Rename',
      onClick: () => {
        onRename?.();
        onClose();
      },
    },
    {
      icon: Share2,
      label: 'Share',
      onClick: () => {
        onShare?.();
        onClose();
      },
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: onDelete,
      destructive: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Project Name Header */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground truncate">{project.name}</p>
      </div>

      {/* Menu Items */}
      <div className="py-1 border-b border-border">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Current Users Section */}
      <div className="py-2">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Current Users ({userCount})
          </span>
          {isLoading && <Loader2 size={12} className="text-muted-foreground animate-spin" />}
        </div>

        <div className="max-h-[220px] overflow-y-auto">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}

// User Row Component for Context Menu
function UserRow({ user }: { user: ProjectUserWithTime }) {
  const RoleIcon = ROLE_ICONS[user.role] || Eye;
  const roleColor = ROLE_COLORS[user.role] || 'text-gray-400';
  const isOwner = user.role === 'owner';

  // Generate initials
  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-3 py-2 flex items-center gap-2.5 hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white shrink-0">
        {initials}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground truncate">{user.name}</span>
          {isOwner && (
            <span className="px-1 py-0.5 text-[9px] font-medium bg-yellow-500/10 text-yellow-400 rounded">
              Owner
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Time & Role */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{user.timeAgo}</span>
        <div className={cn('flex items-center gap-1', roleColor)}>
          <RoleIcon size={12} />
          <span className="text-[10px] font-medium capitalize">{user.role}</span>
        </div>
      </div>
    </div>
  );
}
