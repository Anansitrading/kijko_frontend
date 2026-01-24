// =============================================================================
// Ingestion Progress Components
// Sprint PC5b: Real-time ingestion progress display
// Sprint PC5d: Completion screen, animations, and insights
// =============================================================================

// Sprint PC5b: Phase Components
export { PhaseIndicator } from './PhaseIndicator';
export { Phase1Fetching, createMockPhase1Data } from './Phase1Fetching';
export { Phase2Analysis, createMockPhase2Data } from './Phase2Analysis';
export { Phase3Chunking, createMockPhase3Data } from './Phase3Chunking';
export { Phase4Optimization, createMockPhase4Data } from './Phase4Optimization';
export { MetricsSidebar, createMockMetrics } from './MetricsSidebar';
export { IngestionProgressContainer, useIngestionProgress } from './IngestionProgressContainer';

// Sprint PC5d: Animated Counter
export {
  AnimatedCounter,
  TokenCounter,
  PercentCounter,
  CurrencyCounter,
  createMockCounterDemo,
} from './AnimatedCounter';

// Sprint PC5d: Progress Bar with Animations
export {
  AnimatedProgressBar,
  PhaseProgressBar,
  IngestionProgressBar,
  ProgressBarStyles,
  progressBarStyles,
  createMockProgressData,
} from './AnimatedProgressBar';

// Sprint PC5d: Insight Generation and Display
export {
  generateInsights,
  generateCompletionInsights,
  calculateCostImpact,
  createMockInsightMetrics,
  INSIGHT_ICONS,
} from './InsightGenerator';
export type { Insight, InsightType, InsightMetrics, CompletionInsightMetrics, CostCalculation } from './InsightGenerator';

export {
  InsightDisplay,
  CompactInsightDisplay,
  InlineInsight,
  createMockInsights,
} from './InsightDisplay';

// Sprint PC5d: Celebration Animation
export {
  CelebrationAnimation,
  CelebrationHeader,
  SuccessCheckmark,
  StaggeredReveal,
} from './CelebrationAnimation';

// Sprint PC5d: Next Steps Checklist
export {
  NextStepsChecklist,
  CompactNextSteps,
  createMockNextSteps,
} from './NextStepsChecklist';
export type { NextStep } from './NextStepsChecklist';

// Sprint PC5d: Share/Export Results
export {
  ShareExportResults,
  CompactShareButton,
  QuickCopyButton,
} from './ShareExportResults';

// Sprint PC5d: Completion Screen
export {
  IngestionCompletionScreen,
  createMockCompletionData,
} from './IngestionCompletionScreen';
export type {
  IngestionCompletionData,
  TokenSavingsBreakdown,
  PerformanceStats,
} from './IngestionCompletionScreen';

// Re-export types from types file
export type {
  PhaseStatus,
  PhaseInfo,
  Phase1FetchingData,
  Phase2AnalysisData,
  Phase3ChunkingData,
  Phase4OptimizationData,
  IngestionMetricsSidebar,
  IngestionProgressContainerProps,
  IngestionResult,
  IngestionError,
  // Sprint PC5d types
  TokenSavingsBreakdown as TokenSavingsBreakdownType,
  CompletionPerformanceStats,
  IngestionCompletionData as IngestionCompletionDataType,
  InsightType as InsightTypeEnum,
  Insight as InsightInterface,
  InsightMetrics as InsightMetricsInterface,
  ProgressBarState,
  ExportFormat,
  CostCalculation as CostCalculationType,
} from '../../types/ingestionProgress';
