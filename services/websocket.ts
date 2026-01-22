// WebSocket Service for Real-time Updates
// Manages WebSocket connections and event subscriptions

import type { WebSocketEvent, WebSocketMessage } from '../types/contextInspector';

type EventCallback<T = unknown> = (data: T) => void;

interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

const DEFAULT_OPTIONS: ConnectionOptions = {
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private contextId: string | null = null;
  private listeners: Map<WebSocketEvent, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private options: ConnectionOptions = DEFAULT_OPTIONS;
  private mockIntervalId: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private isConnecting = false;

  // Status callbacks
  private onStatusChange: ((status: 'connected' | 'connecting' | 'disconnected') => void) | null = null;

  setStatusCallback(callback: (status: 'connected' | 'connecting' | 'disconnected') => void): void {
    this.onStatusChange = callback;
  }

  connect(contextId: string, options?: ConnectionOptions): Promise<void> {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.contextId = contextId;
    this.isConnecting = true;
    this.onStatusChange?.('connecting');

    return new Promise((resolve, reject) => {
      // In production, this would connect to a real WebSocket server:
      // const wsUrl = `wss://api.kijko.ai/ws?contextId=${contextId}`;
      // this.ws = new WebSocket(wsUrl);

      // Mock implementation for development
      this.simulateConnection(resolve, reject);
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }

    this.contextId = null;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.isConnecting = false;
    this.onStatusChange?.('disconnected');
  }

  subscribe<T = unknown>(event: WebSocketEvent, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    listeners.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as EventCallback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  private emit<T>(event: WebSocketEvent, data: T): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================
  // Mock Implementation for Development
  // ============================================

  private simulateConnection(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    // Simulate connection delay
    setTimeout(() => {
      // 90% chance of successful connection
      if (Math.random() > 0.1) {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onStatusChange?.('connected');
        this.startMockUpdates();
        resolve();
      } else {
        this.handleConnectionFailure(resolve, reject);
      }
    }, 500 + Math.random() * 500);
  }

  private handleConnectionFailure(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    this.reconnectAttempts++;

    if (
      this.options.autoReconnect &&
      this.reconnectAttempts < (this.options.maxReconnectAttempts ?? 5)
    ) {
      const delay = (this.options.reconnectDelay ?? 1000) * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.simulateConnection(resolve, reject);
      }, delay);
    } else {
      this.isConnecting = false;
      this.onStatusChange?.('disconnected');
      reject(new Error('Failed to connect to WebSocket server'));
    }
  }

  private startMockUpdates(): void {
    // Simulate periodic real-time updates
    this.mockIntervalId = setInterval(() => {
      if (!this.isConnected) return;

      const random = Math.random();

      // 20% chance of activity update
      if (random < 0.2) {
        this.emit('activity:new', {
          id: `activity-${Date.now()}`,
          type: ['view', 'chat', 'ingestion'][Math.floor(Math.random() * 3)],
          user: {
            id: 'u1',
            name: 'Sarah Chen',
            email: 'sarah@kijko.ai',
          },
          description: 'Viewed a file',
          timestamp: new Date().toISOString(),
        });
      }

      // 10% chance of user status update
      if (random > 0.9) {
        this.emit('user:status', {
          userId: `u${Math.floor(Math.random() * 4) + 1}`,
          status: Math.random() > 0.5 ? 'online' : 'offline',
          lastActive: new Date().toISOString(),
        });
      }

      // 5% chance of enrichment progress
      if (random > 0.95) {
        this.emit('enrichment:progress', {
          type: ['knowledgeGraph', 'languageServer', 'chromaCode'][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 100),
          status: 'processing',
        });
      }
    }, 8000); // Every 8 seconds
  }

  // ============================================
  // Status Getters
  // ============================================

  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }

  get currentContextId(): string | null {
    return this.contextId;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
