import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, X, Check, Pencil } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface ProjectHeaderProps {
  projectName: string;
  onNameChange?: (newName: string) => void;
  isLive?: boolean;
  className?: string;
}

export function ProjectHeader({
  projectName,
  onNameChange,
  isLive = true,
  className,
}: ProjectHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when projectName changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(projectName);
    }
  }, [projectName, isEditing]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(projectName);
  }, [projectName]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== projectName) {
      onNameChange?.(trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, projectName, onNameChange]);

  const handleCancel = useCallback(() => {
    setEditValue(projectName);
    setIsEditing(false);
  }, [projectName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-[#1e293b] shrink-0',
        className
      )}
    >
      {/* Left side: Project name with icon */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-blue-400" />
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className={cn(
                'flex-1 min-w-0 bg-white/5 border border-white/20 rounded-md',
                'px-3 py-1.5 text-lg font-semibold text-white',
                'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                'transition-colors duration-150'
              )}
              aria-label="Edit project name"
            />
            <button
              onClick={handleSave}
              className={cn(
                'p-1.5 rounded-md',
                'text-green-400 hover:text-green-300 hover:bg-green-500/10',
                'transition-colors duration-150'
              )}
              aria-label="Save name"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className={cn(
                'p-1.5 rounded-md',
                'text-gray-400 hover:text-gray-300 hover:bg-white/5',
                'transition-colors duration-150'
              )}
              aria-label="Cancel edit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartEdit}
            className={cn(
              'group flex items-center gap-2 min-w-0',
              'hover:bg-white/5 rounded-md px-2 py-1 -mx-2 -my-1',
              'transition-colors duration-150'
            )}
            aria-label="Click to edit project name"
          >
            <h1 className="text-lg font-semibold text-white truncate">
              {projectName}
            </h1>
            <Pencil
              className={cn(
                'w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100',
                'transition-opacity duration-150'
              )}
            />
          </button>
        )}
      </div>

      {/* Right side: Status indicator and close button */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Live status indicator */}
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-400">Live</span>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className={cn(
            'p-2 rounded-lg',
            'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-150'
          )}
          aria-label="Close and return to projects"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
