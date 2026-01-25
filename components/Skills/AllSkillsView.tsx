import { useMemo } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { SkillsGrid } from './SkillsGrid';
import { EmptyState } from './EmptyState';
import type { Skill } from '../../types/skills';

type SortOption = 'most-used' | 'recent' | 'alphabetical';
type ViewMode = 'grid' | 'list';

interface AllSkillsViewProps {
  onCreateSkill: () => void;
  onRunSkill: (skill: Skill) => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skill: Skill) => void;
  onViewSkill: (skill: Skill) => void;
  onActivateSkill?: (skill: Skill) => void;
  search?: string;
  sortBy?: SortOption;
  viewMode?: ViewMode;
}

export function AllSkillsView({
  onCreateSkill,
  onRunSkill,
  onEditSkill,
  onDeleteSkill,
  onViewSkill,
  onActivateSkill,
  search = '',
  sortBy = 'most-used',
  viewMode = 'grid',
}: AllSkillsViewProps) {
  const {
    skills,
    loading,
    error,
    refetch,
  } = useSkills();

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result = [...skills];

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
  }, [skills, search, sortBy]);

  const hasNoSkills = !loading && !error && skills.length === 0;
  const hasNoResults = !loading && !error && skills.length > 0 && filteredSkills.length === 0;

  return (
    <div className="space-y-4">
      {/* Skill Count - subtle info text */}
      <p className="text-sm text-muted-foreground">
        {filteredSkills.length} {filteredSkills.length === 1 ? 'skill' : 'skills'} available
        {search && ` matching "${search}"`}
      </p>

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
          skills={filteredSkills}
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
