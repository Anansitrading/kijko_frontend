import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Clock, Star, Archive, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Project } from '../../types';

const SIDEBAR_MIN_WIDTH = 160;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 208;

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
  onProjectClick?: (project: Project) => void;
  onCreateNew?: () => void;
}

const QUICK_FILTERS: { value: QuickFilter; label: string; icon: React.ElementType; droppable?: boolean }[] = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'starred', label: 'Starred', icon: Star, droppable: true },
  { value: 'archived', label: 'Archive', icon: Archive, droppable: true },
];

function SidebarProjectItem({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const iconBg = project.icon.backgroundColor || '#3b82f6';
  const iconContent =
    project.icon.type === 'emoji'
      ? project.icon.value
      : project.icon.value.charAt(0).toUpperCase();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-2 w-full text-left pl-8 pr-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[8px] shrink-0 font-medium"
        style={{ backgroundColor: iconBg, color: '#fff' }}
      >
        {iconContent}
      </span>
      <span className="truncate">{project.name}</span>
    </button>
  );
}

export function ProjectsFilterSidebar({
  filters,
  onFiltersChange,
  projects,
  onDropProject,
  onProjectClick,
  onCreateNew,
}: ProjectsFilterSidebarProps) {
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['quick-recent', 'section-tags']));
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth.current + delta));
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

  const toggleExpanded = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Derive unique tags from all projects
  const allTags = Array.from(
    new Set(projects.map((p) => p.label).filter((l): l is string => !!l))
  ).sort();

  // Compute projects per category
  const projectsByCategory = useMemo(() => {
    const recent = [...projects]
      .filter((p) => !p.archived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 4);
    const starred = projects.filter((p) => p.starred);
    const archived = projects.filter((p) => p.archived);
    const byTag: Record<string, Project[]> = {};
    for (const tag of allTags) {
      byTag[tag] = projects.filter((p) => p.label === tag);
    }
    return { recent, starred, archived, byTag };
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
    <aside
      className="shrink-0 relative"
      style={{ width: sidebarWidth }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
      />
      <div className="pr-4 border-r border-border h-full">
      {/* Create New Button */}
      <div className="mb-5">
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Plus size={16} />
          <span>New</span>
        </button>
      </div>

      {/* Category Tree */}
      <div className="mb-5">
        <div className="flex flex-col gap-0.5">
          {QUICK_FILTERS.map((option) => {
            const Icon = option.icon;
            const categoryKey = `quick-${option.value}`;
            const isExpanded = expandedCategories.has(categoryKey);
            const isDragOver = dragOverTarget === categoryKey;
            const categoryProjects =
              option.value === 'recent'
                ? projectsByCategory.recent
                : option.value === 'starred'
                ? projectsByCategory.starred
                : option.value === 'archived'
                ? projectsByCategory.archived
                : [];
            const count = categoryProjects.length;
            const hasProjects = count > 0;

            return (
              <div key={option.value}>
                {/* Category header row */}
                <button
                  onClick={() => {
                    if (hasProjects) toggleExpanded(categoryKey);
                  }}
                  onDragOver={option.droppable ? handleDragOver : undefined}
                  onDragEnter={option.droppable ? () => setDragOverTarget(categoryKey) : undefined}
                  onDragLeave={option.droppable ? () => setDragOverTarget(null) : undefined}
                  onDrop={
                    option.droppable
                      ? (e) => handleDrop(e, { type: option.value as 'starred' | 'archived' })
                      : undefined
                  }
                  className={cn(
                    'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                    isExpanded
                      ? 'text-foreground bg-muted/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    !hasProjects && 'opacity-50',
                    isDragOver && 'ring-2 ring-primary bg-primary/10 text-primary'
                  )}
                >
                  {/* Chevron */}
                  {hasProjects ? (
                    isExpanded ? (
                      <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                    )
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  <Icon size={14} className="shrink-0" />
                  <span className="flex-1">{option.label}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isExpanded ? 'text-foreground/60' : 'text-muted-foreground/60'
                    )}
                  >
                    {count}
                  </span>
                </button>

                {/* Expanded project list */}
                {isExpanded && hasProjects && (
                  <div className="flex flex-col gap-0.5 mt-0.5 mb-1 max-h-48 overflow-y-auto">
                    {categoryProjects.map((project) => (
                      <SidebarProjectItem
                        key={project.id}
                        project={project}
                        onClick={() => onProjectClick?.(project)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggleExpanded('section-tags')}
            className="flex items-center gap-2 w-full text-left mb-2"
          >
            {expandedCategories.has('section-tags') ? (
              <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
            )}
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Tags
            </span>
          </button>
          {expandedCategories.has('section-tags') && <div className="flex flex-col gap-0.5">
            {allTags.map((tag) => {
              const categoryKey = `tag-${tag}`;
              const isExpanded = expandedCategories.has(categoryKey);
              const isDragOver = dragOverTarget === categoryKey;
              const tagProjects = projectsByCategory.byTag[tag] || [];
              const tagCount = tagProjects.length;
              const hasProjects = tagCount > 0;

              return (
                <div key={tag}>
                  {/* Tag header row */}
                  <button
                    onClick={() => {
                      if (hasProjects) toggleExpanded(categoryKey);
                    }}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragOverTarget(categoryKey)}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDrop(e, { type: 'tag', value: tag })}
                    className={cn(
                      'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                      isExpanded
                        ? 'text-foreground bg-muted/50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      !hasProjects && 'opacity-50',
                      isDragOver && 'ring-2 ring-primary bg-primary/10 text-primary'
                    )}
                  >
                    {/* Chevron */}
                    {hasProjects ? (
                      isExpanded ? (
                        <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <span className="w-3 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isExpanded || isDragOver ? 'bg-primary' : 'bg-muted-foreground/40'
                      )}
                    />
                    <span className="flex-1">{tag}</span>
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        isExpanded ? 'text-foreground/60' : 'text-muted-foreground/60'
                      )}
                    >
                      {tagCount}
                    </span>
                  </button>

                  {/* Expanded project list */}
                  {isExpanded && hasProjects && (
                    <div className="flex flex-col gap-0.5 mt-0.5 mb-1 max-h-48 overflow-y-auto">
                      {tagProjects.map((project) => (
                        <SidebarProjectItem
                          key={project.id}
                          project={project}
                          onClick={() => onProjectClick?.(project)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>}
        </div>
      )}
      </div>
    </aside>
  );
}

export default ProjectsFilterSidebar;
