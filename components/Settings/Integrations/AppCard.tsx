// Integration App Card Component
// Setting Sprint 6: Integrations

import React from 'react';
import {
  Link2,
  Unlink,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Github,
  Slack,
  Cloud,
} from 'lucide-react';
import type { AppCardProps, IntegrationProvider } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';
import { tw } from '../../../styles/settings';

// Icon mapping for integrations
const getIntegrationIcon = (iconName: string): React.ReactNode => {
  const iconClass = 'w-8 h-8';

  switch (iconName) {
    case 'github':
      return <Github className={iconClass} />;
    case 'slack':
      return <Slack className={iconClass} />;
    // For other integrations, use a generic cloud icon or first letter
    default:
      return <Cloud className={iconClass} />;
  }
};

export function AppCard({
  app,
  isConnected,
  connectionStatus,
  onConnect,
  onDisconnect,
  onManagePermissions,
}: AppCardProps) {
  const isConnecting = connectionStatus === 'connecting';
  const hasError = connectionStatus === 'error';

  return (
    <div className={`${tw.card} flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* App Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {getIntegrationIcon(app.icon)}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">{app.name}</h4>
            {app.isPopular && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                Popular
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {INTEGRATION_CATEGORIES[app.category]}
          </span>
        </div>

        {/* Connection Status Indicator */}
        {isConnected && (
          <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
        )}
        {hasError && (
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {app.description}
      </p>

      {/* Permissions Preview */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
        <div className="flex flex-wrap gap-1">
          {app.permissions.slice(0, 3).map((permission) => (
            <span
              key={permission}
              className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
            >
              {permission.replace(/_/g, ' ')}
            </span>
          ))}
          {app.permissions.length > 3 && (
            <span className="text-xs px-1.5 py-0.5 text-muted-foreground">
              +{app.permissions.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {isConnected ? (
          <>
            <button
              onClick={() => onManagePermissions(app.id)}
              className={`${tw.buttonSecondary} flex-1 flex items-center justify-center gap-2 text-sm`}
            >
              <Settings2 className="w-4 h-4" />
              Manage
            </button>
            <button
              onClick={() => onDisconnect(app.id)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Disconnect"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onConnect(app.id)}
            disabled={isConnecting}
            className={`${tw.buttonPrimary} flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50`}
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

export default AppCard;
