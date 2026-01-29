// SkillsGrid Component - Responsive grid layout with loading and error states
// Task 2_2: Skills Library UI
// Task 2_4: Skill Detail & Edit - Added onViewSkill

import { AlertCircle, RefreshCw, SearchX, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillCard } from './SkillCard';
import type { Skill } from '../../types/skills';

type ViewMode = 'grid' | 'list';

interface SkillsGridProps {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skill: Skill) => void;
  onViewSkill?: (skill: Skill) => void;
  viewMode?: ViewMode;
  searchQuery?: string;
  onCreateNew?: () => void;
}

// Skeleton card for loading state
function SkillCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-muted rounded-lg" />
        <div className="flex-1">
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-20" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 mb-4">
        <AlertCircle size={40} className="text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Failed to load skills</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-muted text-foreground text-sm font-medium rounded-lg border border-border transition-colors"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

// Empty search results state
function EmptySearchState({ searchQuery, onCreateNew }: { searchQuery: string; onCreateNew?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-muted/50 rounded-xl border border-border mb-4">
        <SearchX size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">No skills found</h3>
      <p className="text-sm text-muted-foreground mb-1 text-center max-w-md">
        No results for "{searchQuery}"
      </p>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        Can't find what you're looking for? Create a custom skill.
      </p>
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={16} />
          Create new skill
        </button>
      )}
    </div>
  );
}

export function SkillsGrid({
  skills,
  loading,
  error,
  onRetry,
  onEditSkill,
  onDeleteSkill,
  onViewSkill,
  viewMode = 'grid',
  searchQuery,
  onCreateNew,
}: SkillsGridProps) {
  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkillCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Empty search results state
  if (skills.length === 0 && searchQuery) {
    return <EmptySearchState searchQuery={searchQuery} onCreateNew={onCreateNew} />;
  }

  // Skills grid/list
  return (
    <div
      className={cn(
        'grid gap-4',
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1'
      )}
    >
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          onEdit={onEditSkill}
          onDelete={onDeleteSkill}
          onView={onViewSkill}
          compact={viewMode === 'list'}
        />
      ))}
    </div>
  );
}
