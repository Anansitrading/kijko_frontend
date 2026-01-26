import { useMemo } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { SkillsGrid } from './SkillsGrid';
import { EmptyState } from './EmptyState';
import type { Skill } from '../../types/skills';
import type { SkillsSidebarFilters } from './SkillsFilterSidebar';

type SortOption = 'most-used' | 'recent' | 'alphabetical';
type ViewMode = 'grid' | 'list';

interface MySkillsViewProps {
  onCreateSkill: () => void;
  onRunSkill: (skill: Skill) => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skill: Skill) => void;
  onViewSkill: (skill: Skill) => void;
  search?: string;
  sortBy?: SortOption;
  viewMode?: ViewMode;
  sidebarFilters?: SkillsSidebarFilters;
}

export function MySkillsView({
  onCreateSkill,
  onRunSkill,
  onEditSkill,
  onDeleteSkill,
  onViewSkill,
  search = '',
  sortBy = 'most-used',
  viewMode = 'grid',
  sidebarFilters,
}: MySkillsViewProps) {
  const {
    skills,
    loading,
    error,
    refetch,
  } = useSkills();

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    let result = [...skills];

    // Apply sidebar quick filter
    if (sidebarFilters?.quickFilter) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      switch (sidebarFilters.quickFilter) {
        case 'recent':
          result = result.filter(
            (s) => s.lastExecutedAt && new Date(s.lastExecutedAt) >= fourteenDaysAgo
          );
          break;
        case 'populair':
          result = result.filter((s) => s.executionCount >= 30);
          break;
        case 'new':
          result = result.filter((s) => new Date(s.createdAt) >= sevenDaysAgo);
          break;
      }
    }

    // Apply sidebar category filter
    if (sidebarFilters?.selectedCategories && sidebarFilters.selectedCategories.length > 0) {
      result = result.filter((s) => sidebarFilters.selectedCategories.includes(s.category));
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sortBy) {
      case 'most-used':
        result.sort((a, b) => b.executionCount - a.executionCount);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [skills, search, sortBy, sidebarFilters]);

  const hasNoSkills = !loading && !error && skills.length === 0;
  const hasNoResults = !loading && !error && skills.length > 0 && filteredAndSortedSkills.length === 0;

  return (
    <div className="space-y-4">
      {/* Skill Count */}
      {!hasNoSkills && (
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedSkills.length} {filteredAndSortedSkills.length === 1 ? 'skill' : 'skills'}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Content */}
      {hasNoSkills ? (
        <EmptyState type="no-skills" onCreateClick={onCreateSkill} />
      ) : hasNoResults ? (
        <EmptyState
          type="no-results"
          searchQuery={search}
          onCreateClick={onCreateSkill}
        />
      ) : (
        <SkillsGrid
          skills={filteredAndSortedSkills}
          loading={loading}
          error={error}
          onRetry={refetch}
          onRunSkill={onRunSkill}
          onEditSkill={onEditSkill}
          onDeleteSkill={onDeleteSkill}
          onViewSkill={onViewSkill}
          viewMode={viewMode}
        />
      )}
    </div>
  );
}
