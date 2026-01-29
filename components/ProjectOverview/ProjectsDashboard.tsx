import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  ChevronDown,
  FolderOpen,
  Search,
} from 'lucide-react';
import { UserAvatar } from '../Dashboard/UserAvatar';
import { useProjects } from '../../contexts/ProjectsContext';
import { Project, ProjectFilter, ProjectSort, WorktreeWithBranches } from '../../types';
import { cn } from '../../utils/cn';
import { ProjectCreationModal } from './ProjectCreationModal';
import { UserManagementModal } from './UserManagementModal';
import { ProjectsFilterSidebar, DEFAULT_PROJECT_SIDEBAR_FILTERS } from './ProjectsFilterSidebar';
import type { ProjectSidebarFilters } from './ProjectsFilterSidebar';
import type { ProjectCreationForm } from '../../types/project';
import { RepoMindmap } from './RepoMindmap';
import { RepoListView } from './RepoListView';
import { getWorktreesForProject } from './repoMindmapData';
import { IngestionModal } from '../../pages/ContextDetailInspectorPage/components/IngestionModal';
import { useIngestion } from '../../contexts/IngestionContext';
import { BranchDetailsPanel } from './BranchDetailsPanel';

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
  const [userManagementProject, setUserManagementProject] = useState<Project | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<{ worktreeId: string; branchName: string } | null>(null);

  // Derive unique tags from all projects
  const allTags = useMemo(
    () => Array.from(new Set(projects.map((p) => p.label).filter((l): l is string => !!l))).sort(),
    [projects]
  );

  const activeFilterCount = (filter !== 'all' ? 1 : 0) + (sidebarFilters.quickFilter ? 1 : 0) + sidebarFilters.selectedTags.length;

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

  const handleCreateProject = (data: ProjectCreationForm) => {
    const newProject = createProject(data.name);
    // TODO: In future, pass full form data (description, type, repositories, etc.) to createProject
    // Navigate to the new project's detail page
    navigate(`/project/${newProject.id}`);
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

      {/* Header with title and View Controls */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Title */}
          <h1 className="text-lg font-semibold text-foreground">All Projects</h1>

          {/* Search and View Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-64 pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
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

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden p-6">
        <div className="flex gap-6 h-full">
          {/* Filter Sidebar */}
          <ProjectsFilterSidebar
            projects={displayedProjects}
            allTags={allTags}
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            activeFilterCount={activeFilterCount}
            onProjectClick={selectProject}
            onProjectOpen={(project) => navigate(`/project/${project.id}`)}
            onProjectShare={(project) => setUserManagementProject(project)}
            onProjectToggleStarred={(project) => updateProject(project.id, { starred: !project.starred })}
            onProjectArchive={(project) => updateProject(project.id, { archived: true })}
            onProjectUnarchive={(project) => updateProject(project.id, { archived: false })}
            onProjectDelete={(project) => deleteProject(project.id)}
            onCreateNew={() => setIsNewProjectModalOpen(true)}
            ownershipFilter={filter}
            onOwnershipFilterChange={setFilter}
          />

          {/* Repo Mindmap or Empty State */}
          <div className="flex-1 min-w-0 flex gap-0">
            <div className="flex-1 min-w-0">
            {selectedProject ? (
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
                  onBranchHover={handleBranchHover}
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

            {/* Branch Details Panel - always visible when project selected */}
            {selectedProject && displayedBranch && (
              <BranchDetailsPanel
                branchName={displayedBranch.branchName}
                worktreeId={displayedBranch.worktreeId}
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
