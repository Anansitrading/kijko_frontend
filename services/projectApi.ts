/**
 * Project API Service
 * Handles all API calls for project CRUD operations, repositories, members, and ingestion
 */

import type {
  Project,
  ProjectRepository,
  ProjectMember,
  IngestionProgress,
  CreateProjectRequest,
  CreateProjectResponse,
  AddRepositoryRequest,
  AddMemberRequest,
  StartIngestionRequest,
  StartIngestionResponse,
  PaginatedResponse,
  ApiError,
  UpdateProject,
  ProjectWithRelations,
  ProjectStats,
  IngestionMetrics,
  TeamMemberInvitation,
  NotificationLevel,
  ProjectMemberRole,
  RepoInfo,
  RepoValidation,
  RecentRepo,
  OAuthConnection,
  GitProvider,
} from '../types/project';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = '/api';
const MOCK_DELAY_MS = 500;

// Helper to simulate API delay
const delay = (ms: number = MOCK_DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate UUIDs
const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// =============================================================================
// Mock Data Store (for development)
// =============================================================================

const mockProjects: Map<string, Project> = new Map();
const mockRepositories: Map<string, ProjectRepository[]> = new Map();
const mockMembers: Map<string, ProjectMember[]> = new Map();
const mockIngestionProgress: Map<string, IngestionProgress> = new Map();

// Initialize with sample data
function initializeMockData() {
  const sampleProject: Project = {
    id: 'proj-sample-001',
    userId: 'user-001',
    organizationId: 'org-001',
    name: 'Sample Project',
    description: 'A sample project for demonstration',
    type: 'repository',
    status: 'active',
    privacy: 'private',
    chunkingStrategy: 'semantic',
    includeMetadata: true,
    anonymizeSecrets: true,
    totalRepos: 2,
    totalFiles: 156,
    originalTokens: 524288,
    optimizedTokens: 26214,
    ingestionTimeSeconds: 45,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  };
  mockProjects.set(sampleProject.id, sampleProject);

  mockRepositories.set(sampleProject.id, [
    {
      id: 'repo-001',
      projectId: sampleProject.id,
      provider: 'github',
      repositoryUrl: 'https://github.com/example/frontend',
      repositoryName: 'example/frontend',
      branch: 'main',
      status: 'connected',
      lastSyncAt: new Date('2026-01-20'),
      lastCommitHash: 'abc123def',
      fileCount: 89,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-20'),
    },
    {
      id: 'repo-002',
      projectId: sampleProject.id,
      provider: 'github',
      repositoryUrl: 'https://github.com/example/backend',
      repositoryName: 'example/backend',
      branch: 'main',
      status: 'connected',
      lastSyncAt: new Date('2026-01-20'),
      lastCommitHash: '456xyz789',
      fileCount: 67,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-20'),
    },
  ]);

  mockMembers.set(sampleProject.id, [
    {
      id: 'member-001',
      projectId: sampleProject.id,
      userId: 'user-001',
      email: 'owner@example.com',
      name: 'Project Owner',
      role: 'admin',
      notifyOnIngestion: true,
      notifyOnError: true,
      notifyOnTeamChanges: true,
      invitedAt: new Date('2026-01-15'),
      acceptedAt: new Date('2026-01-15'),
      lastActiveAt: new Date('2026-01-24'),
    },
  ]);
}

initializeMockData();

// =============================================================================
// Project CRUD Operations
// =============================================================================

/**
 * POST /api/projects - Create a new project
 */
export async function createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
  await delay();

  const now = new Date();
  const project: Project = {
    id: generateId(),
    userId: 'current-user', // Would come from auth context
    organizationId: request.organizationId || 'default-org',
    name: request.name,
    description: request.description,
    type: request.type,
    status: 'draft',
    privacy: request.privacy || 'private',
    chunkingStrategy: request.chunkingStrategy || 'semantic',
    includeMetadata: request.includeMetadata ?? true,
    anonymizeSecrets: request.anonymizeSecrets ?? true,
    totalRepos: 0,
    totalFiles: 0,
    createdAt: now,
    updatedAt: now,
  };

  mockProjects.set(project.id, project);
  mockRepositories.set(project.id, []);
  mockMembers.set(project.id, []);

  // Determine next steps based on project type
  const nextSteps: CreateProjectResponse['nextSteps'] = [];
  if (project.type === 'repository') {
    nextSteps.push('source_config', 'team_setup', 'settings', 'review');
  } else if (project.type === 'files') {
    nextSteps.push('source_config', 'team_setup', 'settings', 'review');
  } else {
    nextSteps.push('source_config', 'team_setup', 'settings', 'review');
  }

  return { project, nextSteps };
}

/**
 * GET /api/projects/:id - Get project details
 */
export async function getProject(projectId: string): Promise<Project> {
  await delay();

  const project = mockProjects.get(projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  return project;
}

/**
 * GET /api/projects/:id/full - Get project with all relations
 */
export async function getProjectWithRelations(projectId: string): Promise<ProjectWithRelations> {
  await delay();

  const project = mockProjects.get(projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  return {
    ...project,
    repositories: mockRepositories.get(projectId) || [],
    members: mockMembers.get(projectId) || [],
    currentIngestion: mockIngestionProgress.get(projectId),
  };
}

/**
 * PUT /api/projects/:id - Update project
 */
export async function updateProject(projectId: string, updates: UpdateProject): Promise<Project> {
  await delay();

  const project = mockProjects.get(projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const updatedProject: Project = {
    ...project,
    ...updates,
    updatedAt: new Date(),
  };

  mockProjects.set(projectId, updatedProject);
  return updatedProject;
}

/**
 * DELETE /api/projects/:id - Delete project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean }> {
  await delay();

  const project = mockProjects.get(projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  mockProjects.delete(projectId);
  mockRepositories.delete(projectId);
  mockMembers.delete(projectId);
  mockIngestionProgress.delete(projectId);

  return { success: true };
}

/**
 * GET /api/projects - List all projects for current user
 */
export async function listProjects(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Project>> {
  await delay();

  const allProjects = Array.from(mockProjects.values());
  const total = allProjects.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = allProjects.slice(start, end);

  return {
    data,
    total,
    page,
    pageSize,
    hasMore: end < total,
  };
}

/**
 * GET /api/projects/stats - Get project statistics
 */
export async function getProjectStats(): Promise<ProjectStats> {
  await delay();

  const projects = Array.from(mockProjects.values());

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    processingProjects: projects.filter(p => p.status === 'processing').length,
    errorProjects: projects.filter(p => p.status === 'error').length,
    totalTokens: projects.reduce((sum, p) => sum + (p.optimizedTokens || 0), 0),
    totalFiles: projects.reduce((sum, p) => sum + p.totalFiles, 0),
  };
}

// =============================================================================
// Repository Operations
// =============================================================================

/**
 * POST /api/projects/:id/repositories - Add repository to project
 */
export async function addRepository(request: AddRepositoryRequest): Promise<ProjectRepository> {
  await delay();

  const project = mockProjects.get(request.projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${request.projectId} not found`);
  }

  const now = new Date();
  const repository: ProjectRepository = {
    id: generateId(),
    projectId: request.projectId,
    provider: request.provider,
    repositoryUrl: request.repositoryUrl,
    repositoryName: extractRepoName(request.repositoryUrl),
    branch: request.branch,
    status: 'pending',
    includePaths: request.includePaths,
    excludePaths: request.excludePaths,
    createdAt: now,
    updatedAt: now,
  };

  const repos = mockRepositories.get(request.projectId) || [];
  repos.push(repository);
  mockRepositories.set(request.projectId, repos);

  // Update project repo count
  project.totalRepos = repos.length;
  project.updatedAt = now;
  mockProjects.set(request.projectId, project);

  return repository;
}

/**
 * GET /api/projects/:id/repositories - List project repositories
 */
export async function listRepositories(projectId: string): Promise<ProjectRepository[]> {
  await delay();

  const repos = mockRepositories.get(projectId);
  if (!repos) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  return repos;
}

/**
 * DELETE /api/projects/:id/repositories/:repoId - Remove repository
 */
export async function removeRepository(projectId: string, repositoryId: string): Promise<{ success: boolean }> {
  await delay();

  const repos = mockRepositories.get(projectId);
  if (!repos) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const index = repos.findIndex(r => r.id === repositoryId);
  if (index === -1) {
    throw createApiError('REPOSITORY_NOT_FOUND', `Repository with ID ${repositoryId} not found`);
  }

  repos.splice(index, 1);
  mockRepositories.set(projectId, repos);

  // Update project repo count
  const project = mockProjects.get(projectId);
  if (project) {
    project.totalRepos = repos.length;
    project.updatedAt = new Date();
    mockProjects.set(projectId, project);
  }

  return { success: true };
}

// =============================================================================
// Team Member Operations
// =============================================================================

/**
 * POST /api/projects/:id/members - Add team member
 */
export async function addMember(request: AddMemberRequest): Promise<ProjectMember> {
  await delay();

  const project = mockProjects.get(request.projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${request.projectId} not found`);
  }

  const members = mockMembers.get(request.projectId) || [];

  // Check for duplicate
  if (members.some(m => m.email === request.email)) {
    throw createApiError('MEMBER_EXISTS', `Member with email ${request.email} already exists`);
  }

  const now = new Date();
  const member: ProjectMember = {
    id: generateId(),
    projectId: request.projectId,
    userId: generateId(), // Would be resolved from email
    email: request.email,
    role: request.role,
    notifyOnIngestion: request.notifyOnIngestion ?? true,
    notifyOnError: request.notifyOnError ?? true,
    notifyOnTeamChanges: request.notifyOnTeamChanges ?? true,
    invitedAt: now,
  };

  members.push(member);
  mockMembers.set(request.projectId, members);

  return member;
}

/**
 * GET /api/projects/:id/members - List project members
 */
export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  return members;
}

/**
 * PUT /api/projects/:id/members/:memberId - Update member role
 */
export async function updateMember(
  projectId: string,
  memberId: string,
  updates: Partial<Pick<ProjectMember, 'role' | 'notifyOnIngestion' | 'notifyOnError' | 'notifyOnTeamChanges'>>
): Promise<ProjectMember> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const member = members.find(m => m.id === memberId);
  if (!member) {
    throw createApiError('MEMBER_NOT_FOUND', `Member with ID ${memberId} not found`);
  }

  Object.assign(member, updates);
  mockMembers.set(projectId, members);

  return member;
}

/**
 * DELETE /api/projects/:id/members/:memberId - Remove member
 */
export async function removeMember(projectId: string, memberId: string): Promise<{ success: boolean }> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const index = members.findIndex(m => m.id === memberId);
  if (index === -1) {
    throw createApiError('MEMBER_NOT_FOUND', `Member with ID ${memberId} not found`);
  }

  members.splice(index, 1);
  mockMembers.set(projectId, members);

  return { success: true };
}

// =============================================================================
// Team Invitation Operations
// =============================================================================

/** Individual invitation result */
export interface InvitationResult {
  email: string;
  status: 'sent' | 'pending' | 'failed';
  memberId?: string;
  error?: string;
}

/** Bulk invitation response */
export interface BulkInvitationResponse {
  success: boolean;
  results: InvitationResult[];
  totalSent: number;
  totalFailed: number;
}

/**
 * POST /api/projects/:id/invitations - Send team invitations
 *
 * Sends invitation emails to team members and creates pending member records.
 * Members remain in pending state until they accept the invitation.
 */
export async function sendTeamInvitations(
  projectId: string,
  invitations: TeamMemberInvitation[]
): Promise<BulkInvitationResponse> {
  await delay();

  const project = mockProjects.get(projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const members = mockMembers.get(projectId) || [];
  const results: InvitationResult[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const invitation of invitations) {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitation.email)) {
      results.push({
        email: invitation.email,
        status: 'failed',
        error: 'Invalid email format',
      });
      totalFailed++;
      continue;
    }

    // Check for existing member
    if (members.some(m => m.email.toLowerCase() === invitation.email.toLowerCase())) {
      results.push({
        email: invitation.email,
        status: 'failed',
        error: 'Member already exists',
      });
      totalFailed++;
      continue;
    }

    // Convert notification level to individual flags
    const notifyOnIngestion = invitation.notificationLevel !== 'disabled';
    const notifyOnError = invitation.notificationLevel !== 'disabled';
    const notifyOnTeamChanges = invitation.notificationLevel === 'real-time';

    // Create pending member record
    const now = new Date();
    const member: ProjectMember = {
      id: generateId(),
      projectId: projectId,
      userId: '', // Empty until they accept
      email: invitation.email,
      role: invitation.role,
      notifyOnIngestion,
      notifyOnError,
      notifyOnTeamChanges,
      invitedAt: now,
      // acceptedAt is undefined (pending)
    };

    members.push(member);

    // In a real implementation, this would queue an email via SendGrid/SES
    console.log(`[Mock] Sending invitation email to ${invitation.email} for project ${project.name}`);

    results.push({
      email: invitation.email,
      status: 'sent',
      memberId: member.id,
    });
    totalSent++;
  }

  mockMembers.set(projectId, members);

  return {
    success: totalFailed === 0,
    results,
    totalSent,
    totalFailed,
  };
}

/**
 * POST /api/projects/:id/invitations/:memberId/resend - Resend invitation
 */
export async function resendInvitation(projectId: string, memberId: string): Promise<InvitationResult> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const member = members.find(m => m.id === memberId);
  if (!member) {
    throw createApiError('MEMBER_NOT_FOUND', `Member with ID ${memberId} not found`);
  }

  if (member.acceptedAt) {
    throw createApiError('ALREADY_ACCEPTED', 'Member has already accepted the invitation');
  }

  // In a real implementation, this would resend the email
  console.log(`[Mock] Resending invitation email to ${member.email}`);

  return {
    email: member.email,
    status: 'sent',
    memberId: member.id,
  };
}

/**
 * DELETE /api/projects/:id/invitations/:memberId - Cancel pending invitation
 */
export async function cancelInvitation(projectId: string, memberId: string): Promise<{ success: boolean }> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  const member = members.find(m => m.id === memberId);
  if (!member) {
    throw createApiError('MEMBER_NOT_FOUND', `Member with ID ${memberId} not found`);
  }

  if (member.acceptedAt) {
    throw createApiError('ALREADY_ACCEPTED', 'Cannot cancel - member has already accepted');
  }

  const index = members.findIndex(m => m.id === memberId);
  members.splice(index, 1);
  mockMembers.set(projectId, members);

  return { success: true };
}

/**
 * GET /api/projects/:id/invitations/pending - Get pending invitations
 */
export async function getPendingInvitations(projectId: string): Promise<ProjectMember[]> {
  await delay();

  const members = mockMembers.get(projectId);
  if (!members) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${projectId} not found`);
  }

  return members.filter(m => !m.acceptedAt);
}

// =============================================================================
// Ingestion Operations
// =============================================================================

/**
 * POST /api/projects/:id/ingest - Start ingestion process
 */
export async function startIngestion(request: StartIngestionRequest): Promise<StartIngestionResponse> {
  await delay();

  const project = mockProjects.get(request.projectId);
  if (!project) {
    throw createApiError('PROJECT_NOT_FOUND', `Project with ID ${request.projectId} not found`);
  }

  // Check if already processing (409 Conflict)
  if (project.status === 'processing') {
    throw createApiError(
      'ALREADY_PROCESSING',
      'Project is already being processed. Please wait for the current ingestion to complete.'
    );
  }

  // Validate project is in draft status (unless forcing reprocess)
  if (project.status !== 'draft' && !request.forceReprocess) {
    throw createApiError(
      'INVALID_STATUS',
      `Cannot start ingestion: project status is '${project.status}'. Use forceReprocess option to re-ingest.`
    );
  }

  // Update project status
  project.status = 'processing';
  project.updatedAt = new Date();
  mockProjects.set(request.projectId, project);

  const now = new Date();
  const jobId = generateId();

  // Create initial ingestion progress record
  const progress: IngestionProgress = {
    id: jobId,
    projectId: request.projectId,
    phase: 'repository_fetch',
    progressPercent: 0,
    message: 'Initializing ingestion process...',
    metrics: {
      filesProcessed: 0,
      totalFiles: 0,
      tokensProcessed: 0,
      bytesProcessed: 0,
      chunksCreated: 0,
      errorsEncountered: 0,
    },
    startedAt: now,
    estimatedCompletionAt: new Date(now.getTime() + 60000), // +1 minute estimate
  };

  mockIngestionProgress.set(request.projectId, progress);

  // Return response with WebSocket URL for real-time updates
  return {
    jobId,
    projectId: request.projectId,
    status: 'processing',
    wsNamespaceUrl: `/api/projects/${request.projectId}/ws`,
    estimatedDurationSeconds: 60,
  };
}

/**
 * GET /api/projects/:id/progress - Get current ingestion progress
 * Used for state recovery on WebSocket reconnection and polling fallback
 */
export async function getIngestionProgress(projectId: string): Promise<IngestionProgress | null> {
  await delay(200); // Faster for polling

  return mockIngestionProgress.get(projectId) || null;
}

/**
 * PUT /api/projects/:id/progress - Update ingestion progress
 * Called by the server during ingestion to persist progress for recovery
 */
export async function updateIngestionProgress(
  projectId: string,
  updates: Partial<Omit<IngestionProgress, 'id' | 'projectId'>>
): Promise<IngestionProgress> {
  await delay(100); // Fast for real-time updates

  const existing = mockIngestionProgress.get(projectId);
  if (!existing) {
    throw createApiError('NO_ACTIVE_INGESTION', 'No active ingestion to update');
  }

  const updated: IngestionProgress = {
    ...existing,
    ...updates,
  };

  mockIngestionProgress.set(projectId, updated);
  return updated;
}

/**
 * POST /api/projects/:id/progress/snapshot - Save metrics snapshot
 * Called every 5 seconds during ingestion for recovery purposes
 */
export async function saveProgressSnapshot(
  projectId: string,
  metrics: IngestionMetrics
): Promise<{ success: boolean; timestamp: Date }> {
  await delay(50); // Very fast for frequent snapshots

  const existing = mockIngestionProgress.get(projectId);
  if (!existing) {
    return { success: false, timestamp: new Date() };
  }

  existing.metrics = metrics;
  mockIngestionProgress.set(projectId, existing);

  return { success: true, timestamp: new Date() };
}

/**
 * POST /api/projects/:id/progress/complete - Mark ingestion as complete
 * Called when ingestion finishes successfully
 */
export async function completeIngestion(
  projectId: string,
  result: {
    metrics: IngestionMetrics;
    totalDurationSeconds: number;
  }
): Promise<{ success: boolean }> {
  await delay(100);

  const progress = mockIngestionProgress.get(projectId);
  if (!progress) {
    throw createApiError('NO_ACTIVE_INGESTION', 'No active ingestion to complete');
  }

  // Update progress record
  progress.progressPercent = 100;
  progress.completedAt = new Date();
  progress.metrics = result.metrics;
  mockIngestionProgress.set(projectId, progress);

  // Update project status
  const project = mockProjects.get(projectId);
  if (project) {
    project.status = 'active';
    project.optimizedTokens = result.metrics.tokensProcessed;
    project.totalFiles = result.metrics.totalFiles;
    project.ingestionTimeSeconds = result.totalDurationSeconds;
    project.updatedAt = new Date();
    mockProjects.set(projectId, project);
  }

  return { success: true };
}

/**
 * POST /api/projects/:id/cancel-ingestion - Cancel ongoing ingestion
 */
export async function cancelIngestion(projectId: string): Promise<{ success: boolean }> {
  await delay();

  const progress = mockIngestionProgress.get(projectId);
  if (!progress) {
    throw createApiError('NO_ACTIVE_INGESTION', 'No active ingestion to cancel');
  }

  mockIngestionProgress.delete(projectId);

  // Reset project status
  const project = mockProjects.get(projectId);
  if (project) {
    project.status = 'draft';
    project.updatedAt = new Date();
    mockProjects.set(projectId, project);
  }

  return { success: true };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * POST /api/projects/validate-name - Validate project name
 */
export async function validateProjectName(name: string): Promise<{ valid: boolean; error?: string }> {
  await delay(200);

  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Project name must be at least 3 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Project name cannot exceed 50 characters' };
  }

  // Check for duplicates
  const exists = Array.from(mockProjects.values()).some(
    p => p.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    return { valid: false, error: 'A project with this name already exists' };
  }

  return { valid: true };
}

/**
 * POST /api/projects/validate-repository - Validate repository URL
 */
export async function validateRepository(url: string): Promise<{
  valid: boolean;
  error?: string;
  provider?: string;
  repoName?: string;
}> {
  await delay(300);

  if (!url) {
    return { valid: false, error: 'Repository URL is required' };
  }

  const githubMatch = url.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  const gitlabMatch = url.match(/gitlab\.com[/:]([^/]+\/[^/.]+)/);
  const bitbucketMatch = url.match(/bitbucket\.org[/:]([^/]+\/[^/.]+)/);

  if (githubMatch) {
    return { valid: true, provider: 'github', repoName: githubMatch[1] };
  }

  if (gitlabMatch) {
    return { valid: true, provider: 'gitlab', repoName: gitlabMatch[1] };
  }

  if (bitbucketMatch) {
    return { valid: true, provider: 'bitbucket', repoName: bitbucketMatch[1] };
  }

  return { valid: false, error: 'Invalid repository URL. Supported: GitHub, GitLab, Bitbucket' };
}

// =============================================================================
// Utilities
// =============================================================================

function extractRepoName(url: string): string {
  const match = url.match(/[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? match[1] : url;
}

function createApiError(code: string, message: string, field?: string): ApiError {
  return { code, message, field };
}

// Export error type check
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// =============================================================================
// Step 2: Repository & Files API
// =============================================================================

// Mock recent repos data
const mockRecentRepos: RecentRepo[] = [
  {
    repoUrl: 'https://github.com/anthropics/claude-code',
    repoName: 'claude-code',
    lastAnalyzed: new Date('2026-01-22'),
    usageCount: 5,
    provider: 'github',
  },
  {
    repoUrl: 'https://github.com/vercel/next.js',
    repoName: 'next.js',
    lastAnalyzed: new Date('2026-01-18'),
    usageCount: 3,
    provider: 'github',
  },
  {
    repoUrl: 'https://github.com/facebook/react',
    repoName: 'react',
    lastAnalyzed: new Date('2026-01-10'),
    usageCount: 2,
    provider: 'github',
  },
];

// Mock OAuth connections
const mockOAuthConnections: OAuthConnection[] = [];

/**
 * GET /api/users/:userId/recent-repos - Get recent repositories
 */
export async function getRecentRepos(userId: string): Promise<RecentRepo[]> {
  await delay(200);
  return mockRecentRepos.slice(0, 5);
}

/**
 * POST /api/repositories/validate-full - Full repository validation with metadata
 */
export async function validateRepositoryFull(url: string): Promise<RepoValidation> {
  await delay(500);

  if (!url) {
    return { valid: false, error: 'Repository URL is required' };
  }

  // Parse the URL to extract provider and repo name
  const githubMatch = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  const gitlabMatch = url.match(/gitlab\.com[/:]([^/]+)\/([^/.]+)/);
  const bitbucketMatch = url.match(/bitbucket\.org[/:]([^/]+)\/([^/.]+)/);

  let provider: GitProvider;
  let owner: string;
  let name: string;

  if (githubMatch) {
    provider = 'github';
    owner = githubMatch[1];
    name = githubMatch[2];
  } else if (gitlabMatch) {
    provider = 'gitlab';
    owner = gitlabMatch[1];
    name = gitlabMatch[2];
  } else if (bitbucketMatch) {
    provider = 'bitbucket';
    owner = bitbucketMatch[1];
    name = bitbucketMatch[2];
  } else {
    return { valid: false, error: 'Invalid repository URL. Supported: GitHub, GitLab, Bitbucket' };
  }

  // Simulate checking if repo is private (randomly for demo)
  const isPrivate = Math.random() > 0.7;

  // If private and not authenticated, return auth required error
  const hasAuth = mockOAuthConnections.some(c => c.provider === provider && c.connected);
  if (isPrivate && !hasAuth) {
    return {
      valid: false,
      error: 'This repository is private. Please authenticate to access it.',
    };
  }

  // Return mock repo info
  const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java'];
  const repoInfo: RepoInfo = {
    name,
    fullName: `${owner}/${name}`,
    provider,
    url,
    defaultBranch: 'main',
    commitsPerMonth: Math.floor(Math.random() * 200) + 20,
    fileCount: Math.floor(Math.random() * 500) + 50,
    locEstimate: Math.floor(Math.random() * 100000) + 5000,
    primaryLanguage: languages[Math.floor(Math.random() * languages.length)],
    lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    isPrivate,
    stars: Math.floor(Math.random() * 5000),
    description: `A sample ${name} repository for demonstration`,
  };

  return { valid: true, info: repoInfo };
}

/**
 * GET /api/oauth/connections - Get OAuth connection status
 */
export async function getOAuthConnections(): Promise<OAuthConnection[]> {
  await delay(200);
  return mockOAuthConnections;
}

/**
 * POST /api/oauth/connect/:provider - Initiate OAuth flow
 */
export async function initiateOAuth(provider: GitProvider): Promise<{ authUrl: string }> {
  await delay(300);

  // In a real app, this would return the OAuth authorization URL
  const authUrl = `https://${provider}.com/oauth/authorize?client_id=mock&scope=repo`;

  return { authUrl };
}

/**
 * POST /api/oauth/callback - Complete OAuth flow (mock)
 */
export async function completeOAuth(provider: GitProvider, code: string): Promise<OAuthConnection> {
  await delay(500);

  const connection: OAuthConnection = {
    provider,
    connected: true,
    username: `mock-user-${provider}`,
    avatarUrl: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1000000)}`,
    connectedAt: new Date(),
    scope: ['repo', 'read:user'],
  };

  // Add to mock connections
  const existingIndex = mockOAuthConnections.findIndex(c => c.provider === provider);
  if (existingIndex >= 0) {
    mockOAuthConnections[existingIndex] = connection;
  } else {
    mockOAuthConnections.push(connection);
  }

  return connection;
}

/**
 * DELETE /api/oauth/disconnect/:provider - Disconnect OAuth
 */
export async function disconnectOAuth(provider: GitProvider): Promise<{ success: boolean }> {
  await delay(300);

  const index = mockOAuthConnections.findIndex(c => c.provider === provider);
  if (index >= 0) {
    mockOAuthConnections.splice(index, 1);
  }

  return { success: true };
}

/**
 * GET /api/repositories/batch - Get repositories from connected platform
 */
export async function getBatchRepositories(provider: GitProvider): Promise<{
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    url: string;
    isPrivate: boolean;
    lastUpdated: Date;
    isArchived: boolean;
  }>;
  total: number;
}> {
  await delay(800);

  // Check if authenticated
  const hasAuth = mockOAuthConnections.some(c => c.provider === provider && c.connected);
  if (!hasAuth) {
    throw createApiError('NOT_AUTHENTICATED', `Please authenticate with ${provider} first`);
  }

  // Generate mock repositories
  const repos = Array.from({ length: 25 }, (_, i) => ({
    id: `repo-${provider}-${i}`,
    name: `project-${i + 1}`,
    fullName: `mock-org/project-${i + 1}`,
    url: `https://${provider}.com/mock-org/project-${i + 1}`,
    isPrivate: Math.random() > 0.5,
    lastUpdated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    isArchived: Math.random() > 0.9,
  }));

  return { repositories: repos, total: repos.length };
}

/**
 * POST /api/files/upload - Upload files (mock)
 */
export async function uploadFiles(files: File[]): Promise<{
  uploaded: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  errors: Array<{ name: string; error: string }>;
}> {
  await delay(1000);

  const uploaded = files.map((file, i) => ({
    id: `file-${Date.now()}-${i}`,
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  return { uploaded, errors: [] };
}
