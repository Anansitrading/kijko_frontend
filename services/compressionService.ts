/**
 * Compression Service
 * Handles API calls for compression metrics and actions
 */

import type {
  CompressionMetrics,
  IngestionEntry,
  IngestionSourceType,
  CompressionAlgorithmInfo,
  CompressedFileItem,
  PendingCompressionFileItem,
  NeverCompressFileItem,
} from '../types/contextInspector';

// Mock data for development
const MOCK_COMPRESSED_FILES: CompressedFileItem[] = [
  { id: 'cf-1', name: 'App.tsx', path: 'src/App.tsx', originalTokens: 12400, compressedTokens: 640 },
  { id: 'cf-2', name: 'index.ts', path: 'src/index.ts', originalTokens: 2100, compressedTokens: 180 },
  { id: 'cf-3', name: 'types.ts', path: 'src/types.ts', originalTokens: 8300, compressedTokens: 420 },
  { id: 'cf-4', name: 'Sidebar.tsx', path: 'src/components/Sidebar.tsx', originalTokens: 5500, compressedTokens: 310 },
  { id: 'cf-5', name: 'HypervisaView.tsx', path: 'src/components/HypervisaView.tsx', originalTokens: 14800, compressedTokens: 780 },
  { id: 'cf-6', name: 'SettingsContext.tsx', path: 'src/contexts/SettingsContext.tsx', originalTokens: 7600, compressedTokens: 390 },
  { id: 'cf-7', name: 'useTheme.ts', path: 'src/hooks/useTheme.ts', originalTokens: 1200, compressedTokens: 95 },
  { id: 'cf-8', name: 'ProjectsDashboard.tsx', path: 'src/components/ProjectsDashboard.tsx', originalTokens: 10900, compressedTokens: 560 },
  { id: 'cf-9', name: 'NotificationContext.tsx', path: 'src/contexts/NotificationContext.tsx', originalTokens: 5300, compressedTokens: 270 },
  { id: 'cf-10', name: 'main.py', path: 'src/main.py', originalTokens: 3500, compressedTokens: 200 },
  { id: 'cf-11', name: 'ContextDetailInspector.tsx', path: 'src/components/ContextDetailInspector.tsx', originalTokens: 18500, compressedTokens: 950 },
  { id: 'cf-12', name: 'ChatHistoryPanel.tsx', path: 'src/components/ChatHistoryPanel.tsx', originalTokens: 9100, compressedTokens: 470 },
];

const MOCK_PENDING_FILES: PendingCompressionFileItem[] = [
  { id: 'pf-1', name: 'IngestionWizard.tsx', path: 'src/components/Hypervisa/IngestionWizard.tsx', currentTokens: 14800, estimatedTokens: 760 },
  { id: 'pf-2', name: 'ProjectCard.tsx', path: 'src/components/ProjectOverview/ProjectCard.tsx', currentTokens: 4200, estimatedTokens: 220 },
  { id: 'pf-3', name: 'ChatInput.tsx', path: 'src/components/ContextDetailInspector/ChatInput.tsx', currentTokens: 3100, estimatedTokens: 160 },
  { id: 'pf-4', name: 'EmptyState.tsx', path: 'src/components/EmptyState.tsx', currentTokens: 2100, estimatedTokens: 110 },
  { id: 'pf-5', name: 'StatusBadge.tsx', path: 'src/components/StatusBadge.tsx', currentTokens: 1800, estimatedTokens: 95 },
];

const MOCK_NEVER_COMPRESS_FILES: NeverCompressFileItem[] = [
  { id: 'nf-1', name: 'api-spec.json', path: 'src/api-spec.json', tokens: 44500, reason: 'API specification — must remain exact' },
  { id: 'nf-2', name: 'package.json', path: 'package.json', tokens: 3100, reason: 'Package manifest' },
  { id: 'nf-3', name: 'tsconfig.json', path: 'tsconfig.json', tokens: 800, reason: 'TypeScript configuration' },
];

const MOCK_COMPRESSION_DATA: Record<string, {
  metrics: CompressionMetrics;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo;
  compressedFiles: CompressedFileItem[];
  pendingFiles: PendingCompressionFileItem[];
  neverCompressFiles: NeverCompressFileItem[];
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
      { number: 12, timestamp: new Date('2026-01-22T15:23:00'), filesAdded: 127, filesRemoved: 3, tokens: 389200, compressedTokens: 20200, displayName: 'Full project sync', tags: ['sync', 'release'], compressed: true, sourceType: 'repo' },
      { number: 11, timestamp: new Date('2026-01-19T09:45:00'), filesAdded: 45, filesRemoved: 1, tokens: 134500, compressedTokens: 6980, displayName: 'Auth module update', tags: ['auth'], compressed: true, sourceType: 'file' },
      { number: 10, timestamp: new Date('2026-01-15T14:12:00'), filesAdded: 89, filesRemoved: 12, tokens: 267800, compressedTokens: 13900, displayName: 'API refactor', tags: ['refactor', 'api'], compressed: true, sourceType: 'repo' },
      { number: 9, timestamp: new Date('2026-01-12T11:30:00'), filesAdded: 23, filesRemoved: 0, tokens: 48200, displayName: 'Config files', tags: ['config'], compressed: false, neverCompress: true, sourceType: 'file' },
      { number: 8, timestamp: new Date('2026-01-09T16:45:00'), filesAdded: 156, filesRemoved: 8, tokens: 485600, compressedTokens: 25200, displayName: 'Dashboard components', tags: ['ui'], compressed: true, sourceType: 'repo' },
      { number: 7, timestamp: new Date('2026-01-05T10:20:00'), filesAdded: 67, filesRemoved: 4, tokens: 178400, displayName: 'Utility functions', tags: ['utils'], compressed: false, sourceType: 'file' },
      { number: 6, timestamp: new Date('2026-01-02T13:15:00'), filesAdded: 34, filesRemoved: 2, tokens: 92100, compressedTokens: 4780, displayName: 'Test suite', tags: ['tests'], compressed: true, sourceType: 'file' },
      { number: 5, timestamp: new Date('2025-12-28T09:00:00'), filesAdded: 201, filesRemoved: 15, tokens: 612400, compressedTokens: 31800, displayName: 'Initial codebase import', tags: ['initial', 'sync'], compressed: true, sourceType: 'repo' },
      { number: 4, timestamp: new Date('2025-12-24T14:30:00'), filesAdded: 78, filesRemoved: 5, tokens: 156800, displayName: 'Shared types', tags: ['types'], compressed: false, neverCompress: true, sourceType: 'text' },
      { number: 3, timestamp: new Date('2025-12-20T11:45:00'), filesAdded: 112, filesRemoved: 7, tokens: 289600, compressedTokens: 15040, displayName: 'Core services', tags: ['core'], compressed: true, sourceType: 'file' },
    ],
    algorithmInfo: {
      method: 'Hypervisa Contextual Compression v2.1',
      preserves: ['Structure', 'Types', 'Exports', 'Documentation'],
      optimizationLevel: 'High (favor accuracy over compression)',
    },
    compressedFiles: MOCK_COMPRESSED_FILES,
    pendingFiles: MOCK_PENDING_FILES,
    neverCompressFiles: MOCK_NEVER_COMPRESS_FILES,
  },
};

export interface CompressionDataResponse {
  metrics: CompressionMetrics;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo;
  compressedFiles: CompressedFileItem[];
  pendingFiles: PendingCompressionFileItem[];
  neverCompressFiles: NeverCompressFileItem[];
}

export async function getCompressionData(contextId: string): Promise<CompressionDataResponse> {
  await new Promise(resolve => setTimeout(resolve, 800));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  return data;
}

export async function addIngestionEntry(
  contextId: string,
  filesAdded: number,
  filesRemoved: number = 0,
  displayName?: string,
  tokens: number = 0,
  sourceType?: IngestionSourceType,
  compressed?: boolean,
  neverCompress?: boolean
): Promise<IngestionEntry> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  const maxNumber = data.history.reduce((max, e) => Math.max(max, e.number), 0);
  const newEntry: IngestionEntry = {
    number: maxNumber + 1,
    timestamp: new Date(),
    filesAdded,
    filesRemoved,
    tokens,
    displayName,
    sourceType,
    compressed,
    neverCompress,
  };
  // Create new array reference so React detects the change
  data.history = [newEntry, ...data.history];
  data.metrics = {
    ...data.metrics,
    totalIngestions: data.metrics.totalIngestions + 1,
    lastIngestion: new Date(),
  };

  // Notify listeners with the new entry + updated metrics
  window.dispatchEvent(new CustomEvent('kijko-ingestion-added', {
    detail: { entry: newEntry, metrics: data.metrics },
  }));

  return newEntry;
}

export async function renameIngestion(
  contextId: string,
  ingestionNumber: number,
  newName: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  const entry = data.history.find(e => e.number === ingestionNumber);
  if (entry) {
    entry.displayName = newName;
  }
  window.dispatchEvent(new CustomEvent('kijko-ingestion-updated', {
    detail: { ingestionNumber, field: 'displayName', value: newName },
  }));
}

export async function deleteIngestion(
  contextId: string,
  ingestionNumber: number
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  data.history = data.history.filter(e => e.number !== ingestionNumber);
  data.metrics = {
    ...data.metrics,
    totalIngestions: Math.max(0, data.metrics.totalIngestions - 1),
  };
  window.dispatchEvent(new CustomEvent('kijko-ingestion-deleted', {
    detail: { ingestionNumber, metrics: data.metrics },
  }));
}

export async function updateIngestionTags(
  contextId: string,
  ingestionNumber: number,
  tags: string[]
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  const entry = data.history.find(e => e.number === ingestionNumber);
  if (entry) {
    entry.tags = tags;
  }
  window.dispatchEvent(new CustomEvent('kijko-ingestion-updated', {
    detail: { ingestionNumber, field: 'tags', value: tags },
  }));
}

export async function compressIngestion(
  contextId: string,
  ingestionNumber: number
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const data = MOCK_COMPRESSION_DATA[contextId] || MOCK_COMPRESSION_DATA.default;
  const entry = data.history.find(e => e.number === ingestionNumber);
  if (entry) {
    entry.compressed = true;
  }
  window.dispatchEvent(new CustomEvent('kijko-ingestion-updated', {
    detail: { ingestionNumber, field: 'compressed', value: true },
  }));
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
