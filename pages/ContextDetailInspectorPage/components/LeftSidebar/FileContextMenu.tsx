import { useEffect, useRef } from 'react';
import {
  FolderPlus,
  Archive,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface ContextMenuAction {
  id: 'new-folder' | 'compress' | 'rename' | 'delete';
  label: string;
  icon: typeof FolderPlus;
  shortcut?: string;
  danger?: boolean;
}

const CONTEXT_MENU_ACTIONS: ContextMenuAction[] = [
  { id: 'new-folder', label: 'New Folder...', icon: FolderPlus, shortcut: 'Ctrl+Shift+N' },
  { id: 'compress', label: 'Compress', icon: Archive },
  { id: 'rename', label: 'Rename', icon: Pencil, shortcut: 'F2' },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Del', danger: true },
];

interface FileContextMenuProps {
  x: number;
  y: number;
  fileId?: string;
  isFolder?: boolean;
  onAction: (action: ContextMenuAction['id'], fileId?: string) => void;
  onClose: () => void;
}

export function FileContextMenu({
  x,
  y,
  fileId,
  isFolder,
  onAction,
  onClose,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const handleAction = (actionId: ContextMenuAction['id']) => {
    onAction(actionId, fileId);
    onClose();
  };

  // Filter actions based on context
  const availableActions = CONTEXT_MENU_ACTIONS.filter((action) => {
    // If no file is selected (right-click on empty space), only show new folder
    if (!fileId) {
      return action.id === 'new-folder';
    }
    return true;
  });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {availableActions.map((action, index) => {
        const Icon = action.icon;
        const showDivider =
          index > 0 &&
          (action.id === 'compress' || action.id === 'delete');

        return (
          <div key={action.id}>
            {showDivider && (
              <div className="my-1 border-t border-slate-700" />
            )}
            <button
              onClick={() => handleAction(action.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                action.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-slate-300 hover:bg-slate-700'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1 text-left">{action.label}</span>
              {action.shortcut && (
                <span className="text-xs text-slate-500">{action.shortcut}</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default FileContextMenu;
