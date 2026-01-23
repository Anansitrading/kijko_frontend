import { useState, useRef, useEffect } from 'react';
import { X, FileCode, GitBranch, Package, Pencil, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ModalHeaderProps, ContextItemType } from '../../types/contextInspector';

interface ExtendedModalHeaderProps extends ModalHeaderProps {
  contextType?: ContextItemType;
  onNameChange?: (newName: string) => void;
}

const TYPE_ICONS: Record<ContextItemType, typeof FileCode> = {
  files: FileCode,
  repo: GitBranch,
  package: Package,
};

export function ModalHeader({ contextName, contextType = 'files', onClose, onNameChange }: ExtendedModalHeaderProps) {
  const Icon = TYPE_ICONS[contextType];
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(contextName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(contextName);
  }, [contextName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== contextName) {
      onNameChange?.(trimmedValue);
    } else {
      setEditValue(contextName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(contextName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-white/10 shrink-0">
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className={cn(
                'text-lg font-semibold text-white bg-white/10 border border-white/20 rounded-md px-2 py-1',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                'max-w-[500px]'
              )}
            />
            <button
              onClick={handleSave}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md',
                'text-green-400 hover:text-green-300 hover:bg-green-500/10',
                'transition-colors duration-150'
              )}
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-white truncate max-w-[500px]"
            >
              {contextName}
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md',
                'text-gray-500 hover:text-gray-300 hover:bg-white/10',
                'opacity-0 group-hover:opacity-100',
                'transition-all duration-150'
              )}
              title="Edit name"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right side: Close button */}
      <button
        onClick={onClose}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'text-gray-400 hover:text-white hover:bg-white/10',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        )}
        title="Close (ESC)"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
