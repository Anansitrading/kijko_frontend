import { useState, useEffect } from 'react';
import { Project } from '../types';

interface UseProjectDataReturn {
  data: Project | null;
  isLoading: boolean;
  error: Error | null;
}

// Mock project data - will be replaced with actual API calls
const mockProjects: Record<string, Project> = {
  '1': {
    id: '1',
    name: 'Hypervisa Dashboard',
    icon: { type: 'emoji', value: '📊', backgroundColor: '#3b82f6' },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
    sourceCount: 156,
    isShared: true,
    owner: 'John Doe',
    description: 'Main dashboard for monitoring and analytics',
  },
  '2': {
    id: '2',
    name: 'API Integration',
    icon: { type: 'emoji', value: '🔗', backgroundColor: '#10b981' },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-11-28'),
    sourceCount: 89,
    isShared: false,
    owner: 'John Doe',
    description: 'REST and GraphQL API integrations',
  },
  '3': {
    id: '3',
    name: 'ML Pipeline',
    icon: { type: 'emoji', value: '🧠', backgroundColor: '#8b5cf6' },
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-12-05'),
    sourceCount: 234,
    isShared: true,
    sharedBy: 'Jane Smith',
    owner: 'Jane Smith',
    description: 'Machine learning data processing pipeline',
  },
};

/**
 * Custom hook for loading project data based on project ID
 * @param projectId - The ID of the project to load
 * @returns Object containing data, loading state, and error
 */
export function useProjectData(projectId: string | undefined): UseProjectDataReturn {
  const [data, setData] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setData(null);
      setIsLoading(false);
      setError(new Error('No project ID provided'));
      return;
    }

    // Reset state when projectId changes
    setIsLoading(true);
    setError(null);
    setData(null);

    // Simulate API call with delay
    const fetchProject = async () => {
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const project = mockProjects[projectId];

        if (!project) {
          throw new Error(`Project with ID "${projectId}" not found`);
        }

        setData(project);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load project'));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { data, isLoading, error };
}

export default useProjectData;
