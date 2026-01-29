// SkillsCategorySidebar Component - Sidebar with skills list
// Shows flat list of skills with "+ New" button

import { useMemo } from 'react';
import { FileEdit, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Skill, SkillCategory } from '../../types/skills';

interface SkillsCategorySidebarProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
  onRunSkill: (skill: Skill) => void;
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
  onRunSkill: _onRunSkill,
  loading = false,
  isCreatingDraft = false,
  onSelectDraft,
  onCreateNew,
  selectedCategories = [],
  search = '',
}: SkillsCategorySidebarProps) {
  // Note: onRunSkill kept in props for API compatibility but not used in sidebar
  void _onRunSkill;

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
      <aside className="w-64 shrink-0 overflow-y-auto">
        <div className="py-2">
          <div className="px-2 py-1.5 mb-2">
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-2 mb-1">
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
      <aside className="w-64 shrink-0">
        <div className="py-4 px-2">
          <p className="text-sm text-muted-foreground text-center">
            No skills yet
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 h-full overflow-y-auto pr-4">
      <div className="py-2">
        {/* + New button */}
        <div className="px-2 mb-4">
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
          <div className="px-2 mb-3">
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

        {/* Skills count header */}
        <div className="px-2 py-1.5 mb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            My Skills ({filteredSkills.length}{hasActiveFilters ? ` of ${skills.length}` : ''})
          </div>
        </div>

        {/* Flat skills list */}
        <div className="space-y-0.5 px-2">
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
    </aside>
  );
}

export default SkillsCategorySidebar;
