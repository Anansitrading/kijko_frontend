/** Hook for managing an IDE session — code-server proxy, Chronos timeline. */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getIdeSession,
  getTimeline,
  captureCheckpoint,
  rewindToSnapshot,
  forkFromSnapshot,
  type IdeSession,
  type ChronosSnapshot,
  type ChronosEvent,
} from '../services/sandraApi';

interface UseIdeSessionReturn {
  session: IdeSession | null;
  timeline: ChronosSnapshot[];
  events: ChronosEvent[];
  loading: boolean;
  error: string | null;
  checkpoint: () => Promise<void>;
  rewind: (snapshotId: string) => Promise<void>;
  fork: (snapshotId: string, count?: number) => Promise<IdeSession[]>;
  refresh: () => Promise<void>;
  isRewinding: boolean;
}

export function useIdeSession(sessionId: string): UseIdeSessionReturn {
  const [session, setSession] = useState<IdeSession | null>(null);
  const [timeline, setTimeline] = useState<ChronosSnapshot[]>([]);
  const [events, setEvents] = useState<ChronosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRewinding, setIsRewinding] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [sess, tl] = await Promise.all([
        getIdeSession(sessionId),
        getTimeline(sessionId),
      ]);
      setSession(sess);
      setTimeline(tl);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial load + SSE event stream
  useEffect(() => {
    refresh();

    // Connect to SSE event stream
    const token = localStorage.getItem('access_token');
    const es = new EventSource(
      `/api/v1/scrubber/${sessionId}/stream${token ? `?token=${token}` : ''}`
    );
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: ChronosEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);
      } catch {
        // Ignore parse errors from keepalive pings
      }
    };

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, refresh]);

  const checkpoint = useCallback(async () => {
    await captureCheckpoint(sessionId);
    await refresh();
  }, [sessionId, refresh]);

  const rewind = useCallback(async (snapshotId: string) => {
    setIsRewinding(true);
    try {
      await rewindToSnapshot(snapshotId);
      // Give code-server time to restart after rewind
      await new Promise((r) => setTimeout(r, 3000));
      await refresh();
    } finally {
      setIsRewinding(false);
    }
  }, [refresh]);

  const fork = useCallback(async (snapshotId: string, count = 1) => {
    const forks = await forkFromSnapshot(snapshotId, count);
    await refresh();
    return forks;
  }, [refresh]);

  return {
    session,
    timeline,
    events,
    loading,
    error,
    checkpoint,
    rewind,
    fork,
    refresh,
    isRewinding,
  };
}
