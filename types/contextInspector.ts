// Context Detail Inspector TypeScript Interfaces
// Sprint 1: Foundation - Modal Structure & Core Infrastructure

// Tab types for the modal
export type TabType = 'overview' | 'compression' | 'enrichments' | 'users' | 'changelog';

// Context item types
export type ContextItemType = 'package' | 'repo' | 'files';

// Context item status
export type ContextStatus = 'cached' | 'expired' | 'pending';

// User roles
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

// Activity event types
export type ActivityEventType = 'view' | 'chat' | 'ingestion' | 'permission' | 'config';

// Changelog entry types
export type ChangelogEntryType = 'ingestion' | 'enrichment' | 'config' | 'access';

// Time range filter for changelog
export type TimeRange = '7d' | '30d' | '90d' | 'all';

// Chat message roles
export type MessageRole = 'user' | 'assistant';

// Source file types
export type SourceFileType = 'typescript' | 'javascript' | 'json' | 'markdown' | 'css' | 'html' | 'python' | 'yaml' | 'other';

// Source/File item for the sources list
export interface SourceItem {
  id: string;
  name: string;
  path: string;
  fileType: SourceFileType;
  size: number;
  selected: boolean;
}

// Core modal state
export interface ContextDetailModal {
  isOpen: boolean;
  contextItem: ContextItem | null;
  activeTab: TabType;
}

// Context item data
export interface ContextItem {
  id: string;
  name: string;
  type: ContextItemType;
  size: number;
  fileCount: number;
  lastUpdated: Date;
  status: ContextStatus;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// AI-generated summary for Sprint 2
export interface AISummary {
  description: string;        // AI-generated 3-4 sentences
  keyComponents: string[];    // Top 4-5 modules
  generatedAt: Date;
}

// Compression metrics
export interface CompressionMetrics {
  originalTokens: number;
  compressedTokens: number;
  ratio: number;
  savingsPercent: number;
  costSavings: number;
  totalIngestions: number;
  lastIngestion: Date;
  avgInterval: number;
}

// Ingestion history entry
export interface IngestionEntry {
  number: number;
  timestamp: Date;
  filesAdded: number;
  filesRemoved: number;
}

// Compression algorithm details
export interface CompressionAlgorithmInfo {
  method: string;
  preserves: string[];
  optimizationLevel: string;
}

// Top entity reference
export interface TopEntity {
  name: string;
  references: number;
}

// Language breakdown
export interface LanguageBreakdown {
  name: string;
  percentage: number;
}

// Knowledge Graph enrichment data
export interface KnowledgeGraphData {
  active: boolean;
  coverage: number;
  entities: number;
  relationships: number;
  clusters: number;
  topEntities: TopEntity[];
}

// Language Server enrichment data
export interface LanguageServerData {
  active: boolean;
  coverage: number;
  indexedFiles: number;
  totalFiles: number;
  symbols: number;
  languages: LanguageBreakdown[];
}

// ChromaCode enrichment data
export interface ChromaCodeData {
  active: boolean;
  coverage: number;
  embeddings: number;
  totalFiles: number;
  dimensions: number;
  model: string;
  chunkStrategy: string;
}

// Enrichment status
export interface EnrichmentStatus {
  overall: number;
  knowledgeGraph: KnowledgeGraphData;
  languageServer: LanguageServerData;
  chromaCode: ChromaCodeData;
}

// User access
export interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: Date;
  avatar?: string;
}

// Activity event
export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  user: UserAccess;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Modified file in changelog
export interface ModifiedFile {
  path: string;
  linesAdded: number;
  linesRemoved: number;
}

// Changelog entry
export interface ChangelogEntry {
  id: string;
  type: ChangelogEntryType;
  number?: number;
  timestamp: Date;
  author: UserAccess | 'System';
  filesAdded?: number;
  filesRemoved?: number;
  filesModified?: number;
  addedFiles?: string[];
  removedFiles?: string[];
  modifiedFiles?: ModifiedFile[];
  description?: string;
}

// Context Inspector State (for context/reducer)
export interface ContextInspectorState {
  isOpen: boolean;
  contextItem: ContextItem | null;
  activeTab: TabType;
  isLoading: boolean;
  sources: SourceItem[];
  sourcesLoading: boolean;
}

// Context Inspector Actions
export type ContextInspectorAction =
  | { type: 'OPEN_MODAL'; payload: ContextItem }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_CONTEXT_NAME'; payload: string }
  | { type: 'SET_SOURCES'; payload: SourceItem[] }
  | { type: 'SET_SOURCES_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_ALL_SOURCES'; payload: boolean };

// Footer button configuration
export interface FooterButton {
  label: string;
  variant: 'primary' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Tab configuration
export interface TabConfig {
  id: TabType;
  label: string;
  shortcut: number; // 1-5 for Cmd/Ctrl + number
}

// Props interfaces for components
export interface ModalHeaderProps {
  contextName: string;
  onClose: () => void;
  onNameChange?: (newName: string) => void;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface ModalFooterProps {
  activeTab: TabType;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
}

// Tab component props
export interface TabProps {
  contextItem: ContextItem;
}

// ==========================================
// Sprint 7: Diff Viewer & Rollback Types
// ==========================================

// Diff view mode
export type DiffViewMode = 'unified' | 'split';

// Diff line type
export type DiffLineType = 'context' | 'addition' | 'deletion';

// Individual diff line
export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Diff hunk (a section of changes)
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

// File status in diff
export type DiffFileStatus = 'added' | 'removed' | 'modified';

// Diff file
export interface DiffFile {
  path: string;
  status: DiffFileStatus;
  hunks: DiffHunk[];
  linesAdded: number;
  linesRemoved: number;
  language?: string;
}

// Complete diff data
export interface DiffData {
  files: DiffFile[];
  summary: {
    filesAdded: number;
    filesRemoved: number;
    filesModified: number;
    totalAdditions: number;
    totalDeletions: number;
  };
  fromVersion: number;
  toVersion: number;
}

// Rollback preview data
export interface RollbackPreview {
  filesToRestore: number;
  filesToRemove: number;
  filesToReAdd: number;
  currentVersion: number;
  targetVersion: number;
}

// Version info for selector
export interface VersionInfo {
  number: number;
  timestamp: Date;
  author: string;
  filesChanged: number;
}

// Diff Viewer Modal Props
export interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  fromVersion: number;
  toVersion: number;
}

// Diff Header Props
export interface DiffHeaderProps {
  fromVersion: number;
  toVersion: number;
  viewMode: DiffViewMode;
  onViewModeChange: (mode: DiffViewMode) => void;
  currentFile: string;
  files: string[];
  onFileChange: (file: string) => void;
  onClose: () => void;
}

// Diff Footer Props
export interface DiffFooterProps {
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  onDownload: () => void;
}

// Unified Diff View Props
export interface UnifiedDiffViewProps {
  file: DiffFile;
}

// Split Diff View Props
export interface SplitDiffViewProps {
  file: DiffFile;
}

// Diff Line Props
export interface DiffLineProps {
  line: DiffLine;
  showLineNumbers?: boolean;
}

// Rollback Confirm Modal Props
export interface RollbackConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contextId: string;
  targetVersion: number;
  preview: RollbackPreview | null;
  isLoading: boolean;
  isRollingBack: boolean;
}

// Version Selector Modal Props
export interface VersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (fromVersion: number, toVersion: number) => void;
  versions: VersionInfo[];
}

// useDiff hook return type
export interface UseDiffReturn {
  diff: DiffData | null;
  isLoading: boolean;
  error: string | null;
  currentFileIndex: number;
  setCurrentFileIndex: (index: number) => void;
  viewMode: DiffViewMode;
  setViewMode: (mode: DiffViewMode) => void;
}

// useRollback hook return type
export interface UseRollbackReturn {
  preview: RollbackPreview | null;
  isLoading: boolean;
  error: string | null;
  rollback: () => Promise<void>;
  isRollingBack: boolean;
}

// ============================================
// Sprint 8: Polish & Advanced Features Types
// ============================================

// Compression Settings (US-8.5)
export interface CompressionSettings {
  method: 'hypervisa' | 'standard';
  preserveStructure: boolean;
  preserveTypes: boolean;
  preserveExports: boolean;
  preserveDocs: boolean;
  optimizationLevel: 'low' | 'medium' | 'high';
}

// LSP Configuration (US-8.5)
export interface LSPConfig {
  enableGoToDefinition: boolean;
  enableAutoCompletion: boolean;
  enableTypeInference: boolean;
  excludePatterns: string[];
  maxFileSize: number;
}

// ChromaCode Configuration (US-8.5)
export interface ChromaCodeConfig {
  embeddingModel: 'text-embedding-3-small' | 'text-embedding-3-large';
  chunkStrategy: 'sliding' | 'semantic' | 'paragraph';
  chunkSize: number;
  overlap: number;
  excludePatterns: string[];
}

// Search Types (US-8.2)
export type SearchResultType = 'user' | 'activity' | 'changelog' | 'file';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  tab: TabType;
  metadata?: Record<string, unknown>;
}

// Knowledge Graph Types (US-8.4)
export type GraphNodeType = 'function' | 'class' | 'module' | 'variable' | 'file';
export type GraphLinkType = 'imports' | 'calls' | 'extends' | 'implements';

export interface GraphNode {
  id: string;
  name: string;
  type: GraphNodeType;
  references: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: GraphLinkType;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// WebSocket Types (US-8.1)
export type WebSocketEvent =
  | 'activity:new'
  | 'user:status'
  | 'enrichment:progress'
  | 'ingestion:complete';

export interface WebSocketMessage<T = unknown> {
  event: WebSocketEvent;
  data: T;
  timestamp: string;
}

// Realtime State (US-8.1)
export interface RealtimeState {
  connected: boolean;
  connecting: boolean;
  lastUpdate: Date | null;
  pendingUpdates: {
    activity: number;
    users: number;
    changelog: number;
  };
  error: string | null;
}

// Export Types (US-8.3)
export type ExportFormat = 'csv' | 'json';

export interface ContextSummary {
  name: string;
  type: ContextItemType;
  fileCount: number;
  size: number;
  lastUpdated: Date;
  compressionRatio?: number;
  enrichmentCoverage?: number;
}
