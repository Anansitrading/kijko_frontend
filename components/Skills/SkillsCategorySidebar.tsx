// SkillsCategorySidebar Component - Sidebar with skills list and category filter
// Shows flat list of skills with category filtering via dropdown

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Zap, FileEdit, Plus, Filter, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Skill, SkillCategory } from '../../types/skills';

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  analysis: 'Analysis',
  generation: 'Generation',
  transformation: 'Transformation',
  communication: 'Communication',
  automation: 'Automation',
  custom: 'Custom',
};

const CATEGORY_ORDER: SkillCategory[] = [
  'analysis',
  'generation',
  'transformation',
  'communication',
  'automation',
  'custom',
];

interface SkillsCategorySidebarProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
  onRunSkill: (skill: Skill) => void;
  loading?: boolean;
  isCreatingDraft?: boolean;
  onSelectDraft?: () => void;
  onCreateNew?: () => void;
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
      <Zap size={14} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
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
}: SkillsCategorySidebarProps) {
  // Note: onRunSkill kept in props for API compatibility but not used in sidebar
  void _onRunSkill;

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SkillCategory[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening
  const openFilter = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsFilterOpen(true);
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filterButtonRef.current && !filterButtonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result = skills;

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter((skill) => selectedCategories.includes(skill.category));
    }

    // Sort by star count (most starred first)
    return [...result].sort((a, b) => (b.starCount ?? 0) - (a.starCount ?? 0));
  }, [skills, selectedCategories]);

  const toggleCategory = (category: SkillCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  const hasActiveFilters = selectedCategories.length > 0;

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
        {/* + New and Filter buttons */}
        <div className="px-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={onCreateNew}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={16} />
              <span>New</span>
            </button>
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => isFilterOpen ? setIsFilterOpen(false) : openFilter()}
                className={cn(
                  'flex items-center justify-center p-2 border rounded-lg transition-colors',
                  hasActiveFilters
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title="Filter skills"
              >
                <Filter size={16} />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {/* Filter Dropdown - rendered via portal to escape overflow */}
              {isFilterOpen && createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed w-56 bg-card border border-border rounded-lg shadow-xl z-[100] py-2"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Filter by Category</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="py-1">
                    {CATEGORY_ORDER.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          'w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors',
                          selectedCategories.includes(category)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span>{CATEGORY_LABELS[category]}</span>
                        {selectedCategories.includes(category) && (
                          <Check size={14} className="text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
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
              No skills match filter
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default SkillsCategorySidebar;
