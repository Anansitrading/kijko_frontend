import { useState, useMemo } from 'react';
import { Filter, Clock, Star, Archive } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Project } from '../../types';

export type QuickFilter = 'recent' | 'starred' | 'archived' | null;

export interface ProjectSidebarFilters {
  quickFilter: QuickFilter;
  selectedTags: string[];
}

export const DEFAULT_PROJECT_SIDEBAR_FILTERS: ProjectSidebarFilters = {
  quickFilter: null,
  selectedTags: [],
};

export interface DropTarget {
  type: 'starred' | 'archived' | 'tag';
  value?: string;
}

interface ProjectsFilterSidebarProps {
  filters: ProjectSidebarFilters;
  onFiltersChange: (filters: ProjectSidebarFilters) => void;
  projects: Project[];
  onDropProject?: (projectId: string, target: DropTarget) => void;
}

const QUICK_FILTERS: { value: QuickFilter; label: string; icon: React.ElementType; droppable?: boolean }[] = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'starred', label: 'Starred', icon: Star, droppable: true },
  { value: 'archived', label: 'Archive', icon: Archive, droppable: true },
];

function toggleTag(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function ProjectsFilterSidebar({ filters, onFiltersChange, projects, onDropProject }: ProjectsFilterSidebarProps) {
  const hasActiveFilters = filters.quickFilter !== null || filters.selectedTags.length > 0;
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Derive unique tags from all projects
  const allTags = Array.from(
    new Set(projects.map((p) => p.label).filter((l): l is string => !!l))
  ).sort();

  // Compute counts per filter
  const counts = useMemo(() => {
    const recent = projects.filter((p) => !p.archived).length;
    const starred = projects.filter((p) => p.starred).length;
    const archived = projects.filter((p) => p.archived).length;
    const tags: Record<string, number> = {};
    for (const tag of allTags) {
      tags[tag] = projects.filter((p) => p.label === tag).length;
    }
    return { recent, starred, archived, tags };
  }, [projects, allTags]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    setDragOverTarget(null);
    const projectId = e.dataTransfer.getData('text/projectId');
    if (projectId && onDropProject) {
      onDropProject(projectId, target);
    }
  };

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
            onClick={() => onFiltersChange(DEFAULT_PROJECT_SIDEBAR_FILTERS)}
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
            const isDragOver = dragOverTarget === `quick-${option.value}`;
            const targetKey = `quick-${option.value}`;
            const count = option.value === 'recent' ? counts.recent
              : option.value === 'starred' ? counts.starred
              : option.value === 'archived' ? counts.archived : 0;

            return (
              <button
                key={option.value}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    quickFilter: isActive ? null : option.value,
                  })
                }
                onDragOver={option.droppable ? handleDragOver : undefined}
                onDragEnter={option.droppable ? () => setDragOverTarget(targetKey) : undefined}
                onDragLeave={option.droppable ? () => setDragOverTarget(null) : undefined}
                onDrop={
                  option.droppable
                    ? (e) => handleDrop(e, { type: option.value as 'starred' | 'archived' })
                    : undefined
                }
                className={cn(
                  'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  isDragOver && 'ring-2 ring-primary bg-primary/10 text-primary'
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1">{option.label}</span>
                <span className={cn(
                  'text-xs tabular-nums',
                  isActive ? 'text-primary/70' : 'text-muted-foreground/60'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Tags
          </h4>
          <div className="flex flex-col gap-0.5">
            {allTags.map((tag) => {
              const isActive = filters.selectedTags.includes(tag);
              const isDragOver = dragOverTarget === `tag-${tag}`;
              const tagCount = counts.tags[tag] || 0;

              return (
                <button
                  key={tag}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      selectedTags: toggleTag(filters.selectedTags, tag),
                    })
                  }
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverTarget(`tag-${tag}`)}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={(e) => handleDrop(e, { type: 'tag', value: tag })}
                  className={cn(
                    'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    isDragOver && 'ring-2 ring-primary bg-primary/10 text-primary'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isActive || isDragOver ? 'bg-primary' : 'bg-muted-foreground/40'
                    )}
                  />
                  <span className="flex-1">{tag}</span>
                  <span className={cn(
                    'text-xs tabular-nums',
                    isActive ? 'text-primary/70' : 'text-muted-foreground/60'
                  )}>
                    {tagCount}
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

export default ProjectsFilterSidebar;
