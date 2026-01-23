import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { SettingsValue, UseAutoSaveOptions, UseAutoSaveReturn, SaveStatus } from '../types/settings';
import { animations } from '../styles/settings';

// Simulated API call for saving settings
// TODO: Replace with actual Supabase integration
async function saveToBackend(key: string, value: SettingsValue): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

  // Simulate occasional failures for testing retry logic (5% failure rate)
  if (Math.random() < 0.05) {
    throw new Error('Network error: Failed to save setting');
  }
}

export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const {
    debounceMs = animations.debounceDelay,
    maxRetries = animations.maxRetries,
    retryDelayMs = animations.retryDelay,
    onSuccess,
    onError,
  } = options;

  const { setSetting, setSaveStatus, setSaveError, addPendingSave, removePendingSave } = useSettings();

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs for managing debounce and retry state
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastSaveRef = useRef<{ key: string; value: SettingsValue } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Core save function with retry logic
  const executeSave = useCallback(async (key: string, value: SettingsValue): Promise<void> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear any existing "saved" timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    setStatus('saving');
    setSaveStatus('saving');
    setError(null);
    addPendingSave(key);

    try {
      // Optimistic update - update local state immediately
      setSetting(key, value);

      // Save to backend
      await saveToBackend(key, value);

      // Success
      retryCountRef.current = 0;
      setStatus('saved');
      setSaveStatus('saved');
      removePendingSave(key);

      // Call success callback
      onSuccess?.(key, value);

      // Auto-dismiss "saved" status after duration
      savedTimeoutRef.current = setTimeout(() => {
        setStatus('idle');
        setSaveStatus('idle');
      }, animations.saveStatusDuration);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save setting';

      // Check if we should retry
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = retryDelayMs * Math.pow(2, retryCountRef.current - 1); // Exponential backoff

        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Only retry if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          return executeSave(key, value);
        }
      } else {
        // Max retries exceeded
        setStatus('error');
        setSaveStatus('error');
        setError(errorMessage);
        setSaveError(errorMessage);
        removePendingSave(key);

        // Call error callback
        onError?.(key, err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [setSetting, setSaveStatus, setSaveError, addPendingSave, removePendingSave, maxRetries, retryDelayMs, onSuccess, onError]);

  // Main save function with optional debouncing
  const save = useCallback(async (key: string, value: SettingsValue, immediate = false): Promise<void> => {
    // Store the last save request for retry
    lastSaveRef.current = { key, value };

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      // Save immediately (for toggles, dropdowns)
      retryCountRef.current = 0;
      await executeSave(key, value);
    } else {
      // Debounced save (for text inputs)
      debounceTimerRef.current = setTimeout(async () => {
        retryCountRef.current = 0;
        await executeSave(key, value);
      }, debounceMs);
    }
  }, [executeSave, debounceMs]);

  // Retry the last failed save
  const retry = useCallback(async (): Promise<void> => {
    if (lastSaveRef.current) {
      retryCountRef.current = 0;
      await executeSave(lastSaveRef.current.key, lastSaveRef.current.value);
    }
  }, [executeSave]);

  // Cancel any pending saves
  const cancel = useCallback((): void => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setSaveStatus('idle');
    setError(null);
    setSaveError(null);
  }, [setSaveStatus, setSaveError]);

  return {
    save,
    status,
    error,
    retry,
    cancel,
  };
}

export default useAutoSave;
