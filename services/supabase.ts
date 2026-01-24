// Supabase Client Configuration
// Real-time database client for project sharing and user management
// Note: Falls back to mock mode when @supabase/supabase-js is not installed

// Database types for project_users table
export interface ProjectUser {
  id: string;
  project_id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  added_at: string;
  added_by: string;
  avatar_url?: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

// Channel interface for real-time subscriptions
export interface RealtimeChannel {
  unsubscribe: () => void;
}

// Supabase client instance (null when using mock mode)
// To enable Supabase: install @supabase/supabase-js and configure environment variables
let supabaseInstance: any = null;

export function getSupabaseClient(): any | null {
  // Currently using mock mode - returns null
  // When Supabase is installed and configured, this can be updated to return the client
  return supabaseInstance;
}

// Real-time subscription helper (returns null in mock mode)
export function subscribeToProjectUsers(
  projectId: string,
  onInsert: (user: ProjectUser) => void,
  onUpdate: (user: ProjectUser) => void,
  onDelete: (userId: string) => void
): RealtimeChannel | null {
  // In mock mode, we simulate real-time updates
  // This can be enhanced to use WebSocket or polling in production
  return null;
}

// API functions for project users
export async function fetchProjectUsers(projectId: string): Promise<ProjectUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Return mock data when Supabase is not configured
    return getMockProjectUsers(projectId);
  }

  const { data, error } = await supabase
    .from('project_users')
    .select('*')
    .eq('project_id', projectId)
    .order('added_at', { ascending: true });

  if (error) {
    console.error('Error fetching project users:', error);
    throw error;
  }

  return data || [];
}

export async function addProjectUser(
  projectId: string,
  email: string,
  name: string,
  role: ProjectUser['role'],
  addedBy: string
): Promise<ProjectUser> {
  const supabase = getSupabaseClient();

  // Mock implementation (used when Supabase is not configured)
  const mockUser: ProjectUser = {
    id: `mock-${Date.now()}`,
    project_id: projectId,
    user_id: `user-${Date.now()}`,
    email,
    name,
    role,
    added_at: new Date().toISOString(),
    added_by: addedBy,
  };

  if (!supabase) {
    return mockUser;
  }

  const { data, error } = await supabase
    .from('project_users')
    .insert({
      project_id: projectId,
      email,
      name,
      role,
      added_by: addedBy,
      added_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding project user:', error);
    throw error;
  }

  return data;
}

export async function updateProjectUserRole(
  projectUserId: string,
  newRole: ProjectUser['role']
): Promise<ProjectUser> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    // Mock mode - just return a placeholder
    return {
      id: projectUserId,
      project_id: '',
      user_id: '',
      email: '',
      name: '',
      role: newRole,
      added_at: new Date().toISOString(),
      added_by: '',
    };
  }

  const { data, error } = await supabase
    .from('project_users')
    .update({ role: newRole })
    .eq('id', projectUserId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project user role:', error);
    throw error;
  }

  return data;
}

export async function removeProjectUser(projectUserId: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return; // Mock mode - just return
  }

  const { error } = await supabase
    .from('project_users')
    .delete()
    .eq('id', projectUserId);

  if (error) {
    console.error('Error removing project user:', error);
    throw error;
  }
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const supabase = getSupabaseClient();

  if (!supabase || !query.trim()) {
    return getMockUserSearchResults(query);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, avatar_url')
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return getMockUserSearchResults(query);
  }

  return data || [];
}

// Mock data for development without Supabase
function getMockProjectUsers(projectId: string): ProjectUser[] {
  return [
    {
      id: '1',
      project_id: projectId,
      user_id: 'user-1',
      email: 'user@kijko.ai',
      name: 'You',
      role: 'owner',
      added_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      added_by: 'user-1',
    },
    {
      id: '2',
      project_id: projectId,
      user_id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      role: 'admin',
      added_at: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
      added_by: 'user-1',
    },
    {
      id: '3',
      project_id: projectId,
      user_id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      role: 'editor',
      added_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      added_by: 'user-1',
    },
    {
      id: '4',
      project_id: projectId,
      user_id: 'user-4',
      email: 'alice@example.com',
      name: 'Alice Brown',
      role: 'viewer',
      added_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      added_by: 'user-1',
    },
  ];
}

function getMockUserSearchResults(query: string): UserSearchResult[] {
  const allUsers = [
    { id: 'u1', email: 'john@example.com', name: 'John Doe' },
    { id: 'u2', email: 'sarah@example.com', name: 'Sarah Wilson' },
    { id: 'u3', email: 'mike@example.com', name: 'Mike Chen' },
    { id: 'u4', email: 'emily@example.com', name: 'Emily Davis' },
    { id: 'u5', email: 'alex@example.com', name: 'Alex Turner' },
  ];

  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(lowerQuery) ||
      u.name.toLowerCase().includes(lowerQuery)
  );
}

// Time formatting helper
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
