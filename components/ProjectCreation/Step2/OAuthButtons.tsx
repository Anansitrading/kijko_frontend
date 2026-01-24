import React, { useState, useCallback } from 'react';
import { Check, Loader2, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { GitProvider, OAuthConnection } from '../../../types/project';
import {
  getOAuthConnections,
  completeOAuth,
  disconnectOAuth,
} from '../../../services/projectApi';

// =============================================================================
// Types
// =============================================================================

interface OAuthButtonsProps {
  connections: OAuthConnection[];
  onConnectionChange: (connections: OAuthConnection[]) => void;
  providers?: GitProvider[];
  className?: string;
}

interface SingleOAuthButtonProps {
  provider: GitProvider;
  connection?: OAuthConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function getProviderInfo(provider: GitProvider): {
  name: string;
  icon: React.ReactNode;
  color: string;
} {
  switch (provider) {
    case 'github':
      return {
        name: 'GitHub',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        ),
        color: 'bg-[#24292f] hover:bg-[#1b1f23]',
      };
    case 'gitlab':
      return {
        name: 'GitLab',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.546 10.93L13.067.452a1.55 1.55 0 00-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 012.327 2.341l2.658 2.66a1.838 1.838 0 11-1.103 1.033l-2.48-2.48v6.53a1.838 1.838 0 11-1.512-.037V8.73a1.838 1.838 0 01-.998-2.413L7.636 3.593.454 10.776a1.549 1.549 0 000 2.188l10.48 10.48a1.55 1.55 0 002.186 0l10.426-10.326a1.55 1.55 0 000-2.188z"/>
          </svg>
        ),
        color: 'bg-[#fc6d26] hover:bg-[#e65a1e]',
      };
    case 'bitbucket':
      return {
        name: 'Bitbucket',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.899zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
          </svg>
        ),
        color: 'bg-[#0052cc] hover:bg-[#0047b3]',
      };
    case 'azure':
      return {
        name: 'Azure DevOps',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 8.877L2.247 5.91l8.405-3.416V.022l7.37 5.393L2.966 8.338v8.225L0 15.707zm24-4.45v14.651l-5.753 4.9-9.303-3.057v3.056l-5.978-7.416 15.057 1.798V5.415z"/>
          </svg>
        ),
        color: 'bg-[#0078d4] hover:bg-[#006cc1]',
      };
  }
}

// =============================================================================
// Single OAuth Button
// =============================================================================

function SingleOAuthButton({
  provider,
  connection,
  onConnect,
  onDisconnect,
  isConnecting,
}: SingleOAuthButtonProps) {
  const info = getProviderInfo(provider);
  const isConnected = connection?.connected;

  if (isConnected && connection) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg text-white', info.color)}>
            {info.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{info.name}</p>
            <p className="text-xs text-muted-foreground">
              Connected as {connection.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <button
            type="button"
            onClick={onDisconnect}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={isConnecting}
      className={cn(
        'flex items-center justify-center gap-3 w-full p-3 rounded-lg text-white transition-all',
        info.color,
        isConnecting && 'opacity-70 cursor-not-allowed'
      )}
    >
      {isConnecting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        info.icon
      )}
      <span className="font-medium">
        {isConnecting ? 'Connecting...' : `Connect with ${info.name}`}
      </span>
      {!isConnecting && <ExternalLink className="w-4 h-4 opacity-70" />}
    </button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function OAuthButtons({
  connections,
  onConnectionChange,
  providers = ['github', 'gitlab'],
  className,
}: OAuthButtonsProps) {
  const [connectingProvider, setConnectingProvider] = useState<GitProvider | null>(null);

  const handleConnect = useCallback(async (provider: GitProvider) => {
    setConnectingProvider(provider);

    try {
      // In a real app, this would open a popup or redirect
      // For demo, we simulate the OAuth flow completion
      const connection = await completeOAuth(provider, 'mock-code');

      const newConnections = connections.filter(c => c.provider !== provider);
      newConnections.push(connection);
      onConnectionChange(newConnections);
    } catch (error) {
      console.error('OAuth connection failed:', error);
    } finally {
      setConnectingProvider(null);
    }
  }, [connections, onConnectionChange]);

  const handleDisconnect = useCallback(async (provider: GitProvider) => {
    try {
      await disconnectOAuth(provider);
      const newConnections = connections.filter(c => c.provider !== provider);
      onConnectionChange(newConnections);
    } catch (error) {
      console.error('OAuth disconnect failed:', error);
    }
  }, [connections, onConnectionChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {providers.map((provider) => (
        <SingleOAuthButton
          key={provider}
          provider={provider}
          connection={connections.find(c => c.provider === provider)}
          onConnect={() => handleConnect(provider)}
          onDisconnect={() => handleDisconnect(provider)}
          isConnecting={connectingProvider === provider}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Compact OAuth Button (for inline use)
// =============================================================================

interface CompactOAuthButtonProps {
  provider: GitProvider;
  connection?: OAuthConnection;
  onConnect: () => void;
}

export function CompactOAuthButton({
  provider,
  connection,
  onConnect,
}: CompactOAuthButtonProps) {
  const info = getProviderInfo(provider);
  const isConnected = connection?.connected;

  if (isConnected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-green-600 bg-green-50 rounded">
        <Check className="w-3 h-3" />
        {info.name} connected
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 rounded transition-colors"
    >
      {info.icon}
      Connect {info.name}
    </button>
  );
}
