/**
 * Compression Service
 * Handles API calls for compression metrics and actions
 */

import type {
  CompressionMetrics,
  IngestionEntry,
  CompressionAlgorithmInfo,
} from '../types/contextInspector';

// Mock data for development
const MOCK_COMPRESSION_DATA: Record<string, {
  metrics: CompressionMetrics;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo;
}> = {
  default: {
    metrics: {
      originalTokens: 2458624,
      compressedTokens: 126847,
      ratio: 19.4,
      savingsPercent: 94.8,
      costSavings: 23.32,
      totalIngestions: 12,
      lastIngestion: new Date(Date.now() - 2 * 60 * 60 * 1000),
      avgInterval: 3.2,
    },
    history: [
      { number: 12, timestamp: new Date('2026-01-22T15:23:00'), filesAdded: 127, filesRemoved: 3 },
      { number: 11, timestamp: new Date('2026-01-19T09:45:00'), filesAdded: 45, filesRemoved: 1 },
      { number: 10, timestamp: new Date('2026-01-15T14:12:00'), filesAdded: 89, filesRemoved: 12 },
      { number: 9, timestamp: new Date('2026-01-12T11:30:00'), filesAdded: 23, filesRemoved: 0 },
      { number: 8, timestamp: new Date('2026-01-09T16:45:00'), filesAdded: 156, filesRemoved: 8 },
      { number: 7, timestamp: new Date('2026-01-05T10:20:00'), filesAdded: 67, filesRemoved: 4 },
      { number: 6, timestamp: new Date('2026-01-02T13:15:00'), filesAdded: 34, filesRemoved: 2 },
      { number: 5, timestamp: new Date('2025-12-28T09:00:00'), filesAdded: 201, filesRemoved: 15 },
      { number: 4, timestamp: new Date('2025-12-24T14:30:00'), filesAdded: 78, filesRemoved: 5 },
      { number: 3, timestamp: new Date('2025-12-20T11:45:00'), filesAdded: 112, filesRemoved: 7 },
    ],
    algorithmInfo: {
      method: 'Hypervisa Contextual Compression v2.1',
      preserves: ['Structure', 'Types', 'Exports', 'Documentation'],
      optimizationLevel: 'High (favor accuracy over compression)',
    },
  },
};

export interface CompressionDataResponse {
  metrics: CompressionMetrics;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo;
}

export async function getCompressionData(contextId: string): Promise<CompressionDataResponse> {
  await new Promise(resolve => setTimeout(resolve, 800));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  return data;
}

export async function triggerRecompression(contextId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 2500));
  return {
    success: true,
    message: 'Re-compression completed successfully',
  };
}

export async function downloadOriginal(contextId: string): Promise<Blob> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return new Blob(['Mock original content'], { type: 'application/octet-stream' });
}
