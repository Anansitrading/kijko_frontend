// SkillsCategorySidebar Component - Sidebar with skills list
// Shows flat list of skills with "+ New" button

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { FileEdit, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Skill, SkillCategory } from '../../types/skills';

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 240;

interface SkillsCategorySidebarProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
  loading?: boolean;
  isCreatingDraft?: boolean;
  onSelectDraft?: () => void;
  onCreateNew?: () => void;
  // Category filter state (controlled by parent)
  selectedCategories?: SkillCategory[];
  // Search filter (controlled by parent)
  search?: string;
}

interface SkillItemProps {
  skill: Skill;
  isSelected: boolean;
  onSelect: (skill: Skill) => void;
}

function SkillItem({ skill, isSelected, onSelect }: SkillItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        !skill.isActive && 'opacity-50'
      )}
      onClick={() => onSelect(skill)}
    >
      <span className="flex-1 text-sm truncate">{skill.name}</span>
    </div>
  );
}

function SkillItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-3.5 h-3.5 bg-muted rounded animate-pulse" />
      <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
    </div>
  );
}

export function SkillsCategorySidebar({
  skills,
  selectedSkillId,
  onSelectSkill,
  loading = false,
  isCreatingDraft = false,
  onSelectDraft,
  onCreateNew,
  selectedCategories = [],
  search = '',
}: SkillsCategorySidebarProps) {

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth]
  );

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth.current + delta)
      );
      setSidebarWidth(newWidth);
    };

    const handleResizeEnd = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  const hasActiveFilters = selectedCategories.length > 0 || search.trim().length > 0;

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result = skills;

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter((skill) => selectedCategories.includes(skill.category));
    }

    // Filter by search term
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by star count (most starred first)
    return [...result].sort((a, b) => (b.starCount ?? 0) - (a.starCount ?? 0));
  }, [skills, selectedCategories, search]);

  // Loading state
  if (loading) {
    return (
      <aside className="shrink-0 relative" style={{ width: sidebarWidth }}>
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
        />
        <div className="p-4 border-r border-border h-full overflow-y-auto flex flex-col">
          <div className="mb-4">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-1">
              <SkillItemSkeleton />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // Empty state (no skills at all)
  if (skills.length === 0) {
    return (
      <aside className="shrink-0 relative" style={{ width: sidebarWidth }}>
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
        />
        <div className="p-4 border-r border-border h-full overflow-y-auto flex flex-col">
          <div className="mb-4">
            <button
              onClick={onCreateNew}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={16} />
              <span>New</span>
            </button>
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            My Skills (0)
          </div>
          <p className="text-sm text-muted-foreground text-center py-4">
            No skills yet
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="shrink-0 relative" style={{ width: sidebarWidth }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
      />
      <div className="p-4 border-r border-border h-full overflow-y-auto flex flex-col">
        {/* + New button */}
        <div className="mb-4">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Plus size={16} />
            <span>New</span>
          </button>
        </div>

        {/* Draft/Concept item when creating new skill */}
        {isCreatingDraft && (
          <div className="mb-3">
            <div
              onClick={onSelectDraft}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
                'bg-amber-500/10 text-amber-500 border border-amber-500/30'
              )}
            >
              <FileEdit size={14} className="shrink-0" />
              <span className="flex-1 text-sm font-medium">Concept</span>
              <span className="text-xs opacity-70">draft</span>
            </div>
          </div>
        )}

        {/* Skills list */}
        <div className="flex-1 min-h-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            My Skills ({filteredSkills.length}{hasActiveFilters ? ` of ${skills.length}` : ''})
          </div>
          <div className="flex flex-col gap-0.5">
            {filteredSkills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                isSelected={!isCreatingDraft && selectedSkillId === skill.id}
                onSelect={onSelectSkill}
              />
            ))}
            {filteredSkills.length === 0 && hasActiveFilters && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No skills match {search.trim() ? `"${search}"` : 'filter'}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SkillsCategorySidebar;
