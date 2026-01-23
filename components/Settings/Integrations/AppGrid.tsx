// Integration App Grid Component
// Setting Sprint 6: Integrations

import React, { useState } from 'react';
import { AppCard } from './AppCard';
import type {
  AppGridProps,
  IntegrationProvider,
  IntegrationConnectionStatus,
} from '../../../types/settings';

export function AppGrid({
  apps,
  connectedApps,
  onConnect,
  onDisconnect,
  onManagePermissions,
}: AppGridProps) {
  // Track connection status for each app during OAuth flow
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<IntegrationProvider, IntegrationConnectionStatus>
  >({} as Record<IntegrationProvider, IntegrationConnectionStatus>);

  // Check if an app is connected
  const isAppConnected = (appId: IntegrationProvider): boolean => {
    return connectedApps.some(
      (connected) => connected.provider === appId && connected.status === 'active'
    );
  };

  // Get connection status for an app
  const getConnectionStatus = (appId: IntegrationProvider): IntegrationConnectionStatus => {
    if (connectionStatuses[appId]) {
      return connectionStatuses[appId];
    }
    const connected = connectedApps.find((c) => c.provider === appId);
    if (connected) {
      return connected.status === 'error' ? 'error' : 'connected';
    }
    return 'disconnected';
  };

  // Handle connect with status tracking
  const handleConnect = async (appId: IntegrationProvider) => {
    setConnectionStatuses((prev) => ({ ...prev, [appId]: 'connecting' }));
    try {
      await onConnect(appId);
      setConnectionStatuses((prev) => ({ ...prev, [appId]: 'connected' }));
    } catch {
      setConnectionStatuses((prev) => ({ ...prev, [appId]: 'error' }));
    }
  };

  // Handle disconnect
  const handleDisconnect = async (appId: IntegrationProvider) => {
    await onDisconnect(appId);
    setConnectionStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[appId];
      return newStatuses;
    });
  };

  if (apps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No integrations found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          isConnected={isAppConnected(app.id)}
          connectionStatus={getConnectionStatus(app.id)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onManagePermissions={onManagePermissions}
        />
      ))}
    </div>
  );
}

export default AppGrid;
