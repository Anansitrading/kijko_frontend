/**
 * WebSocket Authentication Service (Server-Side)
 * Handles authentication and authorization for WebSocket connections
 *
 * Sprint PC5c: WebSocket Infrastructure - Feature 6
 *
 * Features:
 * - Token validation in WebSocket handshake
 * - Project access verification
 * - Unauthorized access logging
 * - Token refresh for long-running ingestions
 */

// =============================================================================
// Types
// =============================================================================

/** Socket handshake interface (compatible with socket.io) */
interface SocketHandshake {
  auth: {
    token?: string;
  };
  query: {
    projectId?: string;
  };
  headers: Record<string, string>;
  address: string;
}

/** Socket interface for middleware */
interface Socket {
  id: string;
  handshake: SocketHandshake;
  data: {
    userId?: string;
    projectId?: string;
    tokenExpiry?: Date;
  };
  disconnect(close?: boolean): void;
}

/** Next function for middleware chain */
type NextFunction = (err?: Error) => void;

/** Token payload after decoding */
interface TokenPayload {
  userId: string;
  email?: string;
  organizationId?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/** Project access check result */
interface ProjectAccessResult {
  hasAccess: boolean;
  role?: 'admin' | 'manager' | 'developer' | 'viewer' | 'auditor';
  error?: string;
}

/** Auth error with code */
interface AuthError extends Error {
  code: string;
}

/** Unauthorized access log entry */
interface UnauthorizedAccessLog {
  timestamp: Date;
  socketId: string;
  projectId?: string;
  token?: string; // Truncated for security
  reason: string;
  ipAddress: string;
}

// =============================================================================
// Configuration
// =============================================================================

export interface WebSocketAuthConfig {
  /** JWT secret for token validation (in production, use env var) */
  jwtSecret?: string;
  /** Token refresh threshold in milliseconds (default: 5 minutes before expiry) */
  tokenRefreshThreshold?: number;
  /** Enable unauthorized access logging (default: true) */
  enableAccessLogging?: boolean;
  /** Mock mode for development (default: true) */
  mockMode?: boolean;
}

const DEFAULT_CONFIG: Required<WebSocketAuthConfig> = {
  jwtSecret: process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || '',
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
  enableAccessLogging: true,
  mockMode: process.env.NODE_ENV !== 'production',
};

// =============================================================================
// WebSocket Auth Service
// =============================================================================

export class WebSocketAuthService {
  private config: Required<WebSocketAuthConfig>;
  private accessLogs: UnauthorizedAccessLog[] = [];
  private readonly MAX_LOGS = 1000;

  constructor(config: WebSocketAuthConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // =============================================================================
  // Middleware
  // =============================================================================

  /**
   * Socket.io authentication middleware
   * Use with io.use(authService.middleware)
   */
  middleware = async (socket: Socket, next: NextFunction): Promise<void> => {
    const { auth, query, address } = socket.handshake;
    const token = auth.token;
    const projectId = query.projectId;

    try {
      // Validate token presence
      if (!token) {
        throw this.createAuthError('NO_TOKEN', 'Authentication token is required');
      }

      // Validate project ID
      if (!projectId) {
        throw this.createAuthError('NO_PROJECT_ID', 'Project ID is required');
      }

      // Validate and decode token
      const payload = await this.validateToken(token);
      if (!payload) {
        throw this.createAuthError('INVALID_TOKEN', 'Invalid or expired token');
      }

      // Check project access
      const access = await this.checkProjectAccess(payload.userId, projectId);
      if (!access.hasAccess) {
        this.logUnauthorizedAccess({
          timestamp: new Date(),
          socketId: socket.id,
          projectId,
          token: this.truncateToken(token),
          reason: access.error || 'Access denied',
          ipAddress: address,
        });
        throw this.createAuthError('ACCESS_DENIED', access.error || 'Access denied to project');
      }

      // Store user info on socket for later use
      socket.data.userId = payload.userId;
      socket.data.projectId = projectId;
      socket.data.tokenExpiry = new Date(payload.exp * 1000);

      next();
    } catch (error) {
      const authError = error as AuthError;

      this.logUnauthorizedAccess({
        timestamp: new Date(),
        socketId: socket.id,
        projectId,
        token: token ? this.truncateToken(token) : undefined,
        reason: authError.message,
        ipAddress: address,
      });

      next(new Error(authError.message));
    }
  };

  // =============================================================================
  // Token Validation
  // =============================================================================

  /**
   * Validate a JWT token
   */
  async validateToken(token: string): Promise<TokenPayload | null> {
    if (this.config.mockMode) {
      return this.mockValidateToken(token);
    }

    // In production, use proper JWT validation
    // Example with jsonwebtoken:
    // try {
    //   const decoded = jwt.verify(token, this.config.jwtSecret) as TokenPayload;
    //   return decoded;
    // } catch {
    //   return null;
    // }

    return null;
  }

  /**
   * Mock token validation for development
   */
  private mockValidateToken(token: string): TokenPayload {
    // Accept any token in mock mode and return mock payload
    const now = Math.floor(Date.now() / 1000);
    return {
      userId: 'mock-user-001',
      email: 'user@example.com',
      organizationId: 'mock-org-001',
      exp: now + 3600, // 1 hour from now
      iat: now,
    };
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(socket: Socket): boolean {
    if (!socket.data.tokenExpiry) return false;

    const now = Date.now();
    const expiryTime = socket.data.tokenExpiry.getTime();
    return expiryTime - now < this.config.tokenRefreshThreshold;
  }

  /**
   * Request token refresh from client
   */
  requestTokenRefresh(socket: Socket): void {
    // Emit event to client to refresh token
    (socket as Socket & { emit: (event: string, data: unknown) => void }).emit?.('token_refresh_required', {
      reason: 'Token expiring soon',
      expiresAt: socket.data.tokenExpiry,
    });
  }

  // =============================================================================
  // Project Access
  // =============================================================================

  /**
   * Check if user has access to project
   */
  async checkProjectAccess(userId: string, projectId: string): Promise<ProjectAccessResult> {
    if (this.config.mockMode) {
      // In mock mode, always allow access
      return {
        hasAccess: true,
        role: 'developer',
      };
    }

    // In production, check database for project membership
    // Example:
    // const member = await db.projectMembers.findOne({ projectId, userId });
    // if (!member) {
    //   return { hasAccess: false, error: 'User is not a member of this project' };
    // }
    // return { hasAccess: true, role: member.role };

    return { hasAccess: false, error: 'Production access check not implemented' };
  }

  // =============================================================================
  // Access Logging
  // =============================================================================

  /**
   * Log unauthorized access attempt
   */
  private logUnauthorizedAccess(log: UnauthorizedAccessLog): void {
    if (!this.config.enableAccessLogging) return;

    console.warn('[WebSocketAuth] Unauthorized access attempt:', {
      timestamp: log.timestamp.toISOString(),
      socketId: log.socketId,
      projectId: log.projectId,
      reason: log.reason,
      ipAddress: log.ipAddress,
    });

    this.accessLogs.push(log);

    // Trim logs if exceeding max
    if (this.accessLogs.length > this.MAX_LOGS) {
      this.accessLogs = this.accessLogs.slice(-this.MAX_LOGS);
    }
  }

  /**
   * Get recent unauthorized access logs
   */
  getUnauthorizedAccessLogs(limit: number = 100): UnauthorizedAccessLog[] {
    return this.accessLogs.slice(-limit);
  }

  /**
   * Clear access logs
   */
  clearAccessLogs(): void {
    this.accessLogs = [];
  }

  // =============================================================================
  // Utilities
  // =============================================================================

  /**
   * Create an authentication error
   */
  private createAuthError(code: string, message: string): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    return error;
  }

  /**
   * Truncate token for logging (security measure)
   */
  private truncateToken(token: string): string {
    if (token.length <= 20) return '***';
    return `${token.slice(0, 10)}...${token.slice(-5)}`;
  }

  /**
   * Generate a connection token (for client-side use)
   */
  generateConnectionToken(userId: string, projectId: string): string {
    if (this.config.mockMode) {
      // In mock mode, return a simple token
      return `mock-token-${userId}-${projectId}-${Date.now()}`;
    }

    // In production, generate a proper JWT
    // return jwt.sign({ userId, projectId }, this.config.jwtSecret, { expiresIn: '1h' });
    return '';
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const websocketAuth = new WebSocketAuthService();

export default websocketAuth;
