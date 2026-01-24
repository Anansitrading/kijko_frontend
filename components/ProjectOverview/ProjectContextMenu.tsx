import { useEffect, useRef } from 'react';
import { FolderOpen, Pencil, Share2, Users, Trash2 } from 'lucide-react';
import { Project } from '../../types';

interface ProjectContextMenuProps {
  project: Project;
  x: number;
  y: number;
  onClose: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onUsers?: () => void;
  onRename?: () => void;
  onShare?: () => void;
}

export function ProjectContextMenu({
  project,
  x,
  y,
  onClose,
  onOpen,
  onDelete,
  onUsers,
  onRename,
  onShare,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Adjust position to keep menu within viewport
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 200),
    y: Math.min(y, window.innerHeight - 200),
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
      icon: Users,
      label: 'Users',
      onClick: () => {
        onUsers?.();
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
      className="fixed z-50 w-48 bg-card border border-border rounded-lg shadow-xl py-1"
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
      <div className="py-1">
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
    </div>
  );
}
