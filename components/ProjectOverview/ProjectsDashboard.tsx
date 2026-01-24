import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { useProjects } from '../../contexts/ProjectsContext';
import { Project, ProjectFilter, ProjectSort } from '../../types';
import { cn } from '../../utils/cn';
import { ProjectCard } from './ProjectCard';
import { ProjectCreationModal } from './ProjectCreationModal';
import { ProjectContextMenu } from './ProjectContextMenu';
import { UserManagementModal } from './UserManagementModal';
import type { ProjectCreationForm } from '../../types/project';

interface ProjectsDashboardProps {
  onProjectSelect: (project: Project) => void;
  onOpenSettings?: () => void;
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

export function ProjectsDashboard({ onProjectSelect, onOpenSettings }: ProjectsDashboardProps) {
  const navigate = useNavigate();
  const {
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
  } = useProjects();

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

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label || 'Sort';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
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

          {/* Search and New Button */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64 hidden md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
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

        {/* Filter Tabs and View Controls */}
        <div className="flex items-center justify-between px-6 pb-4">
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
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Section Title */}
        <h2 className="text-lg font-semibold text-muted-foreground mb-4">
          {filter === 'all'
            ? 'All projects'
            : filter === 'mine'
            ? 'My projects'
            : 'Shared with me'}
        </h2>

        {filteredProjects.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode="grid"
                onClick={() => handleProjectClick(project)}
                onMenuClick={(e) => handleMenuClick(e, project)}
              />
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode="list"
                onClick={() => handleProjectClick(project)}
                onMenuClick={(e) => handleMenuClick(e, project)}
              />
            ))}
          </div>
        )}
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
          onOpen={() => {
            handleProjectClick(contextMenu.project);
            setContextMenu(null);
          }}
          onShare={() => {
            setUserManagementProject(contextMenu.project);
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

      {/* Settings Button - Bottom Left */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-all shadow-lg group"
        >
          <Settings
            size={16}
            className="transition-transform duration-500 group-hover:rotate-90"
          />
          <span>Settings</span>
        </button>
      )}
    </div>
  );
}
