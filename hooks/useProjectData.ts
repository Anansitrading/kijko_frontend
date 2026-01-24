import { useMemo } from 'react';
import { useProjects } from '../contexts/ProjectsContext';
import { Project } from '../types';

interface UseProjectDataReturn {
  data: Project | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for loading project data based on project ID
 * Reads from ProjectsContext to ensure consistency with created projects
 * @param projectId - The ID of the project to load
 * @returns Object containing data, loading state, and error
 */
export function useProjectData(projectId: string | undefined): UseProjectDataReturn {
  const { projects } = useProjects();

  const result = useMemo(() => {
    if (!projectId) {
      return {
        data: null,
        isLoading: false,
        error: new Error('No project ID provided'),
      };
    }

    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return {
        data: null,
        isLoading: false,
        error: new Error(`Project with ID "${projectId}" not found`),
      };
    }

    return {
      data: project,
      isLoading: false,
      error: null,
    };
  }, [projectId, projects]);

  return result;
}

export default useProjectData;
