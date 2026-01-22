// Realtime Context Provider
// Manages WebSocket connection and real-time update state

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { websocketService } from '../services/websocket';
import type { WebSocketEvent, RealtimeState } from '../types/contextInspector';

// ============================================
// Context Types
// ============================================

interface RealtimeContextValue extends RealtimeState {
  connect: (contextId: string) => Promise<void>;
  disconnect: () => void;
  clearPendingUpdates: (type?: keyof RealtimeState['pendingUpdates']) => void;
  subscribe: <T>(event: WebSocketEvent, callback: (data: T) => void) => () => void;
}

// ============================================
// Context Creation
// ============================================

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    connecting: false,
    lastUpdate: null,
    pendingUpdates: {
      activity: 0,
      users: 0,
      changelog: 0,
    },
    error: null,
  });

  // Set up status change callback
  useEffect(() => {
    websocketService.setStatusCallback((status) => {
      setState(prev => ({
        ...prev,
        connected: status === 'connected',
        connecting: status === 'connecting',
        error: status === 'disconnected' && prev.connecting ? 'Connection failed' : null,
      }));
    });

    return () => {
      websocketService.setStatusCallback(() => {});
    };
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async (contextId: string) => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      await websocketService.connect(contextId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
      throw error;
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      pendingUpdates: { activity: 0, users: 0, changelog: 0 },
    }));
  }, []);

  // Clear pending updates
  const clearPendingUpdates = useCallback((type?: keyof RealtimeState['pendingUpdates']) => {
    setState(prev => {
      if (type) {
        return {
          ...prev,
          pendingUpdates: { ...prev.pendingUpdates, [type]: 0 },
        };
      }
      return {
        ...prev,
        pendingUpdates: { activity: 0, users: 0, changelog: 0 },
      };
    });
  }, []);

  // Subscribe to WebSocket events
  const subscribe = useCallback(<T,>(event: WebSocketEvent, callback: (data: T) => void) => {
    return websocketService.subscribe(event, callback);
  }, []);

  // Set up default listeners for pending update counts
  useEffect(() => {
    if (!state.connected) return;

    const unsubActivity = websocketService.subscribe('activity:new', () => {
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        pendingUpdates: {
          ...prev.pendingUpdates,
          activity: prev.pendingUpdates.activity + 1,
        },
      }));
    });

    const unsubUserStatus = websocketService.subscribe('user:status', () => {
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        pendingUpdates: {
          ...prev.pendingUpdates,
          users: prev.pendingUpdates.users + 1,
        },
      }));
    });

    const unsubIngestion = websocketService.subscribe('ingestion:complete', () => {
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        pendingUpdates: {
          ...prev.pendingUpdates,
          changelog: prev.pendingUpdates.changelog + 1,
        },
      }));
    });

    return () => {
      unsubActivity();
      unsubUserStatus();
      unsubIngestion();
    };
  }, [state.connected]);

  // Memoize context value
  const value = useMemo<RealtimeContextValue>(
    () => ({
      ...state,
      connect,
      disconnect,
      clearPendingUpdates,
      subscribe,
    }),
    [state, connect, disconnect, clearPendingUpdates, subscribe]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }

  return context;
}

export default RealtimeContext;
