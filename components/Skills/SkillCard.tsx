// SkillCard Component - Individual skill card with actions
// Task 2_2: Skills Library UI
// Task 2_4: Skill Detail & Edit - Added onView for detail modal

import { useState, useRef, useEffect } from 'react';
import { Play, Pencil, Trash2, MoreVertical, Zap, Eye, Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORY_COLORS } from '../../hooks/useSkills';
import type { Skill } from '../../types/skills';

interface SkillCardProps {
  skill: Skill;
  onRun: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  onView?: (skill: Skill) => void;
  compact?: boolean;
}

export function SkillCard({ skill, onRun, onEdit, onDelete, onView, compact = false }: SkillCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const categoryColors = CATEGORY_COLORS[skill.category];

  const formatExecutionCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the menu or buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menu"]')) {
      return;
    }
    onView?.(skill);
  };

  // Compact/List view
  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'group relative bg-card/50 border border-border rounded-xl p-4',
          'hover:bg-card hover:border-primary/30',
          'transition-all duration-200',
          !skill.isActive && 'opacity-60',
          onView && 'cursor-pointer'
        )}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg shrink-0">
            <Zap size={20} className="text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{skill.name}</h3>
              {!skill.isActive && (
                <span className="text-xs text-muted-foreground">(Inactive)</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {skill.description || 'No description provided'}
            </p>
          </div>

          {/* Category Badge */}
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-md capitalize shrink-0',
              categoryColors.bg,
              categoryColors.text
            )}
          >
            {skill.category}
          </span>

          {/* Execution Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Play size={12} />
            <span>{formatExecutionCount(skill.executionCount)} runs</span>
          </div>

          {/* Star Count */}
          {(skill.starCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs shrink-0">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-muted-foreground tabular-nums">{skill.starCount}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun(skill);
              }}
              className="p-2 rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              title="Run skill"
            >
              <Play size={16} />
            </button>
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={cn(
                  'p-2 rounded-md text-muted-foreground',
                  'hover:bg-muted hover:text-foreground',
                  'transition-all',
                  isMenuOpen && 'bg-muted text-foreground'
                )}
                aria-label="Skill actions"
              >
                <MoreVertical size={16} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-10 py-1">
                  {onView && (
                    <button
                      onClick={() => {
                        onView(skill);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onEdit(skill);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      onDelete(skill);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative bg-card/50 border border-border rounded-xl p-4',
        'hover:bg-card hover:border-primary/30',
        'transition-all duration-200',
        !skill.isActive && 'opacity-60',
        onView && 'cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon/Emoji */}
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Zap size={20} className="text-primary" />
          </div>

          {/* Name and Status */}
          <div>
            <h3 className="font-medium text-foreground line-clamp-1">{skill.name}</h3>
            {!skill.isActive && (
              <span className="text-xs text-muted-foreground">Inactive</span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-muted hover:text-foreground',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'transition-all',
              isMenuOpen && 'opacity-100 bg-muted text-foreground'
            )}
            aria-label="Skill actions"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-10 py-1">
              {onView && (
                <button
                  onClick={() => {
                    onView(skill);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Eye size={14} />
                  View Details
                </button>
              )}
              <button
                onClick={() => {
                  onRun(skill);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Play size={14} />
                Run
              </button>
              <button
                onClick={() => {
                  onEdit(skill);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil size={14} />
                Edit
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  onDelete(skill);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
        {skill.description || 'No description provided'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Category Badge */}
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-md capitalize',
            categoryColors.bg,
            categoryColors.text
          )}
        >
          {skill.category}
        </span>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* Star Count */}
          {(skill.starCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-muted-foreground tabular-nums">{skill.starCount}</span>
            </div>
          )}

          {/* Execution Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Play size={12} />
            <span>{formatExecutionCount(skill.executionCount)} runs</span>
          </div>
        </div>
      </div>

      {/* Quick Run Button - Shows on hover */}
      <button
        onClick={() => onRun(skill)}
        className={cn(
          'absolute inset-x-4 bottom-4 py-2',
          'flex items-center justify-center gap-2',
          'bg-primary text-primary-foreground text-sm font-medium rounded-lg',
          'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
          'transition-all duration-200',
          'shadow-lg shadow-primary/20'
        )}
      >
        <Play size={14} />
        Run Skill
      </button>
    </div>
  );
}
