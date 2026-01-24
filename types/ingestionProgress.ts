// =============================================================================
// Ingestion Progress UI Types
// Types for the real-time ingestion progress display components
// =============================================================================

import type { IngestionPhase, IngestionMetrics, ChunkingStrategy } from './project';

// =============================================================================
// Phase Status Types
// =============================================================================

/** Status of each phase in the ingestion process */
export type PhaseStatus = 'pending' | 'active' | 'completed' | 'error';

/** Individual phase information for display */
export interface PhaseInfo {
  phase: IngestionPhase;
  status: PhaseStatus;
  label: string;
  shortLabel: string;
  icon: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// =============================================================================
// Phase 1: Repository Fetching Types
// =============================================================================

/** Status item in the fetching checklist */
export type FetchingStatusItem = 'authenticating' | 'cloning' | 'file_discovery';

export interface FetchingStatusState {
  item: FetchingStatusItem;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  label: string;
  duration?: number; // seconds
  errorMessage?: string;
}

export interface Phase1FetchingData {
  repositoryUrl: string;
  statusItems: FetchingStatusState[];
  cloneProgress: {
    downloadedMB: number;
    totalMB: number;
    percentage: number;
  };
  estimatedSecondsRemaining?: number;
  earlyStats: {
    filesFound: number;
    languagesDetected: string[];
    repositorySizeMB: number;
  };
  proTip?: string;
}

// =============================================================================
// Phase 2: Token Analysis Types
// =============================================================================

export interface FileTypeProgress {
  fileType: string;
  label: string;
  filesProcessed: number;
  totalFiles: number;
  percentage: number;
  isComplete: boolean;
  extractedEntities?: {
    classes: number;
    functions: number;
    modules: number;
  };
}

export interface Phase2AnalysisData {
  overallProgress: number;
  fileTypeBreakdown: FileTypeProgress[];
  metrics: {
    tokensProcessed: number;
    currentReduction: number; // percentage
    speedFilesPerSec: number;
  };
  memoryInsights: string[];
}

// =============================================================================
// Phase 3: Semantic Chunking Types
// =============================================================================

export interface ChunkTypeStats {
  type: 'module_boundaries' | 'function_groupings' | 'documentation' | 'config';
  label: string;
  count: number;
  avgTokenSize: number;
}

export interface Phase3ChunkingData {
  strategy: ChunkingStrategy;
  strategyLabel: string;
  chunkTypes: ChunkTypeStats[];
  totalChunks: number;
  avgChunkSize: number;
  qualityMetrics: {
    semanticCoherence: number; // percentage
    contextPreserved: number; // percentage
  };
  optimizationActions: {
    action: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
}

// =============================================================================
// Phase 4: Final Optimization Types
// =============================================================================

export interface OptimizationTechnique {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  tokensRemoved: number;
}

export interface Phase4OptimizationData {
  techniques: OptimizationTechnique[];
  tokenReduction: {
    originalTokens: number;
    currentTokens: number;
    reductionPercent: number;
  };
  predictedPerformance: {
    queryLatencyMs: number;
    relevanceScore: number; // percentage
  };
}

// =============================================================================
// Metrics Sidebar Types
// =============================================================================

export interface IngestionMetricsSidebar {
  originalTokens: number;
  currentTokens: number;
  reductionPercent: number;
  timeElapsedSeconds: number;
  estimatedSecondsRemaining?: number;
  filesProcessed: number;
  totalFiles: number;
  currentPhaseName: string;
}

// =============================================================================
// Main Container Props
// =============================================================================

export interface IngestionResult {
  projectId: string;
  success: boolean;
  finalMetrics: IngestionMetrics;
  totalDurationSeconds: number;
  optimizedTokens: number;
  compressionRatio: number;
}

export interface IngestionError {
  code: string;
  message: string;
  phase: IngestionPhase;
  recoverable: boolean;
}

export interface IngestionProgressContainerProps {
  projectId: string;
  projectName: string;
  onComplete: (result: IngestionResult) => void;
  onError: (error: IngestionError) => void;
  onMinimize?: () => void;
  /** When true, renders only the content without modal wrapper (for embedding in other modals) */
  embedded?: boolean;
}

// =============================================================================
// Combined State for Container
// =============================================================================

export interface IngestionProgressState {
  currentPhase: IngestionPhase;
  phases: PhaseInfo[];
  phase1Data: Phase1FetchingData | null;
  phase2Data: Phase2AnalysisData | null;
  phase3Data: Phase3ChunkingData | null;
  phase4Data: Phase4OptimizationData | null;
  sidebarMetrics: IngestionMetricsSidebar;
  isMinimized: boolean;
  startedAt: Date;
  error: IngestionError | null;
}

// =============================================================================
// Constants
// =============================================================================

export const PHASE_CONFIG: Record<IngestionPhase, { label: string; shortLabel: string; icon: string }> = {
  repository_fetch: { label: 'Fetching Repository', shortLabel: 'Fetch', icon: 'download' },
  parsing: { label: 'Analyzing & Parsing', shortLabel: 'Analyze', icon: 'search' },
  chunking: { label: 'Semantic Chunking', shortLabel: 'Chunk', icon: 'scissors' },
  optimization: { label: 'Final Optimization', shortLabel: 'Optimize', icon: 'zap' },
  indexing: { label: 'Indexing', shortLabel: 'Index', icon: 'database' },
};

export const INGESTION_PHASES_ORDER: IngestionPhase[] = [
  'repository_fetch',
  'parsing',
  'chunking',
  'optimization',
];

export const PRO_TIPS: string[] = [
  'Your optimized context will load 3x faster than raw files',
  'Semantic chunking preserves the meaning of your code across boundaries',
  'Our AI-powered optimization removes redundant patterns automatically',
  'Token reduction typically ranges from 50-80% without losing context',
  'Processed repositories can be queried in under 200ms',
];

export const DEFAULT_OPTIMIZATION_TECHNIQUES: Omit<OptimizationTechnique, 'tokensRemoved'>[] = [
  { id: 'deduplication', label: 'Deduplication', status: 'pending' },
  { id: 'pattern_compression', label: 'Pattern compression', status: 'pending' },
  { id: 'whitespace', label: 'Whitespace normalization', status: 'pending' },
  { id: 'imports', label: 'Import consolidation', status: 'pending' },
];

// =============================================================================
// Sprint PC5d: Completion Screen Types
// =============================================================================

/** Token savings breakdown by optimization technique */
export interface TokenSavingsBreakdown {
  deduplication: number;
  patternCompression: number;
  whitespace: number;
  importConsolidation: number;
}

/** Performance statistics for the completion screen */
export interface CompletionPerformanceStats {
  ingestionTimeSeconds: number;
  queryLatencyMs: number;
  relevanceScore: number;
}

/** Complete data for the ingestion completion screen */
export interface IngestionCompletionData {
  projectId: string;
  projectName: string;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  savingsBreakdown: TokenSavingsBreakdown;
  performanceStats: CompletionPerformanceStats;
  filesProcessed: number;
  chunksCreated: number;
  languagesDetected?: string[];
}

// =============================================================================
// Sprint PC5d: Insight Types
// =============================================================================

/** Type of insight message */
export type InsightType = 'positive' | 'neutral' | 'warning';

/** Individual insight for display during ingestion */
export interface Insight {
  id: string;
  type: InsightType;
  icon: string;
  message: string;
  priority: number;
  phase?: IngestionPhase;
  timestamp: Date;
}

/** Metrics used to generate insights */
export interface InsightMetrics {
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  totalChunks?: number;
  avgChunkSize?: number;
  filesProcessed: number;
  totalFiles: number;
  processingTimeSeconds?: number;
  queryLatencyMs?: number;
  relevanceScore?: number;
  estimatedCostPerQuery?: number;
  monthlySavings?: number;
  tokensRemovedByDedup?: number;
  tokensRemovedByPattern?: number;
  tokensRemovedByWhitespace?: number;
  tokensRemovedByImports?: number;
}

// =============================================================================
// Sprint PC5d: Animation Types
// =============================================================================

/** State of a progress bar */
export type ProgressBarState = 'idle' | 'in_progress' | 'complete' | 'error' | 'indeterminate';

// =============================================================================
// Sprint PC5d: Share/Export Types
// =============================================================================

/** Format for exporting results */
export type ExportFormat = 'json' | 'png' | 'link';

/** Cost calculation result */
export interface CostCalculation {
  originalCostPerQuery: number;
  optimizedCostPerQuery: number;
  savingsPerQuery: number;
  savingsPercent: number;
  monthlySavings: number;
  yearlySavings: number;
}
