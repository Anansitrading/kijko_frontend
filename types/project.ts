// Project Creation Types & Interfaces
// Foundation types for the multi-step project creation wizard

// =============================================================================
// Enums & Union Types
// =============================================================================

/** How the project sources code - repository, files, or manual entry */
export type ProjectType = 'repository' | 'files' | 'manual';

/** Project lifecycle status */
export type ProjectStatus = 'draft' | 'processing' | 'active' | 'error';

/** Privacy level for project visibility */
export type ProjectPrivacy = 'private' | 'shared';

/** Chunking strategy for code processing */
export type ChunkingStrategy = 'semantic' | 'fixed' | 'recursive' | 'custom';

/** Output format for processed content */
export type OutputFormat = 'json' | 'markdown' | 'vector';

/** Notification frequency for team members */
export type NotificationLevel = 'real-time' | 'daily' | 'weekly' | 'disabled';

/** Directory sync provider */
export type DirectorySyncProvider = 'okta' | 'azure_ad';

/** Persona types for different user workflows */
export type PersonaType = 'alex' | 'maya' | 'sam';

/** Project member roles (distinct from team roles) */
export type ProjectMemberRole = 'admin' | 'manager' | 'developer' | 'viewer' | 'auditor';

/** Phases of the ingestion process */
export type IngestionPhase =
  | 'repository_fetch'
  | 'parsing'
  | 'chunking'
  | 'optimization'
  | 'indexing';

/** Status of repository connection */
export type RepositoryStatus = 'pending' | 'connected' | 'syncing' | 'error';

/** Git providers supported */
export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'azure';

/** Steps in the project creation wizard */
export type ProjectCreationStep =
  | 'type_selection'
  | 'basic_info'
  | 'source_config'
  | 'team_setup'
  | 'settings'
  | 'review';

// =============================================================================
// Core Interfaces
// =============================================================================

/** Main Project entity */
export interface Project {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  privacy: ProjectPrivacy;

  // Processing settings
  chunkingStrategy: ChunkingStrategy;
  includeMetadata: boolean;
  anonymizeSecrets: boolean;

  // Stats
  totalRepos: number;
  totalFiles: number;
  originalTokens?: number;
  optimizedTokens?: number;
  ingestionTimeSeconds?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/** Repository linked to a project */
export interface ProjectRepository {
  id: string;
  projectId: string;
  provider: GitProvider;
  repositoryUrl: string;
  repositoryName: string;
  branch: string;
  status: RepositoryStatus;

  // Sync tracking
  lastSyncAt?: Date;
  lastCommitHash?: string;
  fileCount?: number;

  // Settings
  includePaths?: string[];
  excludePaths?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/** Team member with project access */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: ProjectMemberRole;

  // Notification preferences
  notifyOnIngestion: boolean;
  notifyOnError: boolean;
  notifyOnTeamChanges: boolean;

  // Status
  invitedAt: Date;
  acceptedAt?: Date;
  lastActiveAt?: Date;
}

/** Real-time ingestion progress tracking */
export interface IngestionProgress {
  id: string;
  projectId: string;
  phase: IngestionPhase;
  progressPercent: number;
  message: string;

  // Metrics
  metrics: IngestionMetrics;

  // Timing
  startedAt: Date;
  estimatedCompletionAt?: Date;
  completedAt?: Date;

  // Error tracking
  errorMessage?: string;
  errorCode?: string;
}

/** Metrics collected during ingestion */
export interface IngestionMetrics {
  filesProcessed: number;
  totalFiles: number;
  tokensProcessed: number;
  bytesProcessed: number;
  chunksCreated: number;
  errorsEncountered: number;
}

// =============================================================================
// Form State Types
// =============================================================================

/** Form data for project creation wizard */
export interface ProjectCreationForm {
  // Step 1: Type Selection
  projectType: ProjectType | null;
  persona?: PersonaType;

  // Step 2: Basic Info
  name: string;
  description: string;
  privacy: ProjectPrivacy;

  // Step 3: Source Configuration
  repositories: RepositoryInput[];
  files?: FileInput[];
  manualContent?: string;

  // Step 4: Team Setup
  members: MemberInput[];
  defaultNotificationLevel: NotificationLevel;

  // Step 5: Advanced Settings
  chunkingStrategy: ChunkingStrategy;
  webhookUrl?: string;
  metadataOptions: MetadataOptions;
  outputFormat: OutputFormat;
  embeddingModel?: string;
  patternFilters: PatternFilters;
  processingOptions: ProcessingOptions;

  // Legacy compatibility
  includeMetadata: boolean;
  anonymizeSecrets: boolean;
  customSettings?: Record<string, unknown>;
}

/** Input for adding a repository */
export interface RepositoryInput {
  provider: GitProvider;
  url: string;
  branch: string;
  includePaths?: string[];
  excludePaths?: string[];
}

/** Input for uploading files */
export interface FileInput {
  name: string;
  path: string;
  size: number;
  type: string;
  content?: string;
}

/** Input for inviting a team member */
export interface MemberInput {
  email: string;
  role: ProjectMemberRole;
  notifyOnIngestion?: boolean;
  notifyOnError?: boolean;
  notifyOnTeamChanges?: boolean;
}

/** Validation state for each wizard step */
export interface StepValidation {
  step: ProjectCreationStep;
  isValid: boolean;
  errors: ValidationError[];
  touched: boolean;
}

/** Validation error with field reference */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// =============================================================================
// Step 3: Advanced Settings Types
// =============================================================================

/** Chunking option for display in the UI */
export interface ChunkingOption {
  value: ChunkingStrategy;
  label: string;
  description: string;
  recommended?: boolean;
}

/** Metadata extraction options */
export interface MetadataOptions {
  functionSignatures: boolean;
  importDependencies: boolean;
  gitHistory: boolean;
  fileStructure: boolean;
  customAnnotations: boolean;
}

/** Output format option for display in the UI */
export interface OutputFormatOption {
  value: OutputFormat;
  label: string;
  description: string;
  previewSnippet?: string;
}

/** File pattern filters for include/exclude */
export interface PatternFilters {
  languagePatterns: string[];  // e.g., ['*.py', '*.ts', '*.js']
  excludePatterns: string[];   // e.g., ['*test*', '*.md']
}

/** Processing options */
export interface ProcessingOptions {
  anonymizeSecrets: boolean;
  parallelProcessing: boolean;
  realTimeIncremental: boolean;
}

/** Complete Step 3 settings configuration */
export interface AdvancedSettingsConfig {
  chunkingStrategy: ChunkingStrategy;
  webhookUrl?: string;  // Only when chunkingStrategy is 'custom'
  metadataOptions: MetadataOptions;
  outputFormat: OutputFormat;
  embeddingModel?: string;  // Only when outputFormat is 'vector'
  patternFilters: PatternFilters;
  processingOptions: ProcessingOptions;
}

// =============================================================================
// Step 4: Team Access Types
// =============================================================================

/** Role definition with permissions */
export interface RoleDefinition {
  role: ProjectMemberRole;
  label: string;
  description: string;
  permissions: string[];
}

/** Team member invitation input */
export interface TeamMemberInvitation {
  email: string;
  role: ProjectMemberRole;
  notificationLevel: NotificationLevel;
}

/** CSV import result for bulk team import */
export interface CSVImportResult {
  success: TeamMemberInvitation[];
  errors: CSVImportError[];
}

/** CSV import error */
export interface CSVImportError {
  row: number;
  email?: string;
  message: string;
}

/** Directory sync connection status */
export interface DirectorySyncStatus {
  provider: DirectorySyncProvider;
  connected: boolean;
  lastSyncAt?: Date;
  groupCount?: number;
  memberCount?: number;
  error?: string;
}

/** Complete Step 4 team configuration */
export interface TeamAccessConfig {
  members: TeamMemberInvitation[];
  defaultNotificationLevel: NotificationLevel;
  directorySync?: DirectorySyncStatus;
}

// =============================================================================
// WebSocket Event Types
// =============================================================================

/** Event when a new ingestion phase starts */
export interface PhaseStartedEvent {
  projectId: string;
  phase: IngestionPhase;
  message: string;
  startTime: Date;
  totalPhases: number;
  currentPhaseIndex: number;
}

/** Event for progress updates during ingestion */
export interface ProgressUpdateEvent {
  projectId: string;
  phase: IngestionPhase;
  progressPercent: number;
  message: string;
  metrics: IngestionMetrics;
}

/** Event when ingestion completes successfully */
export interface IngestionCompleteEvent {
  projectId: string;
  success: boolean;
  totalDurationSeconds: number;
  finalMetrics: IngestionMetrics;
  project: Project;
}

/** Event when an error occurs during ingestion */
export interface IngestionErrorEvent {
  projectId: string;
  phase: IngestionPhase;
  errorCode: string;
  errorMessage: string;
  recoverable: boolean;
  retryCount: number;
}

/** Union type for all ingestion WebSocket events */
export type IngestionWebSocketEvent =
  | { type: 'phase_started'; data: PhaseStartedEvent }
  | { type: 'progress_update'; data: ProgressUpdateEvent }
  | { type: 'ingestion_complete'; data: IngestionCompleteEvent }
  | { type: 'error'; data: IngestionErrorEvent };

// =============================================================================
// API Request/Response Types
// =============================================================================

/** Request to create a new project */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: ProjectType;
  privacy?: ProjectPrivacy;
  chunkingStrategy?: ChunkingStrategy;
  includeMetadata?: boolean;
  anonymizeSecrets?: boolean;
  organizationId?: string;
}

/** Response from creating a project */
export interface CreateProjectResponse {
  project: Project;
  nextSteps: ProjectCreationStep[];
}

/** Request to add a repository to a project */
export interface AddRepositoryRequest {
  projectId: string;
  provider: GitProvider;
  repositoryUrl: string;
  branch: string;
  includePaths?: string[];
  excludePaths?: string[];
}

/** Request to add a team member */
export interface AddMemberRequest {
  projectId: string;
  email: string;
  role: ProjectMemberRole;
  notifyOnIngestion?: boolean;
  notifyOnError?: boolean;
  notifyOnTeamChanges?: boolean;
  inviteMessage?: string;
}

/** Request to start ingestion */
export interface StartIngestionRequest {
  projectId: string;
  skipValidation?: boolean;
  forceReprocess?: boolean;
}

/** Response from starting ingestion */
export interface StartIngestionResponse {
  jobId: string;
  projectId: string;
  status: 'processing';
  wsNamespaceUrl: string;
  estimatedDurationSeconds: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Standard API error response */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

// =============================================================================
// Persona Configurations
// =============================================================================

/** Persona configuration for guided onboarding */
export interface PersonaConfig {
  type: PersonaType;
  name: string;
  title: string;
  description: string;
  recommendedSettings: Partial<ProjectCreationForm>;
  highlightedFeatures: string[];
}

/** Predefined persona configurations */
export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  alex: {
    type: 'alex',
    name: 'Alex',
    title: 'The Developer',
    description: 'Individual developer focused on personal projects and code understanding',
    recommendedSettings: {
      privacy: 'private',
      chunkingStrategy: 'semantic',
      includeMetadata: true,
      anonymizeSecrets: true,
    },
    highlightedFeatures: ['Code search', 'Documentation generation', 'Personal workspace'],
  },
  maya: {
    type: 'maya',
    name: 'Maya',
    title: 'The Tech Lead',
    description: 'Team lead managing multiple projects and coordinating developers',
    recommendedSettings: {
      privacy: 'shared',
      chunkingStrategy: 'semantic',
      includeMetadata: true,
      anonymizeSecrets: true,
    },
    highlightedFeatures: ['Team collaboration', 'Multi-repo support', 'Access controls'],
  },
  sam: {
    type: 'sam',
    name: 'Sam',
    title: 'The Enterprise Architect',
    description: 'Enterprise user managing organization-wide code intelligence',
    recommendedSettings: {
      privacy: 'shared',
      chunkingStrategy: 'recursive',
      includeMetadata: true,
      anonymizeSecrets: true,
    },
    highlightedFeatures: ['Enterprise security', 'SSO integration', 'Audit logging'],
  },
};

// =============================================================================
// Utility Types
// =============================================================================

/** Create type without id and timestamps (for creation) */
export type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'totalRepos' | 'totalFiles'>;

/** Partial update type for project */
export type UpdateProject = Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>;

/** Project with related data loaded */
export interface ProjectWithRelations extends Project {
  repositories: ProjectRepository[];
  members: ProjectMember[];
  currentIngestion?: IngestionProgress;
}

/** Summary stats for projects dashboard */
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  processingProjects: number;
  errorProjects: number;
  totalTokens: number;
  totalFiles: number;
}

// =============================================================================
// Step 3: Advanced Settings Constants
// =============================================================================

/** Chunking strategy options for the UI */
export const CHUNKING_OPTIONS: ChunkingOption[] = [
  {
    value: 'semantic',
    label: 'Semantic',
    description: 'Preserves meaning by chunking at logical boundaries (functions, classes)',
    recommended: true,
  },
  {
    value: 'fixed',
    label: 'Fixed Size (1000 tokens)',
    description: 'Predictable chunk sizes for consistent processing',
  },
  {
    value: 'recursive',
    label: 'Recursive',
    description: 'Hierarchical structure preserving parent-child relationships',
  },
  {
    value: 'custom',
    label: 'Custom (Webhook)',
    description: 'Bring your own chunking logic via webhook',
  },
];

/** Output format options for the UI */
export const OUTPUT_FORMAT_OPTIONS: OutputFormatOption[] = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data format for programmatic access',
    previewSnippet: `{
  "chunks": [{
    "content": "function example() {...}",
    "metadata": { "type": "function" }
  }]
}`,
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Human-readable format with syntax highlighting',
    previewSnippet: `## example.ts
\`\`\`typescript
function example() {
  // ...
}
\`\`\``,
  },
  {
    value: 'vector',
    label: 'Vector Embeddings',
    description: 'Semantic vectors for similarity search and AI retrieval',
    previewSnippet: `{
  "embedding": [0.023, -0.142, ...],
  "dimensions": 1536
}`,
  },
];

/** Metadata extraction option labels */
export const METADATA_OPTION_LABELS: Record<keyof MetadataOptions, { label: string; description: string }> = {
  functionSignatures: {
    label: 'Function signatures & docstrings',
    description: 'Extract function names, parameters, return types, and documentation',
  },
  importDependencies: {
    label: 'Import dependencies',
    description: 'Track module imports and external dependencies',
  },
  gitHistory: {
    label: 'Git history (authors, dates)',
    description: 'Include commit history, authors, and modification dates',
  },
  fileStructure: {
    label: 'File structure',
    description: 'Preserve directory hierarchy and file organization',
  },
  customAnnotations: {
    label: 'Custom annotations (comments)',
    description: 'Extract TODO, FIXME, and custom comment markers',
  },
};

/** Processing option labels */
export const PROCESSING_OPTION_LABELS: Record<keyof ProcessingOptions, { label: string; description: string; warning?: string }> = {
  anonymizeSecrets: {
    label: 'Anonymize secrets (API keys)',
    description: 'Automatically detect and mask sensitive credentials',
  },
  parallelProcessing: {
    label: 'Parallel processing (faster)',
    description: 'Process multiple files simultaneously for faster ingestion',
  },
  realTimeIncremental: {
    label: 'Real-time incremental (on commits)',
    description: 'Automatically re-process on new commits',
    warning: 'May incur additional processing costs',
  },
};

/** Default metadata options */
export const DEFAULT_METADATA_OPTIONS: MetadataOptions = {
  functionSignatures: true,
  importDependencies: true,
  gitHistory: true,
  fileStructure: true,
  customAnnotations: false,
};

/** Default processing options */
export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  anonymizeSecrets: true,
  parallelProcessing: true,
  realTimeIncremental: false,
};

/** Default pattern filters */
export const DEFAULT_PATTERN_FILTERS: PatternFilters = {
  languagePatterns: [],
  excludePatterns: [],
};

// =============================================================================
// Step 4: Team Access Constants
// =============================================================================

/** Role definitions with permissions */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full access to project settings and team management',
    permissions: [
      'View and edit all project settings',
      'Manage team members and roles',
      'Delete project',
      'Access billing and usage',
      'All Developer permissions',
    ],
  },
  {
    role: 'manager',
    label: 'Manager',
    description: 'Team management and reporting access',
    permissions: [
      'Invite and remove team members',
      'View usage reports and analytics',
      'Manage notification settings',
      'All Developer permissions',
    ],
  },
  {
    role: 'developer',
    label: 'Developer',
    description: 'Read/write access to project content',
    permissions: [
      'View and query processed content',
      'Add and remove repositories',
      'Upload files',
      'Generate documentation',
    ],
  },
  {
    role: 'viewer',
    label: 'Viewer',
    description: 'Read-only access with commenting',
    permissions: [
      'View processed content',
      'Add comments and annotations',
      'Export reports',
    ],
  },
  {
    role: 'auditor',
    label: 'Auditor',
    description: 'Compliance and audit log access only',
    permissions: [
      'View audit logs',
      'Access compliance reports',
      'Export security documentation',
    ],
  },
];

/** Notification level options */
export const NOTIFICATION_LEVEL_OPTIONS: { value: NotificationLevel; label: string; description: string }[] = [
  {
    value: 'real-time',
    label: 'Real-time',
    description: 'Instant notifications for all events',
  },
  {
    value: 'daily',
    label: 'Daily digest',
    description: 'Summary email once per day',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Summary email once per week',
  },
  {
    value: 'disabled',
    label: 'Disabled',
    description: 'No email notifications',
  },
];

// =============================================================================
// Step 2: Repository & Files Configuration Types
// =============================================================================

/** Repository validation result */
export interface RepoValidation {
  valid: boolean;
  error?: string;
  info?: RepoInfo;
}

/** Repository metadata from API */
export interface RepoInfo {
  name: string;
  fullName: string;
  provider: GitProvider;
  url: string;
  defaultBranch: string;
  commitsPerMonth: number;
  fileCount: number;
  locEstimate: number;
  primaryLanguage: string;
  lastUpdated: Date;
  isPrivate: boolean;
  stars?: number;
  description?: string;
}

/** Recent repository suggestion */
export interface RecentRepo {
  repoUrl: string;
  repoName: string;
  lastAnalyzed: Date;
  usageCount: number;
  provider: GitProvider;
}

/** OAuth connection status */
export interface OAuthConnection {
  provider: GitProvider;
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: Date;
  scope?: string[];
}

/** OAuth state for the UI */
export interface OAuthState {
  isConnecting: boolean;
  connections: OAuthConnection[];
  error?: string;
}

/** File filter configuration for uploads */
export interface FileFilterConfig {
  excludeNodeModules: boolean;
  excludeBuildArtifacts: boolean;
  excludeTests: boolean;
  includeDocumentation: boolean;
}

/** Default file filters */
export const DEFAULT_FILE_FILTERS: FileFilterConfig = {
  excludeNodeModules: true,
  excludeBuildArtifacts: true,
  excludeTests: true,
  includeDocumentation: false,
};

/** Uploaded file with metadata */
export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  isDirectory: boolean;
  children?: UploadedFile[];
}

/** Upload progress state */
export interface UploadProgressState {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

/** Batch import source */
export interface BatchImportSource {
  id: string;
  provider: GitProvider;
  repoUrl: string;
  repoName: string;
  team?: string;
  priority?: 'high' | 'medium' | 'low';
  selected: boolean;
  lastUpdated?: Date;
  isArchived?: boolean;
}

/** CSV import row for repositories */
export interface CsvRepoImportRow {
  repo_url: string;
  team?: string;
  priority?: string;
}

/** Batch import filters */
export interface BatchImportFilters {
  showAll: boolean;
  updatedInLast30Days: boolean;
  team?: string;
  includeArchived: boolean;
}

// =============================================================================
// Step 5: Review & Cost Estimation Types
// =============================================================================

/** Cost estimate breakdown for review screen */
export interface CostEstimate {
  processingCost: number;       // One-time processing cost in cents
  storageCostMonthly: number;   // Monthly storage cost in cents
  totalTokens: number;          // Estimated total tokens before compression
  optimizedTokens: number;      // Tokens after compression
  compressionRatio: number;     // e.g., 0.05 = 95% reduction
  isPlanEligible: boolean;      // Within free tier limits
  planName: 'free' | 'pro' | 'enterprise';
  savingsVsRaw: number;         // Cost savings percentage vs raw context
}

/** Plan-based pricing tiers */
export interface PricingTier {
  plan: 'free' | 'pro' | 'enterprise';
  tokenLimit: number;               // Monthly token limit
  processingRatePerMillion: number; // Processing cost per 1M tokens (cents)
  storageRatePerMillion: number;    // Storage cost per 1M tokens/month (cents)
  includedTokens: number;           // Free included tokens
}

/** Validation warning for review screen */
export interface ReviewWarning {
  step: ProjectCreationStep;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/** Repository summary for review display */
export interface RepositorySummary {
  url: string;
  name: string;
  provider: GitProvider;
  branch: string;
  estimatedFiles?: number;
  estimatedTokens?: number;
}

// =============================================================================
// Sprint PC6: Persona Detection & Flow Routing
// =============================================================================

/** Signals used to detect user persona */
export interface PersonaSignals {
  teamSize: number;
  usesLightweightTools: boolean;
  focusOnCost: boolean;
  downloadsSecurityDocs: boolean;
  asksAboutCompliance: boolean;
  usesAPIFrequently: boolean;
  readsDocumentation: boolean;
  participatesInCommunity: boolean;
}

/** Persona score result */
export interface PersonaScore {
  type: PersonaType;
  score: number;
}

/** Persona detection result */
export interface PersonaDetectionResult {
  persona: PersonaType;
  scores: PersonaScore[];
  confidence: 'high' | 'medium' | 'low';
  signals: Partial<PersonaSignals>;
}

/** Emphasis areas for persona-specific CTAs */
export type PersonaEmphasis = 'cost_savings' | 'team_productivity' | 'technical_metrics';

/** Flow configuration for each persona */
export interface PersonaFlow {
  steps: (number | string)[];
  hiddenSteps: number[];
  defaults: Partial<ProjectCreationForm>;
  emphasis: PersonaEmphasis;
}

/** Persona flow configurations */
export const PERSONA_FLOWS: Record<PersonaType, PersonaFlow> = {
  alex: {
    steps: [1, '2a', 5],
    hiddenSteps: [3, 4],
    defaults: {
      projectType: 'repository',
      chunkingStrategy: 'semantic',
      privacy: 'private'
    },
    emphasis: 'cost_savings'
  },
  maya: {
    steps: [1, '2b', 3, 4, 5],
    hiddenSteps: [],
    defaults: {
      projectType: 'repository',
      privacy: 'shared'
    },
    emphasis: 'team_productivity'
  },
  sam: {
    steps: [1, '2a', 3, 5],
    hiddenSteps: [4],
    defaults: {
      projectType: 'repository',
      chunkingStrategy: 'recursive'
    },
    emphasis: 'technical_metrics'
  }
};

// =============================================================================
// Sprint PC6: Error Recovery
// =============================================================================

/** Recovery action types */
export type RecoveryAction =
  | 'retry_branch'
  | 'switch_to_upload'
  | 'change_repo'
  | 'exclude_files'
  | 'retry_with_memory'
  | 'manual_upload'
  | 'switch_chunking'
  | 'apply_filters'
  | 'contact_support';

/** Recovery option */
export interface RecoveryOption {
  label: string;
  action: RecoveryAction;
  description?: string;
  icon?: string;
}

/** Error recovery configuration */
export interface ErrorRecovery {
  errorCode: string;
  errorMessage: string;
  phase: IngestionPhase;
  options: RecoveryOption[];
  failedItems?: string[];
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

/** Predefined error recovery configurations */
export const ERROR_RECOVERY_CONFIGS: Record<string, Omit<ErrorRecovery, 'failedItems' | 'retryCount'>> = {
  repository_fetch_failed: {
    errorCode: 'REPO_FETCH_FAILED',
    errorMessage: 'Failed to access repository',
    phase: 'repository_fetch',
    options: [
      { label: 'Use alternate branch', action: 'retry_branch', description: 'Try a different branch' },
      { label: 'Upload as ZIP instead', action: 'switch_to_upload', description: 'Upload your code manually' },
      { label: 'Try different repo', action: 'change_repo', description: 'Enter a different repository URL' }
    ],
    canRetry: true,
    maxRetries: 3
  },
  parsing_failed: {
    errorCode: 'PARSING_FAILED',
    errorMessage: 'Failed to parse some files',
    phase: 'parsing',
    options: [
      { label: 'Exclude problem files', action: 'exclude_files', description: 'Continue without the problematic files' },
      { label: 'Retry with more memory', action: 'retry_with_memory', description: 'Allocate more resources' },
      { label: 'Use manual upload', action: 'manual_upload', description: 'Upload files manually' }
    ],
    canRetry: true,
    maxRetries: 3
  },
  chunking_failed: {
    errorCode: 'CHUNKING_FAILED',
    errorMessage: 'Chunking strategy failed',
    phase: 'chunking',
    options: [
      { label: 'Switch to fixed-size chunks', action: 'switch_chunking', description: 'Use simpler chunking strategy' },
      { label: 'Retry with aggressive filtering', action: 'apply_filters', description: 'Apply more file filters' },
      { label: 'Contact support', action: 'contact_support', description: 'Get help from our team' }
    ],
    canRetry: true,
    maxRetries: 2
  }
};

/** Retry state for tracking retry attempts */
export interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  maxAttempts: number;
  lastError?: string;
  canCancel: boolean;
  nextRetryAt?: Date;
}

// =============================================================================
// Sprint PC6: Analytics Events
// =============================================================================

/** Analytics event types */
export type AnalyticsEventType =
  | 'project_creation_started'
  | 'project_step_completed'
  | 'ingestion_started'
  | 'ingestion_phase_completed'
  | 'ingestion_completed'
  | 'conversion_signal'
  | 'error_occurred'
  | 'error_recovered'
  | 'persona_detected'
  | 'persona_override';

/** Analytics event payload */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  persona: PersonaType | null;
  sessionId: string;
  properties: Record<string, unknown>;
}

/** Conversion signal actions */
export type ConversionAction =
  | 'copy_to_cursor'
  | 'view_project'
  | 'share_project'
  | 'invite_team'
  | 'api_docs'
  | 'query_now'
  | 'api_key'
  | 'setup_webhook'
  | 'upgrade_plan'
  | 'process_more_repos';

// =============================================================================
// Sprint PC6: Persona Completion CTAs
// =============================================================================

/** Alex persona completion metrics (cost-focused) */
export interface AlexCompletionMetrics {
  tokensSaved: number;
  costSaved: number;
  currency: string;
  processingTimeSeconds: number;
}

/** Alex quick win suggestions */
export interface AlexQuickWin {
  id: string;
  label: string;
  description: string;
  potentialSavings: string;
  action: string;
}

/** Maya persona completion metrics (team-focused) */
export interface MayaCompletionMetrics {
  repositoriesProcessing: number;
  membersInvited: number;
  projectedHoursSavedPerMonth: number;
  roiMultiplier: number;
}

/** Maya next steps suggestions */
export interface MayaNextStep {
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

/** Sam persona completion metrics (technical-focused) */
export interface SamCompletionMetrics {
  tokenReductionPercent: number;
  queryLatencyMs: number;
  relevancePercent: number;
  chunksCreated: number;
}

/** Sam advanced setup options */
export interface SamAdvancedOption {
  id: string;
  label: string;
  description: string;
  isNew?: boolean;
  action: string;
}

/** Unified completion data for all personas */
export interface CompletionData {
  projectId: string;
  projectName: string;
  persona: PersonaType;
  alexMetrics?: AlexCompletionMetrics;
  mayaMetrics?: MayaCompletionMetrics;
  samMetrics?: SamCompletionMetrics;
  processingDurationSeconds: number;
  completedAt: Date;
}
