import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { UserAvatar } from '../Dashboard/UserAvatar';
import { useProjects } from '../../contexts/ProjectsContext';
import { Project, ProjectFilter, ProjectSort } from '../../types';
import { cn } from '../../utils/cn';
import { ProjectCard } from './ProjectCard';
import { ProjectCreationModal } from './ProjectCreationModal';
import { ProjectContextMenu } from './ProjectContextMenu';
import { UserManagementModal } from './UserManagementModal';
import { ProjectsFilterSidebar, DEFAULT_PROJECT_SIDEBAR_FILTERS } from './ProjectsFilterSidebar';
import type { ProjectSidebarFilters, DropTarget } from './ProjectsFilterSidebar';
import type { ProjectCreationForm } from '../../types/project';
import { setPendingFileForIngestion } from '../../utils/fileTransferStore';

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

export function ProjectsDashboard({ onProjectSelect, onOpenSettings, embedded = false }: ProjectsDashboardProps) {
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
    deleteProject,
    updateProject,
  } = useProjects();

  const [sidebarFilters, setSidebarFilters] = useState<ProjectSidebarFilters>(DEFAULT_PROJECT_SIDEBAR_FILTERS);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    project: Project;
    x: number;
    y: number;
  } | null>(null);
  const [userManagementProject, setUserManagementProject] = useState<Project | null>(null);

  // Navigate to project detail page
  const handleProjectClick = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  const handleCreateProject = (data: ProjectCreationForm) => {
    const newProject = createProject(data.name);
    // TODO: In future, pass full form data (description, type, repositories, etc.) to createProject
    // Navigate to the new project's detail page
    navigate(`/project/${newProject.id}`);
  };

  // Get existing project names for duplicate checking
  const existingProjectNames = filteredProjects.map(p => p.name);

  const handleMenuClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setContextMenu({
      project,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setContextMenu(null);
  };

  const handleToggleStarred = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      updateProject(id, { starred: !project.starred });
    }
  };

  const handleArchiveProject = (id: string) => {
    updateProject(id, { archived: true });
  };

  const handleUnarchiveProject = (id: string) => {
    updateProject(id, { archived: false });
  };

  const handleDropProject = (projectId: string, target: DropTarget) => {
    if (target.type === 'starred') {
      updateProject(projectId, { starred: true });
    } else if (target.type === 'archived') {
      updateProject(projectId, { archived: true });
    } else if (target.type === 'tag' && target.value) {
      updateProject(projectId, { label: target.value });
    }
  };

  const handleFileDropOnProject = (projectId: string, file: File) => {
    setPendingFileForIngestion(file, projectId);
    navigate(`/project/${projectId}?openIngestion=file`);
  };

  // Apply sidebar filters on top of context-filtered projects
  const displayedProjects = useMemo(() => {
    let result = [...filteredProjects];

    // Quick filter
    if (sidebarFilters.quickFilter === 'starred') {
      result = result.filter((p) => p.starred);
    } else if (sidebarFilters.quickFilter === 'archived') {
      result = result.filter((p) => p.archived);
    } else if (sidebarFilters.quickFilter === 'recent') {
      result = [...result].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    // Hide archived by default (unless explicitly viewing archive)
    if (sidebarFilters.quickFilter !== 'archived') {
      result = result.filter((p) => !p.archived);
    }

    // Tag filters (multi-select, OR logic)
    if (sidebarFilters.selectedTags.length > 0) {
      result = result.filter((p) => p.label && sidebarFilters.selectedTags.includes(p.label));
    }

    return result;
  }, [filteredProjects, sidebarFilters]);

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

            {/* New Project Button */}
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={18} />
              <span>Create new</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <ProjectsFilterSidebar
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            projects={projects}
            onDropProject={handleDropProject}
          />

          {/* Project List */}
          <div className="flex-1 min-w-0">
            {/* Section Title */}
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">
              {filter === 'all'
                ? 'All projects'
                : filter === 'mine'
                ? 'My projects'
                : 'Shared with me'}
            </h2>

            {displayedProjects.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="p-4 bg-muted/50 rounded-xl border border-border mb-4">
                  <FolderOpen size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No projects found
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {searchQuery
                    ? 'Try a different search query'
                    : 'Start by creating your first project to organize your sources'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    <span>Create new project</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    onClick={() => handleProjectClick(project)}
                    onMenuClick={(e) => handleMenuClick(e, project)}
                    onFileDrop={handleFileDropOnProject}
                  />
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                {displayedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="list"
                    onClick={() => handleProjectClick(project)}
                    onMenuClick={(e) => handleMenuClick(e, project)}
                    onFileDrop={handleFileDropOnProject}
                  />
                ))}
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

      {/* Context Menu */}
      {contextMenu && (
        <ProjectContextMenu
          project={contextMenu.project}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDeleteProject(contextMenu.project.id)}
          onConfigureIngestion={() => {
            navigate(`/project/${contextMenu.project.id}?openIngestion=true`);
            setContextMenu(null);
          }}
          onShare={() => {
            setUserManagementProject(contextMenu.project);
            setContextMenu(null);
          }}
          onUpdateProject={(updates) => {
            updateProject(contextMenu.project.id, updates);
          }}
          onToggleStarred={() => {
            handleToggleStarred(contextMenu.project.id);
            setContextMenu(null);
          }}
          onArchive={() => {
            handleArchiveProject(contextMenu.project.id);
            setContextMenu(null);
          }}
          onUnarchive={() => {
            handleUnarchiveProject(contextMenu.project.id);
            setContextMenu(null);
          }}
        />
      )}

      {/* User Management Modal */}
      {userManagementProject && (
        <UserManagementModal
          isOpen={!!userManagementProject}
          onClose={() => setUserManagementProject(null)}
          project={userManagementProject}
        />
      )}
    </div>
  );
}
