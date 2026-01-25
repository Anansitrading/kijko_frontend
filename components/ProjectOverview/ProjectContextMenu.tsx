import { useEffect, useRef, useState } from 'react';
import { Trash2, Settings2, FileInput, UserPlus } from 'lucide-react';
import { Project } from '../../types';
import { FolderSettingsPanel } from './FolderSettingsPanel';

interface ProjectContextMenuProps {
  project: Project;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onShare?: () => void;
  onConfigureIngestion?: () => void;
  onUpdateProject?: (updates: Partial<Project>) => void;
}

export function ProjectContextMenu({
  project,
  x,
  y,
  onClose,
  onDelete,
  onShare,
  onConfigureIngestion,
  onUpdateProject,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const folderSettingsRef = useRef<HTMLDivElement>(null);
  const [showFolderSettings, setShowFolderSettings] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideMenu = menuRef.current?.contains(target);
      const isInsideFolderSettings = folderSettingsRef.current?.contains(target);

      if (!isInsideMenu && !isInsideFolderSettings) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFolderSettings) {
          setShowFolderSettings(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, showFolderSettings]);

  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 280),
    y: Math.min(y, window.innerHeight - 250),
  };

  const menuItems = [
    {
      icon: Settings2,
      label: 'Project settings',
      onClick: () => {
        setShowFolderSettings(true);
      },
    },
    {
      icon: FileInput,
      label: 'New ingestion',
      onClick: () => {
        onConfigureIngestion?.();
        onClose();
      },
    },
    {
      icon: UserPlus,
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

  const handleFolderSettingsSave = (updates: Partial<Project>) => {
    onUpdateProject?.(updates);
    setShowFolderSettings(false);
  };

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
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

      {/* Folder Settings Panel - Flyout */}
      {showFolderSettings && (
        <div ref={folderSettingsRef}>
          <FolderSettingsPanel
            project={project}
            position={{ x: adjustedPosition.x + 280, y: adjustedPosition.y }}
            onClose={() => setShowFolderSettings(false)}
            onSave={handleFolderSettingsSave}
          />
        </div>
      )}
    </>
  );
}
