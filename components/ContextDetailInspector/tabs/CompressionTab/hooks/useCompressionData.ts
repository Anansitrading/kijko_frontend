import { useState, useEffect, useCallback } from 'react';
import type {
  CompressionMetrics,
  IngestionEntry,
  CompressionAlgorithmInfo,
} from '../../../../../types/contextInspector';
import {
  getCompressionData,
  triggerRecompression,
  downloadOriginal,
} from '../../../../../services/compressionService';

export interface UseCompressionDataReturn {
  metrics: CompressionMetrics | null;
  history: IngestionEntry[];
  algorithmInfo: CompressionAlgorithmInfo | null;
  isLoading: boolean;
  error: string | null;
  recompress: () => Promise<void>;
  isRecompressing: boolean;
  download: () => Promise<void>;
  isDownloading: boolean;
  refresh: () => Promise<void>;
}

export function useCompressionData(contextId: string): UseCompressionDataReturn {
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(null);
  const [history, setHistory] = useState<IngestionEntry[]>([]);
  const [algorithmInfo, setAlgorithmInfo] = useState<CompressionAlgorithmInfo | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch compression data');
    } finally {
      setIsLoading(false);
    }
  }, [contextId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return {
    metrics,
    history,
    algorithmInfo,
    isLoading,
    error,
    recompress,
    isRecompressing,
    download,
    isDownloading,
    refresh: fetchData,
  };
}
