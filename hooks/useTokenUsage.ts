import { useMemo } from 'react';
import { useSourceFiles } from '../contexts/SourceFilesContext';

// Token estimation constants
const BYTES_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 bytes
const MAX_CONTEXT_TOKENS = 128000; // Default max tokens

export interface TokenUsage {
  currentTokens: number;
  maxTokens: number;
  percentage: number;
}

/**
 * Hook to calculate token usage based on selected source files.
 * Uses the SourceFilesContext to get the selected files and their sizes.
 */
export function useTokenUsage(): TokenUsage {
  const { selectedSize } = useSourceFiles();

  const tokenUsage = useMemo(() => {
    const estimatedTokens = Math.round(selectedSize / BYTES_PER_TOKEN);
    const percentage = Math.min((estimatedTokens / MAX_CONTEXT_TOKENS) * 100, 100);

    return {
      currentTokens: estimatedTokens,
      maxTokens: MAX_CONTEXT_TOKENS,
      percentage,
    };
  }, [selectedSize]);

  return tokenUsage;
}
