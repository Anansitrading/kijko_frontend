import { useState, useEffect, useCallback } from 'react';
import type {
  CompressionMetrics,
  IngestionEntry,
  CompressionAlgorithmInfo,
  CompressedFileItem,
  PendingCompressionFileItem,
  NeverCompressFileItem,
} from '../../../../../types/contextInspector';
import {
  getCompressionData,
  triggerRecompression,
  downloadOriginal,
  renameIngestion as renameIngestionService,
  deleteIngestion as deleteIngestionService,
  updateIngestionTags as updateIngestionTagsService,
  compressIngestion as compressIngestionService,
} from '../../../../../services/compressionService';

export interface UseCompressionDataReturn {
  metrics: CompressionMetrics | null;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo | null;
  compressedFiles: CompressedFileItem[];
  pendingFiles: PendingCompressionFileItem[];
  neverCompressFiles: NeverCompressFileItem[];
  isLoading: boolean;
  error: string | null;
  recompress: () => Promise<void>;
  isRecompressing: boolean;
  download: () => Promise<void>;
  isDownloading: boolean;
  refresh: () => Promise<void>;
  renameIngestion: (ingestionNumber: number, newName: string) => Promise<void>;
  deleteIngestion: (ingestionNumber: number) => Promise<void>;
  updateIngestionTags: (ingestionNumber: number, tags: string[]) => Promise<void>;
  compressIngestion: (ingestionNumber: number) => Promise<void>;
}

export function useCompressionData(contextId: string): UseCompressionDataReturn {
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(null);
  const [history, setHistory] = useState<IngestionEntry[]>([]);
  const [algorithmInfo, setAlgorithmInfo] = useState<CompressionAlgorithmInfo | null>(null);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFileItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingCompressionFileItem[]>([]);
  const [neverCompressFiles, setNeverCompressFiles] = useState<NeverCompressFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecompressing, setIsRecompressing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCompressionData(contextId);
      setMetrics(data.metrics);
      setHistory(data.history);
      setAlgorithmInfo(data.algorithmInfo);
      setCompressedFiles(data.compressedFiles);
      setPendingFiles(data.pendingFiles);
      setNeverCompressFiles(data.neverCompressFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch compression data');
    } finally {
      setIsLoading(false);
    }
  }, [contextId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Directly update state when a new ingestion is added via the service
  useEffect(() => {
    const handleAdded = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.entry) {
        setHistory(prev => [detail.entry, ...prev]);
      }
      if (detail?.metrics) {
        setMetrics(detail.metrics);
      }
    };

    const handleUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.ingestionNumber != null) {
        setHistory(prev => prev.map(entry =>
          entry.number === detail.ingestionNumber
            ? { ...entry, [detail.field]: detail.value }
            : entry
        ));
      }
    };

    const handleDeleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.ingestionNumber != null) {
        setHistory(prev => prev.filter(entry => entry.number !== detail.ingestionNumber));
      }
      if (detail?.metrics) {
        setMetrics(detail.metrics);
      }
    };

    window.addEventListener('kijko-ingestion-added', handleAdded);
    window.addEventListener('kijko-ingestion-updated', handleUpdated);
    window.addEventListener('kijko-ingestion-deleted', handleDeleted);
    return () => {
      window.removeEventListener('kijko-ingestion-added', handleAdded);
      window.removeEventListener('kijko-ingestion-updated', handleUpdated);
      window.removeEventListener('kijko-ingestion-deleted', handleDeleted);
    };
  }, []);

  const recompress = useCallback(async () => {
    try {
      setIsRecompressing(true);
      setError(null);
      await triggerRecompression(contextId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-compression failed');
    } finally {
      setIsRecompressing(false);
    }
  }, [contextId, fetchData]);

  const download = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);
      const blob = await downloadOriginal(contextId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contextId}-original.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [contextId]);

  const renameIngestion = useCallback(async (ingestionNumber: number, newName: string) => {
    await renameIngestionService(contextId, ingestionNumber, newName);
  }, [contextId]);

  const deleteIngestion = useCallback(async (ingestionNumber: number) => {
    await deleteIngestionService(contextId, ingestionNumber);
  }, [contextId]);

  const updateIngestionTags = useCallback(async (ingestionNumber: number, tags: string[]) => {
    await updateIngestionTagsService(contextId, ingestionNumber, tags);
  }, [contextId]);

  const compressIngestion = useCallback(async (ingestionNumber: number) => {
    await compressIngestionService(contextId, ingestionNumber);
  }, [contextId]);

  return {
    metrics,
    history,
    algorithmInfo,
    compressedFiles,
    pendingFiles,
    neverCompressFiles,
    isLoading,
    error,
    recompress,
    isRecompressing,
    download,
    isDownloading,
    refresh: fetchData,
    renameIngestion,
    deleteIngestion,
    updateIngestionTags,
    compressIngestion,
  };
}
