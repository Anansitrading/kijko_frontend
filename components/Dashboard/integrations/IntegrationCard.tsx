// Unified Integration Card Component
// Handles both pre-built and custom integrations with status indicators
// Card is clickable to manage; top-right badge shows status and action

import { useState } from 'react';
import {
  Link2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Github,
  Slack,
  Cloud,
  Zap,
  HardDrive,
  Network,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { IntegrationCardProps, IntegrationCategory } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';

// Icon mapping for integrations
const getIntegrationIcon = (iconName: string): React.ReactNode => {
  const iconClass = 'w-8 h-8';

  switch (iconName) {
    case 'kijko-file-storage':
      return <HardDrive className={iconClass} />;
    case 'kijko-knowledge-graph':
      return <Network className={iconClass} />;
    case 'github':
      return <Github className={iconClass} />;
    case 'slack':
      return <Slack className={iconClass} />;
    case 'zap':
    case 'custom':
      return <Zap className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
};

// Unified action badge component
function ActionBadge({
  integration,
  isConnecting,
  onConnect,
  onReconnect,
}: {
  integration: IntegrationCardProps['integration'];
  isConnecting: boolean;
  onConnect: () => void;
  onReconnect?: (id: string) => void;
}) {
  // Not connected → Blue "Connect" (clickable)
  if (!integration.isConnected) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onConnect();
        }}
        disabled={isConnecting}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
      >
        {isConnecting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Link2 size={12} />
        )}
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    );
  }

  // Connected with warning → Orange "Reconnect" (clickable)
  if (integration.connectionStatus === 'warning' || integration.connectionStatus === 'disconnected') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReconnect?.(integration.id);
        }}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
      >
        <RefreshCw size={12} />
        Reconnect
      </button>
    );
  }

  // Default → Orange "Default" (view only)
  if (integration.connectionStatus === 'default') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border bg-orange-500/10 text-orange-500 border-orange-500/20 shrink-0">
        <CheckCircle2 size={12} />
        Default
      </span>
    );
  }

  // Connected → Green "Connected" (view only)
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
      <CheckCircle2 size={12} />
      Connected
    </span>
  );
}

export function IntegrationCard({
  integration,
  viewMode = 'grid',
  onConnect,
  onManage,
  onReconnect,
  onCardClick,
}: IntegrationCardProps & { onCardClick?: (id: string) => void }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!onConnect) return;
    setIsConnecting(true);
    try {
      await onConnect(integration.id);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(integration.id);
    } else if (integration.isConnected && onManage) {
      onManage(integration.id);
    }
  };

  const getCategoryLabel = (category: IntegrationCategory | 'custom') => {
    if (category === 'custom') return 'Custom';
    return INTEGRATION_CATEGORIES[category] || category;
  };

  // List View Layout
  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'bg-card/50 border rounded-xl p-4 flex items-center gap-4 transition-all duration-200',
          integration.connectionStatus === 'default'
            ? 'border-orange-500 hover:bg-card hover:border-orange-400'
            : 'border-border hover:bg-card hover:border-primary/30',
          (onCardClick || (integration.isConnected && onManage)) && 'cursor-pointer'
        )}
      >
        {/* App Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
            integration.isCustom
              ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {integration.iconUrl ? (
            <img
              src={integration.iconUrl}
              alt={integration.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            getIntegrationIcon(integration.icon)
          )}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
            {integration.isPopular && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                Popular
              </span>
            )}
            {integration.isCustom && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded">
                Custom
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
        </div>

        {/* Category */}
        <div className="hidden md:block flex-shrink-0 w-28">
          <span className="text-xs text-muted-foreground">
            {getCategoryLabel(integration.category)}
          </span>
        </div>

        {/* Action Badge */}
        <div className="flex-shrink-0">
          <ActionBadge
            integration={integration}
            isConnecting={isConnecting}
            onConnect={handleConnect}
            onReconnect={onReconnect}
          />
        </div>
      </div>
    );
  }

  // Grid View Layout (default)
  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'bg-card/50 border rounded-xl p-4 flex flex-col h-full transition-all duration-200',
        integration.connectionStatus === 'default'
          ? 'border-orange-500 hover:bg-card hover:border-orange-400'
          : 'border-border hover:bg-card hover:border-primary/30',
        (onCardClick || (integration.isConnected && onManage)) && 'cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* App Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
            integration.isCustom
              ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {integration.iconUrl ? (
            <img
              src={integration.iconUrl}
              alt={integration.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            getIntegrationIcon(integration.icon)
          )}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-foreground truncate">{integration.name}</h4>
            {integration.isPopular && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                Popular
              </span>
            )}
            {integration.isCustom && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded">
                Custom
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {getCategoryLabel(integration.category)}
          </span>
        </div>

        {/* Top-right: Unified Action Badge */}
        <ActionBadge
          integration={integration}
          isConnecting={isConnecting}
          onConnect={handleConnect}
          onReconnect={onReconnect}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
        {integration.description}
      </p>

      {/* Permissions Preview (only for non-connected) */}
      {!integration.isConnected && integration.permissions && integration.permissions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
          <div className="flex flex-wrap gap-1">
            {integration.permissions.slice(0, 3).map((permission) => (
              <span
                key={permission}
                className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
              >
                {permission.replace(/_/g, ' ')}
              </span>
            ))}
            {integration.permissions.length > 3 && (
              <span className="text-xs px-1.5 py-0.5 text-muted-foreground">
                +{integration.permissions.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Special "Create Custom" Card
export function CreateCustomCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-transparent border-2 border-dashed border-border/60 rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[220px]',
        'hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group'
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground mb-1">+ Custom Connector</span>
      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded mb-2">Beta</span>
      <span className="text-xs text-muted-foreground text-center">
        Add your own MCP server integration
      </span>
    </button>
  );
}

export default IntegrationCard;
