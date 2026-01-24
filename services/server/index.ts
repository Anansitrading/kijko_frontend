/**
 * Server-Side Services Index
 * Export all server-side services for backend integration
 *
 * Sprint PC5c: WebSocket Infrastructure
 *
 * NOTE: These services are meant to run on a Node.js backend.
 * They require socket.io or similar WebSocket server library.
 */

export { IngestionEventEmitter, ingestionEventEmitter } from './ingestionEventEmitter';
export type { IngestionEventEmitterOptions } from './ingestionEventEmitter';

export { WebSocketAuthService, websocketAuth } from './websocketAuth';
export type { WebSocketAuthConfig } from './websocketAuth';
