// Filter Sidebar for Skills page
// Left sidebar with quick filters (Recent, Populair, New) and category tags

import { useMemo } from 'react';
import { Filter, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Skill, SkillCategory } from '../../types/skills';

export type SkillsQuickFilter = 'recent' | 'populair' | 'new' | null;

export interface SkillsSidebarFilters {
  quickFilter: SkillsQuickFilter;
  selectedCategories: SkillCategory[];
}

export const DEFAULT_SKILLS_SIDEBAR_FILTERS: SkillsSidebarFilters = {
  quickFilter: null,
  selectedCategories: [],
};

interface SkillsFilterSidebarProps {
  filters: SkillsSidebarFilters;
  onFiltersChange: (filters: SkillsSidebarFilters) => void;
  skills: Skill[];
}

const QUICK_FILTERS: { value: SkillsQuickFilter; label: string; icon: React.ElementType }[] = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'populair', label: 'Populair', icon: TrendingUp },
  { value: 'new', label: 'New', icon: Sparkles },
];

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  analysis: 'Analysis',
  generation: 'Generation',
  transformation: 'Transformation',
  communication: 'Communication',
  automation: 'Automation',
  custom: 'Custom',
};

function toggleCategory(arr: SkillCategory[], item: SkillCategory): SkillCategory[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function SkillsFilterSidebar({ filters, onFiltersChange, skills }: SkillsFilterSidebarProps) {
  const hasActiveFilters = filters.quickFilter !== null || filters.selectedCategories.length > 0;

  // Compute counts per quick filter
  const quickCounts = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent = skills.filter(
      (s) => s.lastExecutedAt && new Date(s.lastExecutedAt) >= fourteenDaysAgo
    ).length;
    const populair = skills.filter((s) => s.executionCount >= 30).length;
    const newSkills = skills.filter(
      (s) => new Date(s.createdAt) >= sevenDaysAgo
    ).length;

    return { recent, populair, new: newSkills };
  }, [skills]);

  // Derive category tags with counts
  const categoryTags = useMemo(() => {
    const counts: Partial<Record<SkillCategory, number>> = {};
    for (const skill of skills) {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    }
    return (Object.entries(CATEGORY_LABELS) as [SkillCategory, string][])
      .filter(([cat]) => (counts[cat] || 0) > 0)
      .map(([cat, label]) => ({
        value: cat,
        label,
        count: counts[cat] || 0,
      }));
  }, [skills]);

  return (
    <aside className="w-52 shrink-0 pr-6 border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter size={14} />
          Filter by
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange(DEFAULT_SKILLS_SIDEBAR_FILTERS)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="mb-5">
        <div className="flex flex-col gap-0.5">
          {QUICK_FILTERS.map((option) => {
            const Icon = option.icon;
            const isActive = filters.quickFilter === option.value;
            const count =
              option.value === 'recent'
                ? quickCounts.recent
                : option.value === 'populair'
                  ? quickCounts.populair
                  : quickCounts.new;

            return (
              <button
                key={option.value}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    quickFilter: isActive ? null : option.value,
                  })
                }
                className={cn(
                  'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1">{option.label}</span>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isActive ? 'text-primary/70' : 'text-muted-foreground/60'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags (Categories) Section */}
      {categoryTags.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Tags
          </h4>
          <div className="flex flex-col gap-0.5">
            {categoryTags.map((tag) => {
              const isActive = filters.selectedCategories.includes(tag.value);

              return (
                <button
                  key={tag.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      selectedCategories: toggleCategory(
                        filters.selectedCategories,
                        tag.value
                      ),
                    })
                  }
                  className={cn(
                    'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isActive ? 'bg-primary' : 'bg-muted-foreground/40'
                    )}
                  />
                  <span className="flex-1">{tag.label}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isActive ? 'text-primary/70' : 'text-muted-foreground/60'
                    )}
                  >
                    {tag.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

export default SkillsFilterSidebar;
