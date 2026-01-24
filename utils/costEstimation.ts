/**
 * Cost estimation utilities for project creation review screen
 * Calculates token estimates and pricing based on project configuration
 */

import type {
  CostEstimate,
  PricingTier,
  ProjectCreationForm,
  RepositoryInput,
  FileInput,
  ChunkingStrategy,
} from '../types/project';

// =============================================================================
// Pricing Configuration
// =============================================================================

/** Pricing tiers by plan */
export const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    plan: 'free',
    tokenLimit: 100_000,
    processingRatePerMillion: 0,       // Included in free tier
    storageRatePerMillion: 0,          // Included in free tier
    includedTokens: 100_000,
  },
  pro: {
    plan: 'pro',
    tokenLimit: 10_000_000,
    processingRatePerMillion: 200,     // $2.00 per 1M tokens
    storageRatePerMillion: 50,         // $0.50 per 1M tokens/month
    includedTokens: 1_000_000,
  },
  enterprise: {
    plan: 'enterprise',
    tokenLimit: Infinity,
    processingRatePerMillion: 150,     // $1.50 per 1M tokens (volume discount)
    storageRatePerMillion: 30,         // $0.30 per 1M tokens/month
    includedTokens: 5_000_000,
  },
};

/** Compression ratios by chunking strategy (lower = better compression) */
const COMPRESSION_RATIOS: Record<ChunkingStrategy, number> = {
  semantic: 0.05,    // 95% reduction (best)
  recursive: 0.08,   // 92% reduction
  fixed: 0.15,       // 85% reduction
  custom: 0.10,      // 90% reduction (estimated)
};

// =============================================================================
// Token Estimation
// =============================================================================

/**
 * Estimate tokens from repository metadata
 * Uses LOC estimate * average tokens per line
 */
export function estimateTokensFromRepository(
  repo: RepositoryInput & { locEstimate?: number; fileCount?: number }
): number {
  // If we have LOC estimate, use it (1 LOC ~ 4 tokens average)
  if (repo.locEstimate) {
    return repo.locEstimate * 4;
  }

  // Fallback: estimate based on file count (average 200 LOC per file)
  if (repo.fileCount) {
    return repo.fileCount * 200 * 4;
  }

  // Default estimate for unknown repos (medium-sized project)
  return 50_000;
}

/**
 * Estimate tokens from uploaded files
 */
export function estimateTokensFromFiles(files: FileInput[]): number {
  return files.reduce((total, file) => {
    // Average bytes per token varies by file type
    const bytesPerToken = file.type.includes('json') ? 6 : 4;
    return total + Math.ceil(file.size / bytesPerToken);
  }, 0);
}

/**
 * Estimate tokens from manual content
 */
export function estimateTokensFromManualContent(content: string): number {
  // Rough approximation: 1 token ~ 4 characters
  return Math.ceil(content.length / 4);
}

/**
 * Estimate total tokens for a project based on its configuration
 */
export function estimateTotalTokens(
  formData: ProjectCreationForm,
  repoMetadata?: Map<string, { locEstimate?: number; fileCount?: number }>
): number {
  let totalTokens = 0;

  if (formData.projectType === 'repository') {
    totalTokens = formData.repositories.reduce((sum, repo) => {
      const metadata = repoMetadata?.get(repo.url) || {};
      return sum + estimateTokensFromRepository({ ...repo, ...metadata });
    }, 0);
  } else if (formData.projectType === 'files' && formData.files) {
    totalTokens = estimateTokensFromFiles(formData.files);
  } else if (formData.projectType === 'manual' && formData.manualContent) {
    totalTokens = estimateTokensFromManualContent(formData.manualContent);
  }

  return totalTokens;
}

// =============================================================================
// Cost Calculation
// =============================================================================

/**
 * Calculate complete cost estimate for a project
 */
export function calculateCostEstimate(
  formData: ProjectCreationForm,
  currentPlan: 'free' | 'pro' | 'enterprise' = 'free',
  repoMetadata?: Map<string, { locEstimate?: number; fileCount?: number }>
): CostEstimate {
  const pricing = PRICING_TIERS[currentPlan];
  const compressionRatio = COMPRESSION_RATIOS[formData.chunkingStrategy] || 0.10;

  // Calculate total tokens
  const totalTokens = estimateTotalTokens(formData, repoMetadata);

  // Calculate optimized tokens after compression
  const optimizedTokens = Math.ceil(totalTokens * compressionRatio);

  // Check if within plan limits
  const isPlanEligible = optimizedTokens <= pricing.includedTokens;

  // Calculate billable tokens (after free tier)
  const billableTokens = Math.max(0, optimizedTokens - pricing.includedTokens);

  // Calculate costs (in cents)
  const processingCost = isPlanEligible
    ? 0
    : Math.ceil((billableTokens / 1_000_000) * pricing.processingRatePerMillion);

  const storageCostMonthly = currentPlan === 'free'
    ? 0
    : Math.ceil((optimizedTokens / 1_000_000) * pricing.storageRatePerMillion);

  // Calculate savings vs raw context usage
  // Assume raw context would be billed at processing rate without compression
  const rawCost = (totalTokens / 1_000_000) * pricing.processingRatePerMillion;
  const savingsVsRaw = rawCost > 0
    ? ((rawCost - processingCost) / rawCost) * 100
    : 100;

  return {
    processingCost,
    storageCostMonthly,
    totalTokens,
    optimizedTokens,
    compressionRatio,
    isPlanEligible,
    planName: currentPlan,
    savingsVsRaw,
  };
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format cents to currency string
 * @param cents - Amount in cents
 * @returns Formatted string (e.g., "Free", "50c", "$1.50")
 */
export function formatCostFromCents(cents: number): string {
  if (cents === 0) return 'Gratis';
  if (cents < 100) return `${cents}c`;
  return `€${(cents / 100).toFixed(2)}`;
}

/**
 * Format large numbers with K/M suffix
 * @param num - Number to format
 * @returns Formatted string (e.g., "50K", "1.2M")
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format token count with suffix
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "50K tokens")
 */
export function formatTokens(tokens: number): string {
  return `${formatCompactNumber(tokens)} tokens`;
}

/**
 * Format compression percentage
 * @param ratio - Compression ratio (e.g., 0.05 = 95% reduction)
 * @returns Formatted string (e.g., "95% smaller")
 */
export function formatCompression(ratio: number): string {
  const reduction = Math.round((1 - ratio) * 100);
  return `${reduction}% kleiner`;
}

/**
 * Get human-readable description for chunking strategy
 */
export function getChunkingDescription(strategy: ChunkingStrategy): string {
  const descriptions: Record<ChunkingStrategy, string> = {
    semantic: 'Semantisch (aanbevolen)',
    recursive: 'Recursief',
    fixed: 'Vaste grootte',
    custom: 'Aangepast',
  };
  return descriptions[strategy] || strategy;
}
