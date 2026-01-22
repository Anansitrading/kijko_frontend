// useRollback Hook - Manages rollback preview and execution
import { useState, useEffect, useCallback } from 'react';
import type { RollbackPreview, UseRollbackReturn } from '../../../types/contextInspector';

function generateMockPreview(contextId: string, targetVersion: number): RollbackPreview {
  return {
    filesToRestore: 847,
    filesToRemove: 127,
    filesToReAdd: 3,
    currentVersion: targetVersion + 1,
    targetVersion,
  };
}

export function useRollback(contextId: string, targetVersion: number): UseRollbackReturn {
  const [preview, setPreview] = useState<RollbackPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    if (!contextId || targetVersion < 0) {
      setPreview(null);
      return;
    }

    let cancelled = false;

    async function fetchPreview() {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (cancelled) return;
        const mockPreview = generateMockPreview(contextId, targetVersion);
        setPreview(mockPreview);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch rollback preview');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPreview();
    return () => { cancelled = true; };
  }, [contextId, targetVersion]);

  const rollback = useCallback(async () => {
    if (!contextId || targetVersion < 0) return;

    setIsRollingBack(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Rollback to version ${targetVersion} completed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
      throw err;
    } finally {
      setIsRollingBack(false);
    }
  }, [contextId, targetVersion]);

  return { preview, isLoading, error, rollback, isRollingBack };
}
