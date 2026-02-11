import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  ChevronDown,
  FolderOpen,
  Search,
  Filter,
  X,
  Check,
} from 'lucide-react';
import { UserAvatar } from '../Dashboard/UserAvatar';
import { useProjects } from '../../contexts/ProjectsContext';
import { Project, ProjectFilter, ProjectSort, WorktreeWithBranches } from '../../types';
import { cn } from '../../utils/cn';
import { ProjectCreationModal } from './ProjectCreationModal';
import type { SimpleProjectCreationForm } from './ProjectCreationModal';
import { UserManagementModal } from './UserManagement';
import { ProjectsFilterSidebar, DEFAULT_PROJECT_SIDEBAR_FILTERS } from './ProjectsFilterSidebar';
import type { ProjectSidebarFilters } from './ProjectsFilterSidebar';
import { RepoMindmap } from './RepoMindmap';
import { RepoListView } from './RepoListView';
import { getWorktreesForProject } from './repoMindmapData';
import { IngestionModal } from '../../pages/ContextDetailInspectorPage/components/IngestionModal';
import { useIngestion } from '../../contexts/IngestionContext';
import { BranchDetailsPanel } from './BranchDetailsPanel';
import { ProjectsOnboardingCTA } from './ProjectsOnboardingCTA';
import { ProjectCard } from './ProjectCard';

interface ProjectsDashboardProps {
  onProjectSelect: (project: Project) => void;
  onOpenSettings?: () => void;
  /** When true, hides the main header (logo, search, new button). Used when embedded in Dashboard with tabs. */
  embedded?: boolean;
}


const SORT_OPTIONS: { id: ProjectSort; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'name', label: 'Name' },
  { id: 'sources', label: 'Number of sources' },
];

export function ProjectsDashboard({ onOpenSettings, embedded = false }: ProjectsDashboardProps) {
  const navigate = useNavigate();
  const {
    projects,
    filteredProjects,
    filter,
    sort,
    viewMode,
    searchQuery,
    setFilter,
    setSort,
    setViewMode,
    setSearchQuery,
    createProject,
    updateProject,
    deleteProject,
    selectedProject,
    selectProject,
  } = useProjects();

  // Recent projects for the empty state quick menu (top 4 non-archived, by updatedAt)
  const recentProjects = useMemo(
    () =>
      [...projects]
        .filter((p) => !p.archived)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 4),
    [projects],
  );

  const { openIngestionModalEmpty } = useIngestion();
  const [sidebarFilters, setSidebarFilters] = useState<ProjectSidebarFilters>(DEFAULT_PROJECT_SIDEBAR_FILTERS);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [userManagementProject, setUserManagementProject] = useState<Project | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<{ worktreeId: string; branchName: string } | null>(null);

  // Derive unique tags from all projects
  const allTags = useMemo(
    () => Array.from(new Set(projects.map((p) => p.label).filter((l): l is string => !!l))).sort(),
    [projects]
  );

  const activeFilterCount = (filter !== 'all' ? 1 : 0) + (sidebarFilters.quickFilter ? 1 : 0) + sidebarFilters.selectedTags.length;

  const openFilterDropdown = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 220,
      });
    }
    setIsFilterDropdownOpen(true);
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filterButtonRef.current && !filterButtonRef.current.contains(target) &&
        filterDropdownRef.current && !filterDropdownRef.current.contains(target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects based on sidebar filters (tags and status)
  // When no filter is set, show all projects
  const displayedProjects = useMemo(() => {
    let result = filteredProjects;

    // Apply status filters
    if (sidebarFilters.quickFilter === 'starred') {
      result = result.filter((p) => p.starred);
    } else if (sidebarFilters.quickFilter === 'archived') {
      result = result.filter((p) => p.archived);
    }

    // Apply tag filters
    if (sidebarFilters.selectedTags.length > 0) {
      result = result.filter((p) => p.label && sidebarFilters.selectedTags.includes(p.label));
    }

    return result;
  }, [filteredProjects, sidebarFilters]);

  // Worktrees state – seeded from static data, mutated by context-menu actions
  const [worktreesOverrides, setWorktreesOverrides] = useState<Record<string, WorktreeWithBranches[]>>({});

  const getWorktrees = useCallback(
    (projectId: string): WorktreeWithBranches[] =>
      worktreesOverrides[projectId] ?? getWorktreesForProject(projectId),
    [worktreesOverrides],
  );

  const handleDuplicateWorktree = useCallback(
    (projectId: string, worktreeId: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        const original = current.find((wt) => wt.id === worktreeId);
        if (!original) return prev;

        const copy: WorktreeWithBranches = {
          id: `${worktreeId}-copy-${Date.now()}`,
          name: `${original.name}-copy`,
          path: `/${original.name}-copy`,
          isActive: false,
          currentBranch: 'main',
          branches: [{ name: 'main', isDefault: true, isCurrent: true, lastCommit: 'just now' }],
        };
        return { ...prev, [projectId]: [...current, copy] };
      });
    },
    [],
  );

  const handleRenameWorktree = useCallback(
    (projectId: string, worktreeId: string, newName: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        return {
          ...prev,
          [projectId]: current.map((wt) =>
            wt.id === worktreeId ? { ...wt, name: newName, path: `/${newName}` } : wt,
          ),
        };
      });
    },
    [],
  );

  const handleAddBranch = useCallback(
    (projectId: string, worktreeId: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        return {
          ...prev,
          [projectId]: current.map((wt) => {
            if (wt.id !== worktreeId) return wt;
            const newName = `branch-${wt.branches.length + 1}`;
            return {
              ...wt,
              branches: [
                ...wt.branches,
                { name: newName, isDefault: false, isCurrent: false, lastCommit: 'just now' },
              ],
            };
          }),
        };
      });
    },
    [],
  );

  const handleForkBranch = useCallback(
    (projectId: string, worktreeId: string, sourceBranchName: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        return {
          ...prev,
          [projectId]: current.map((wt) => {
            if (wt.id !== worktreeId) return wt;
            const sourceBranch = wt.branches.find((br) => br.name === sourceBranchName);
            if (!sourceBranch) return wt;
            const newName = `${sourceBranchName}-fork`;
            // Check if fork name already exists, add number if so
            let finalName = newName;
            let counter = 1;
            while (wt.branches.some((br) => br.name === finalName)) {
              finalName = `${newName}-${counter}`;
              counter++;
            }
            return {
              ...wt,
              branches: [
                ...wt.branches,
                { name: finalName, isDefault: false, isCurrent: false, lastCommit: 'just now' },
              ],
            };
          }),
        };
      });
    },
    [],
  );

  const handleRenameBranch = useCallback(
    (projectId: string, worktreeId: string, oldName: string, newName: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        return {
          ...prev,
          [projectId]: current.map((wt) => {
            if (wt.id !== worktreeId) return wt;
            return {
              ...wt,
              currentBranch: wt.currentBranch === oldName ? newName : wt.currentBranch,
              branches: wt.branches.map((br) =>
                br.name === oldName ? { ...br, name: newName } : br,
              ),
            };
          }),
        };
      });
    },
    [],
  );

  const handleWorktreeNewIngestion = useCallback(
    (_worktreeId: string) => {
      openIngestionModalEmpty();
    },
    [openIngestionModalEmpty],
  );


  const handleBranchHover = useCallback(
    (worktreeId: string, branchName: string) => {
      setHoveredBranch({ worktreeId, branchName });
    },
    [],
  );

  const handleAddWorktree = useCallback(
    (projectId: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        const newWorktree: WorktreeWithBranches = {
          id: `worktree-${Date.now()}`,
          name: `Worktree-${current.length + 1}`,
          path: `/Worktree-${current.length + 1}`,
          isActive: false,
          currentBranch: 'main',
          branches: [{ name: 'main', isDefault: true, isCurrent: true, lastCommit: 'just now' }],
        };
        return { ...prev, [projectId]: [...current, newWorktree] };
      });
    },
    [],
  );

  const handleDeleteWorktree = useCallback(
    (projectId: string, worktreeId: string) => {
      setWorktreesOverrides((prev) => {
        const current = prev[projectId] ?? getWorktreesForProject(projectId);
        const filtered = current.filter((wt) => wt.id !== worktreeId);
        // Don't allow deleting the last worktree
        if (filtered.length === 0) return prev;
        return { ...prev, [projectId]: filtered };
      });
    },
    [],
  );

  // Compute displayed branch: hovered takes priority, otherwise show first branch as default
  const displayedBranch = useMemo(() => {
    if (hoveredBranch) return hoveredBranch;
    if (selectedProject) {
      const worktrees = getWorktrees(selectedProject.id);
      if (worktrees.length > 0 && worktrees[0].branches.length > 0) {
        return { worktreeId: worktrees[0].id, branchName: worktrees[0].branches[0].name };
      }
    }
    return null;
  }, [hoveredBranch, selectedProject, getWorktrees]);

  const handleCreateProject = (data: SimpleProjectCreationForm) => {
    const newProject = createProject(data.name);

    // Select the new project in the dashboard
    selectProject(newProject);

    // Close the modal
    setIsNewProjectModalOpen(false);

    // If GitHub repo was selected, show a toast notification
    // In production, this would trigger the repo indexing process
    if (data.sourceType === 'github' && data.githubRepo) {
      // TODO: Start GitHub repo indexing process
      // For now, just log the repo info
      console.log('Loading GitHub repo:', data.githubRepo.fullName);
      // Toast notification would be shown here: "We're loading your GitHub repo and preparing your workspace..."
    }

    // Navigate to the project dashboard overview (stay on this page with the project selected)
    // The mindmap/overview will show for the selected project
  };

  // Get existing project names for duplicate checking
  const existingProjectNames = filteredProjects.map(p => p.name);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label || 'Sort';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Only show when not embedded */}
      {!embedded && (
        <header className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
          {/* Top Bar - Logo and Actions */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/public/favicon.png"
                alt="Kijko logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-bold text-xl text-foreground tracking-tight">
                KIJKO
              </span>
            </div>

            {/* User Avatar */}
            {onOpenSettings && (
              <UserAvatar onClick={onOpenSettings} />
            )}
          </div>
        </header>
      )}

      {/* Header with title and View Controls - Only show controls when projects exist */}
      {projects.length > 0 && (
        <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Title */}
            <h1 className="text-lg font-semibold text-foreground">All Projects</h1>

            {/* Search and View Controls */}
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-64 pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  ref={filterButtonRef}
                  onClick={() => isFilterDropdownOpen ? setIsFilterDropdownOpen(false) : openFilterDropdown()}
                  className={cn(
                    'flex items-center justify-center p-2 border rounded-lg transition-colors',
                    activeFilterCount > 0
                      ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  title="Filter projects"
                >
                  <Filter size={18} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown - rendered via portal */}
                {isFilterDropdownOpen && createPortal(
                  <div
                    ref={filterDropdownRef}
                    className="fixed min-w-[220px] bg-card border border-border rounded-lg shadow-xl z-[200] py-3 max-h-[70vh] overflow-y-auto"
                    style={{ top: filterDropdownPosition.top, left: filterDropdownPosition.left }}
                  >
                      {/* Header with clear button */}
                      <div className="flex items-center justify-between px-4 pb-3 border-b border-border mb-3">
                        <span className="text-sm font-medium text-foreground">Filters</span>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={() => {
                              setSidebarFilters(DEFAULT_PROJECT_SIDEBAR_FILTERS);
                              setFilter('all');
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={12} />
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Ownership Filters */}
                      <div className="px-4 mb-4">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                          Ownership
                        </span>
                        <div className="flex flex-col gap-1">
                          {[
                            { id: 'mine' as const, label: 'My projects' },
                            { id: 'shared' as const, label: 'Shared with me' },
                          ].map((option) => {
                            const isActive = filter === option.id;
                            return (
                              <button
                                key={option.id}
                                onClick={() => setFilter(isActive ? 'all' : option.id)}
                                className={cn(
                                  'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                  isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                    isActive ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                                  )}
                                >
                                  {isActive && <Check size={12} className="text-primary-foreground" />}
                                </span>
                                <span>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Status Filters */}
                      <div className="px-4 mb-4">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                          Status
                        </span>
                        <div className="flex flex-col gap-1">
                          {(['starred', 'archived'] as const).map((status) => {
                            const isActive = sidebarFilters.quickFilter === status;
                            return (
                              <button
                                key={status}
                                onClick={() =>
                                  setSidebarFilters({
                                    ...sidebarFilters,
                                    quickFilter: isActive ? null : status,
                                  })
                                }
                                className={cn(
                                  'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                  isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                    isActive ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                                  )}
                                >
                                  {isActive && <Check size={12} className="text-primary-foreground" />}
                                </span>
                                <span className="capitalize">{status}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tag Filters */}
                      {allTags.length > 0 && (
                        <div className="px-4">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                            Tags
                          </span>
                          <div className="flex flex-col gap-1">
                            {allTags.map((tag) => {
                              const isSelected = sidebarFilters.selectedTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() =>
                                    setSidebarFilters({
                                      ...sidebarFilters,
                                      selectedTags: isSelected
                                        ? sidebarFilters.selectedTags.filter((t) => t !== tag)
                                        : [...sidebarFilters.selectedTags, tag],
                                    })
                                  }
                                  className={cn(
                                    'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                    isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                                    )}
                                  >
                                    {isSelected && <Check size={12} className="text-primary-foreground" />}
                                  </span>
                                  <span>{tag}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>,
                  document.body
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-muted/50 border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'transition-transform',
                      isSortDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSortDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSort(option.id);
                            setIsSortDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-sm text-left transition-colors',
                            sort === option.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden p-6">
        <div className="flex gap-6 h-full">
          {/* Filter Sidebar - Hide when no projects for cleaner onboarding */}
          {projects.length > 0 && (
            <ProjectsFilterSidebar
              projects={displayedProjects}
              allTags={allTags}
              filters={sidebarFilters}
              onFiltersChange={setSidebarFilters}
              activeFilterCount={activeFilterCount}
              onProjectClick={selectProject}
              onProjectOpen={(project) => selectProject(project)}
              onProjectShare={(project) => setUserManagementProject(project)}
              onProjectToggleStarred={(project) => updateProject(project.id, { starred: !project.starred })}
              onProjectArchive={(project) => updateProject(project.id, { archived: true })}
              onProjectUnarchive={(project) => updateProject(project.id, { archived: false })}
              onProjectDelete={(project) => deleteProject(project.id)}
              onCreateNew={() => setIsNewProjectModalOpen(true)}
              ownershipFilter={filter}
              onOwnershipFilterChange={setFilter}
            />
          )}

          {/* Repo Mindmap, Search Results, or Empty State */}
          <div className="flex-1 min-w-0 flex gap-0">
            <div className="flex-1 min-w-0">
            {projects.length === 0 ? (
              /* Onboarding CTA when no projects exist */
              <ProjectsOnboardingCTA onCreateProject={() => setIsNewProjectModalOpen(true)} />
            ) : searchQuery.trim() ? (
              /* Search results: show filtered projects as grid */
              <div className="h-full overflow-auto">
                {displayedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border mb-4">
                      <Search size={40} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No projects found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      No projects match "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                    {displayedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode="grid"
                        onClick={() => {
                          selectProject(project);
                          setSearchQuery('');
                        }}
                        onMenuClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : selectedProject ? (
              viewMode === 'grid' ? (
                <RepoMindmap
                  project={selectedProject}
                  worktrees={getWorktrees(selectedProject.id)}
                  onBranchClick={(projectId) => navigate(`/project/${projectId}`)}
                  onDuplicateWorktree={(worktreeId) => handleDuplicateWorktree(selectedProject.id, worktreeId)}
                  onRenameWorktree={(worktreeId, newName) => handleRenameWorktree(selectedProject.id, worktreeId, newName)}
                  onWorktreeNewIngestion={handleWorktreeNewIngestion}
                  onBranchOpen={() => navigate(`/project/${selectedProject.id}`)}
                  onBranchNewIngestion={() => openIngestionModalEmpty()}
                  onRenameBranch={(worktreeId, oldName, newName) => handleRenameBranch(selectedProject.id, worktreeId, oldName, newName)}
                  onAddBranch={(worktreeId) => handleAddBranch(selectedProject.id, worktreeId)}
                  onForkBranch={(worktreeId, sourceBranchName) => handleForkBranch(selectedProject.id, worktreeId, sourceBranchName)}
                  onAddWorktree={() => handleAddWorktree(selectedProject.id)}
                  onDeleteWorktree={(worktreeId) => handleDeleteWorktree(selectedProject.id, worktreeId)}
                  onBranchHover={handleBranchHover}
                  onRenameProject={(newName) => updateProject(selectedProject.id, { name: newName })}
                />
              ) : (
                <RepoListView
                  project={selectedProject}
                  worktrees={getWorktrees(selectedProject.id)}
                  onBranchClick={(projectId) => navigate(`/project/${projectId}`)}
                  onDuplicateWorktree={(worktreeId) => handleDuplicateWorktree(selectedProject.id, worktreeId)}
                  onRenameWorktree={(worktreeId, newName) => handleRenameWorktree(selectedProject.id, worktreeId, newName)}
                  onWorktreeNewIngestion={handleWorktreeNewIngestion}
                  onBranchOpen={() => navigate(`/project/${selectedProject.id}`)}
                  onBranchNewIngestion={() => openIngestionModalEmpty()}
                  onRenameBranch={(worktreeId, oldName, newName) => handleRenameBranch(selectedProject.id, worktreeId, oldName, newName)}
                  onAddBranch={(worktreeId) => handleAddBranch(selectedProject.id, worktreeId)}
                  onBranchHover={handleBranchHover}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="p-4 bg-muted/50 rounded-xl border border-border mb-4">
                  <FolderOpen size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Select a project
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Choose a project from the sidebar or pick a recent one below
                </p>

                {/* Recent projects quick menu */}
                {recentProjects.length > 0 && (
                  <div className="w-full max-w-md">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Recent projects
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {recentProjects.map((project) => {
                        const iconBg = project.icon.backgroundColor || '#3b82f6';
                        const iconContent =
                          project.icon.type === 'emoji'
                            ? project.icon.value
                            : project.icon.value.charAt(0).toUpperCase();

                        return (
                          <button
                            key={project.id}
                            onClick={() => selectProject(project)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all text-left group"
                          >
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 font-medium"
                              style={{ backgroundColor: iconBg, color: '#fff' }}
                            >
                              {iconContent}
                            </span>
                            <span className="truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {project.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Branch Details Panel - only visible when project selected AND projects exist AND not searching */}
            {projects.length > 0 && selectedProject && displayedBranch && !searchQuery.trim() && (
              <BranchDetailsPanel
                branchName={displayedBranch.branchName}
                worktreeId={displayedBranch.worktreeId}
                contextId={selectedProject.id}
                onNewIngestion={openIngestionModalEmpty}
              />
            )}
          </div>
        </div>
      </main>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        existingProjectNames={existingProjectNames}
      />

      {/* User Management Modal */}
      {userManagementProject && (
        <UserManagementModal
          isOpen={!!userManagementProject}
          onClose={() => setUserManagementProject(null)}
          project={userManagementProject}
        />
      )}

      {/* Ingestion Modal with source picker */}
      {selectedProject && (
        <IngestionModal
          projectName={selectedProject.name}
          projectId={selectedProject.id}
        />
      )}
    </div>
  );
}
