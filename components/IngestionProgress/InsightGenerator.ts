import type { IngestionPhase } from '../../types/project';

// =============================================================================
// Types
// =============================================================================

export type InsightType = 'positive' | 'neutral' | 'warning';

export interface Insight {
  id: string;
  type: InsightType;
  icon: string;
  message: string;
  priority: number;
  phase?: IngestionPhase;
  timestamp: Date;
}

export interface InsightMetrics {
  // Token metrics
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;

  // Chunking metrics
  totalChunks?: number;
  avgChunkSize?: number;

  // File metrics
  filesProcessed: number;
  totalFiles: number;

  // Performance metrics
  processingTimeSeconds?: number;
  queryLatencyMs?: number;
  relevanceScore?: number;

  // Cost metrics
  estimatedCostPerQuery?: number;
  monthlySavings?: number;

  // Deduplication
  tokensRemovedByDedup?: number;
  tokensRemovedByPattern?: number;
  tokensRemovedByWhitespace?: number;
  tokensRemovedByImports?: number;
}

// =============================================================================
// Icon Constants
// =============================================================================

export const INSIGHT_ICONS = {
  positive: '✨',
  rocket: '🚀',
  celebration: '🎉',
  money: '💰',
  lightbulb: '💡',
  target: '🎯',
  chart: '📊',
  warning: '⚠️',
  clock: '⏱️',
  files: '📁',
  check: '✓',
};

// =============================================================================
// Context Window Constants (Claude and GPT-4)
// =============================================================================

const CONTEXT_WINDOWS = {
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
};

// Coffee cost for fun comparison (average €3.50)
const COFFEE_COST_EUR = 3.5;

// =============================================================================
// Insight Generator Function
// =============================================================================

let insightIdCounter = 0;

function createInsight(
  type: InsightType,
  icon: string,
  message: string,
  priority: number,
  phase?: IngestionPhase
): Insight {
  return {
    id: `insight-${++insightIdCounter}-${Date.now()}`,
    type,
    icon,
    message,
    priority,
    phase,
    timestamp: new Date(),
  };
}

export function generateInsights(
  metrics: InsightMetrics,
  phase: IngestionPhase
): Insight[] {
  const insights: Insight[] = [];

  // ==========================================================================
  // Phase-specific insights
  // ==========================================================================

  if (phase === 'repository_fetch') {
    // File count insight
    if (metrics.totalFiles > 100) {
      insights.push(createInsight(
        'neutral',
        INSIGHT_ICONS.files,
        `Processing ${metrics.totalFiles.toLocaleString()} files - this is a substantial codebase!`,
        3,
        phase
      ));
    }
  }

  if (phase === 'parsing') {
    // Processing speed insight
    if (metrics.processingTimeSeconds && metrics.filesProcessed > 0) {
      const filesPerSecond = metrics.filesProcessed / metrics.processingTimeSeconds;
      if (filesPerSecond > 10) {
        insights.push(createInsight(
          'positive',
          INSIGHT_ICONS.rocket,
          `Processing at ${filesPerSecond.toFixed(1)} files/second`,
          2,
          phase
        ));
      }
    }
  }

  if (phase === 'chunking') {
    // Chunk size insight
    if (metrics.avgChunkSize !== undefined) {
      if (metrics.avgChunkSize < 1500) {
        insights.push(createInsight(
          'positive',
          INSIGHT_ICONS.positive,
          'Perfect chunk size for optimal query relevance',
          1,
          phase
        ));
      } else if (metrics.avgChunkSize > 4000) {
        insights.push(createInsight(
          'warning',
          INSIGHT_ICONS.warning,
          'Some chunks are large - consider more granular settings',
          3,
          phase
        ));
      }
    }

    // Total chunks insight
    if (metrics.totalChunks) {
      insights.push(createInsight(
        'neutral',
        INSIGHT_ICONS.chart,
        `Created ${metrics.totalChunks.toLocaleString()} semantic chunks for precise retrieval`,
        4,
        phase
      ));
    }
  }

  if (phase === 'optimization') {
    // Token savings breakdown
    if (metrics.tokensRemovedByDedup && metrics.tokensRemovedByDedup > 10000) {
      insights.push(createInsight(
        'positive',
        INSIGHT_ICONS.positive,
        `Removed ${(metrics.tokensRemovedByDedup / 1000).toFixed(1)}K duplicate tokens`,
        2,
        phase
      ));
    }
  }

  // ==========================================================================
  // General insights (applicable across phases)
  // ==========================================================================

  // Reduction percentage insight
  if (metrics.reductionPercent > 70) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.rocket,
      `Exceptional ${metrics.reductionPercent}% reduction achieved!`,
      1
    ));
  } else if (metrics.reductionPercent > 50) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.positive,
      `Great ${metrics.reductionPercent}% token reduction`,
      2
    ));
  }

  // Context multiplier insight
  const contextMultiplier = Math.floor(CONTEXT_WINDOWS['claude-3-opus'] / metrics.optimizedTokens);
  if (contextMultiplier > 1) {
    insights.push(createInsight(
      'neutral',
      INSIGHT_ICONS.lightbulb,
      `Your code fits ${contextMultiplier}x in Claude's context window`,
      2
    ));
  }

  // Cost savings insight
  if (metrics.monthlySavings && metrics.monthlySavings > 0) {
    const coffeesPerMonth = Math.floor(metrics.monthlySavings / COFFEE_COST_EUR);
    if (coffeesPerMonth > 5) {
      insights.push(createInsight(
        'positive',
        INSIGHT_ICONS.money,
        `That's ${coffeesPerMonth} cups of coffee saved per month!`,
        3
      ));
    }
  }

  // Query latency insight
  if (metrics.queryLatencyMs !== undefined && metrics.queryLatencyMs < 200) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.clock,
      `Lightning-fast <${metrics.queryLatencyMs}ms query latency`,
      2
    ));
  }

  // Relevance score insight
  if (metrics.relevanceScore !== undefined && metrics.relevanceScore > 95) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.target,
      `${metrics.relevanceScore}% relevance score - excellent retrieval quality`,
      1
    ));
  }

  // Sort by priority (lower is higher priority)
  return insights.sort((a, b) => a.priority - b.priority);
}

// =============================================================================
// Completion-specific Insights
// =============================================================================

export interface CompletionInsightMetrics extends InsightMetrics {
  totalDurationSeconds: number;
  languagesDetected?: string[];
}

export function generateCompletionInsights(metrics: CompletionInsightMetrics): Insight[] {
  const insights: Insight[] = [];

  // Celebrate completion
  insights.push(createInsight(
    'positive',
    INSIGHT_ICONS.celebration,
    `Project ingestion complete in ${formatDuration(metrics.totalDurationSeconds)}!`,
    0
  ));

  // Token efficiency
  const tokensSaved = metrics.originalTokens - metrics.optimizedTokens;
  if (tokensSaved > 100000) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.rocket,
      `Saved ${(tokensSaved / 1000).toFixed(0)}K tokens - ${metrics.reductionPercent}% more efficient`,
      1
    ));
  }

  // Context window comparison
  const claudeContextFits = Math.floor(CONTEXT_WINDOWS['claude-3-opus'] / metrics.optimizedTokens);
  const gpt4ContextFits = Math.floor(CONTEXT_WINDOWS['gpt-4-turbo'] / metrics.optimizedTokens);

  if (claudeContextFits >= 1) {
    insights.push(createInsight(
      'neutral',
      INSIGHT_ICONS.lightbulb,
      `Fits ${claudeContextFits}x in Claude (200K), ${gpt4ContextFits}x in GPT-4 Turbo (128K)`,
      2
    ));
  }

  // Cost impact
  if (metrics.estimatedCostPerQuery !== undefined) {
    const originalCost = metrics.estimatedCostPerQuery / (1 - metrics.reductionPercent / 100);
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.money,
      `Query cost reduced from €${originalCost.toFixed(2)} to €${metrics.estimatedCostPerQuery.toFixed(2)}`,
      2
    ));
  }

  // Languages detected
  if (metrics.languagesDetected && metrics.languagesDetected.length > 1) {
    insights.push(createInsight(
      'neutral',
      INSIGHT_ICONS.chart,
      `Analyzed ${metrics.languagesDetected.length} languages: ${metrics.languagesDetected.slice(0, 3).join(', ')}${metrics.languagesDetected.length > 3 ? '...' : ''}`,
      3
    ));
  }

  // Performance metrics
  if (metrics.queryLatencyMs !== undefined) {
    insights.push(createInsight(
      'positive',
      INSIGHT_ICONS.clock,
      `Ready for queries with <${metrics.queryLatencyMs}ms latency`,
      3
    ));
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

// =============================================================================
// Cost Calculator
// =============================================================================

export interface CostCalculation {
  originalCostPerQuery: number;
  optimizedCostPerQuery: number;
  savingsPerQuery: number;
  savingsPercent: number;
  monthlySavings: number;
  yearlysSavings: number;
}

// Claude 3 Opus pricing (approximate EUR)
const CLAUDE_COST_PER_1M_INPUT_TOKENS = 15; // €15 per 1M input tokens
const CLAUDE_COST_PER_1M_OUTPUT_TOKENS = 75; // €75 per 1M output tokens

export function calculateCostImpact(
  originalTokens: number,
  optimizedTokens: number,
  queriesPerMonth: number = 30
): CostCalculation {
  const originalCostPerQuery = (originalTokens / 1000000) * CLAUDE_COST_PER_1M_INPUT_TOKENS;
  const optimizedCostPerQuery = (optimizedTokens / 1000000) * CLAUDE_COST_PER_1M_INPUT_TOKENS;
  const savingsPerQuery = originalCostPerQuery - optimizedCostPerQuery;
  const savingsPercent = (savingsPerQuery / originalCostPerQuery) * 100;
  const monthlySavings = savingsPerQuery * queriesPerMonth;
  const yearlysSavings = monthlySavings * 12;

  return {
    originalCostPerQuery,
    optimizedCostPerQuery,
    savingsPerQuery,
    savingsPercent,
    monthlySavings,
    yearlysSavings,
  };
}

// =============================================================================
// Mock Data for Development
// =============================================================================

export function createMockInsightMetrics(): InsightMetrics {
  return {
    originalTokens: 185400,
    optimizedTokens: 42500,
    reductionPercent: 77,
    totalChunks: 89,
    avgChunkSize: 1200,
    filesProcessed: 127,
    totalFiles: 127,
    processingTimeSeconds: 45,
    queryLatencyMs: 180,
    relevanceScore: 96,
    estimatedCostPerQuery: 0.64,
    monthlySavings: 25.60,
    tokensRemovedByDedup: 45200,
    tokensRemovedByPattern: 32100,
    tokensRemovedByWhitespace: 12400,
    tokensRemovedByImports: 8200,
  };
}
