import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { UserAvatar } from '../Dashboard/UserAvatar';
import { useProjects } from '../../contexts/ProjectsContext';
import { Project, ProjectFilter, ProjectSort, WorktreeWithBranches } from '../../types';
import { cn } from '../../utils/cn';
import { ProjectCreationModal } from './ProjectCreationModal';
import { UserManagementModal } from './UserManagementModal';
import { ProjectsFilterSidebar, DEFAULT_PROJECT_SIDEBAR_FILTERS } from './ProjectsFilterSidebar';
import type { ProjectSidebarFilters, DropTarget } from './ProjectsFilterSidebar';
import type { ProjectCreationForm } from '../../types/project';
import { RepoMindmap } from './RepoMindmap';
import { RepoListView } from './RepoListView';
import { getWorktreesForProject } from './repoMindmapData';
import { IngestionWizard } from '../Hypervisa/IngestionWizard';

interface ProjectsDashboardProps {
  onProjectSelect: (project: Project) => void;
  onOpenSettings?: () => void;
  /** When true, hides the main header (logo, search, new button). Used when embedded in Dashboard with tabs. */
  embedded?: boolean;
}

const FILTER_TABS: { id: ProjectFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'My projects' },
  { id: 'shared', label: 'Shared with me' },
];

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

  const [sidebarFilters, setSidebarFilters] = useState<ProjectSidebarFilters>(DEFAULT_PROJECT_SIDEBAR_FILTERS);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [userManagementProject, setUserManagementProject] = useState<Project | null>(null);
  const [ingestionWorktreeId, setIngestionWorktreeId] = useState<string | null>(null);

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
    (worktreeId: string) => {
      setIngestionWorktreeId(worktreeId);
    },
    [],
  );

  // Show repo mindmap in main content area
  const handleSidebarProjectClick = (project: Project) => {
    selectProject(project);
  };

  const handleCreateProject = (data: ProjectCreationForm) => {
    const newProject = createProject(data.name);
    // TODO: In future, pass full form data (description, type, repositories, etc.) to createProject
    // Navigate to the new project's detail page
    navigate(`/project/${newProject.id}`);
  };

  // Get existing project names for duplicate checking
  const existingProjectNames = filteredProjects.map(p => p.name);

  const handleDropProject = (projectId: string, target: DropTarget) => {
    if (target.type === 'starred') {
      updateProject(projectId, { starred: true });
    } else if (target.type === 'archived') {
      updateProject(projectId, { archived: true });
    } else if (target.type === 'tag' && target.value) {
      updateProject(projectId, { label: target.value });
    }
  };

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

      {/* Filter Tabs and View Controls */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                  filter === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64 hidden md:block">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
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
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            projects={filteredProjects}
            onDropProject={handleDropProject}
            onProjectClick={handleSidebarProjectClick}
            onCreateNew={() => setIsNewProjectModalOpen(true)}
          />

          {/* Repo Mindmap or Empty State */}
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
                  onBranchNewIngestion={() => navigate(`/project/${selectedProject.id}`)}
                  onBranchDetails={() => navigate(`/project/${selectedProject.id}`)}
                  onRenameBranch={(worktreeId, oldName, newName) => handleRenameBranch(selectedProject.id, worktreeId, oldName, newName)}
                  onAddBranch={(worktreeId) => handleAddBranch(selectedProject.id, worktreeId)}
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
                  onBranchNewIngestion={() => navigate(`/project/${selectedProject.id}`)}
                  onBranchDetails={() => navigate(`/project/${selectedProject.id}`)}
                  onRenameBranch={(worktreeId, oldName, newName) => handleRenameBranch(selectedProject.id, worktreeId, oldName, newName)}
                  onAddBranch={(worktreeId) => handleAddBranch(selectedProject.id, worktreeId)}
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

      {/* Ingestion Wizard Modal */}
      {selectedProject && ingestionWorktreeId && (
        <IngestionWizard
          isOpen={!!ingestionWorktreeId}
          onClose={() => setIngestionWorktreeId(null)}
          file={{
            id: `worktree-${ingestionWorktreeId}`,
            name: worktreesOverrides[selectedProject.id]?.find(wt => wt.id === ingestionWorktreeId)?.name
              ?? getWorktreesForProject(selectedProject.id).find(wt => wt.id === ingestionWorktreeId)?.name
              ?? 'New Ingestion',
            size: '',
          }}
          projectName={selectedProject.name}
          onSubmit={async (config) => {
            console.log('Ingestion config submitted for worktree:', ingestionWorktreeId, config);
            setIngestionWorktreeId(null);
          }}
        />
      )}
    </div>
  );
}
