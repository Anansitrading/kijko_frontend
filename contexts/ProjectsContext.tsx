import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Project, ProjectFilter, ProjectSort, ProjectViewMode } from '../types';

// Mock data for demonstration
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Product User and Market Insights',
    icon: {
      type: 'emoji',
      value: '👥',
      backgroundColor: '#7c3aed',
    },
    createdAt: new Date('2025-08-12'),
    updatedAt: new Date('2025-08-12'),
    sourceCount: 14,
    isShared: true,
    sharedBy: 'Marketing Team',
    owner: 'marketing@kijko.io',
    description: 'Comprehensive analysis of user behavior and market trends',
    label: 'Marketing',
    color: '#7c3aed',
    starred: true,
    lastActiveUser: {
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
  },
  {
    id: '2',
    name: 'Technical Architecture Docs',
    icon: {
      type: 'emoji',
      value: '🏗️',
      backgroundColor: '#2563eb',
    },
    createdAt: new Date('2025-07-20'),
    updatedAt: new Date('2025-08-10'),
    sourceCount: 23,
    isShared: false,
    owner: 'current-user',
    description: 'System architecture and design documentation',
    label: 'Engineering',
    color: '#2563eb',
    lastActiveUser: {
      id: 'user-2',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
    },
  },
  {
    id: '3',
    name: 'Q3 Sprint Planning',
    icon: {
      type: 'emoji',
      value: '📋',
      backgroundColor: '#059669',
    },
    createdAt: new Date('2025-06-15'),
    updatedAt: new Date('2025-08-08'),
    sourceCount: 8,
    isShared: true,
    sharedBy: 'Product Team',
    owner: 'product@kijko.io',
    description: 'Sprint planning documents and retrospectives',
    label: 'Product',
    color: '#059669',
    archived: true,
    lastActiveUser: {
      id: 'user-3',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice@example.com',
    },
  },
];

interface ProjectsContextValue {
  projects: Project[];
  filteredProjects: Project[];
  filter: ProjectFilter;
  sort: ProjectSort;
  viewMode: ProjectViewMode;
  searchQuery: string;
  selectedProject: Project | null;
  setFilter: (filter: ProjectFilter) => void;
  setSort: (sort: ProjectSort) => void;
  setViewMode: (mode: ProjectViewMode) => void;
  setSearchQuery: (query: string) => void;
  selectProject: (project: Project | null) => void;
  createProject: (name: string) => Project;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [sort, setSort] = useState<ProjectSort>('recent');
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply filter
    if (filter === 'mine') {
      result = result.filter((p) => p.owner === 'current-user');
    } else if (filter === 'shared') {
      result = result.filter((p) => p.isShared && p.owner !== 'current-user');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sort) {
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sources':
          return b.sourceCount - a.sourceCount;
        default:
          return 0;
      }
    });

    return result;
  }, [projects, filter, sort, searchQuery]);

  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project);
  }, []);

  const createProject = useCallback((name: string): Project => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      icon: {
        type: 'initials',
        value: name.slice(0, 2).toUpperCase(),
        backgroundColor: '#3b82f6',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceCount: 0,
      isShared: false,
      owner: 'current-user',
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      )
    );
  }, []);

  const value: ProjectsContextValue = {
    projects,
    filteredProjects,
    filter,
    sort,
    viewMode,
    searchQuery,
    selectedProject,
    setFilter,
    setSort,
    setViewMode,
    setSearchQuery,
    selectProject,
    createProject,
    deleteProject,
    updateProject,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
