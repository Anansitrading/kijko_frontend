// Unified Integration Card Component
// Handles both pre-built and custom integrations with status indicators

import { useState } from 'react';
import {
  Link2,
  Unlink,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Github,
  Slack,
  Cloud,
  MoreVertical,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { IntegrationCardProps, IntegrationCategory } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';

// Simple relative time formatter
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Icon mapping for integrations
const getIntegrationIcon = (iconName: string): React.ReactNode => {
  const iconClass = 'w-8 h-8';

  switch (iconName) {
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

// Status badge component
function StatusBadge({ status }: { status: 'connected' | 'warning' | 'disconnected' }) {
  const config = {
    connected: {
      icon: CheckCircle2,
      label: 'Connected',
      className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
    warning: {
      icon: AlertTriangle,
      label: 'Warning',
      className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    disconnected: {
      icon: AlertCircle,
      label: 'Disconnected',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        className
      )}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onManage,
  onViewLogs,
  onReconnect,
}: IntegrationCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleConnect = async () => {
    if (!onConnect) return;
    setIsConnecting(true);
    try {
      await onConnect(integration.id);
    } finally {
      setIsConnecting(false);
    }
  };

  const getCategoryLabel = (category: IntegrationCategory | 'custom') => {
    if (category === 'custom') return 'Custom';
    return INTEGRATION_CATEGORIES[category] || category;
  };

  return (
    <div
      className={cn(
        'bg-secondary border border-border rounded-lg p-4 flex flex-col h-full transition-all duration-200',
        'hover:border-border/80 hover:shadow-lg hover:shadow-primary/5'
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

        {/* Status or Menu */}
        {integration.isConnected && integration.connectionStatus ? (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                  {onReconnect && (
                    <button
                      onClick={() => {
                        onReconnect(integration.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Reconnect
                    </button>
                  )}
                  {onManage && (
                    <button
                      onClick={() => {
                        onManage(integration.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2"
                    >
                      <Settings2 size={14} />
                      Configure
                    </button>
                  )}
                  {onViewLogs && (
                    <button
                      onClick={() => {
                        onViewLogs(integration.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2"
                    >
                      <FileText size={14} />
                      View Logs
                    </button>
                  )}
                  {onDisconnect && (
                    <>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => {
                          onDisconnect(integration.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Unlink size={14} />
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : integration.isConnected ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : null}
      </div>

      {/* Connection Status Badge (for connected integrations) */}
      {integration.isConnected && integration.connectionStatus && (
        <div className="mb-3">
          <StatusBadge status={integration.connectionStatus} />
          {integration.lastSynced && (
            <p className="text-xs text-muted-foreground mt-1">
              Last synced: {formatTimeAgo(integration.lastSynced)}
            </p>
          )}
        </div>
      )}

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

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {integration.isConnected ? (
          <button
            onClick={() => onManage?.(integration.id)}
            className="flex-1 flex items-center justify-center gap-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground font-medium rounded-md h-9 px-4 border border-border transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Manage
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 flex items-center justify-center gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md h-9 px-4 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect
              </>
            )}
          </button>
        )}
      </div>
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
