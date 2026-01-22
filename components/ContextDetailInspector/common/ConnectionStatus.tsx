// Connection Status Component
// Shows live/connecting/offline status indicator

import { cn } from '../../../utils/cn';

interface ConnectionStatusProps {
  connected: boolean;
  connecting?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatus({
  connected,
  connecting = false,
  className,
  showLabel = true,
}: ConnectionStatusProps) {
  const status = connected ? 'connected' : connecting ? 'connecting' : 'disconnected';

  const statusConfig = {
    connected: {
      color: 'bg-emerald-500',
      label: 'Live',
      title: 'Connected - Receiving real-time updates',
    },
    connecting: {
      color: 'bg-amber-500 animate-pulse',
      label: 'Connecting',
      title: 'Connecting to server...',
    },
    disconnected: {
      color: 'bg-red-500',
      label: 'Offline',
      title: 'Disconnected - Updates paused',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      title={config.title}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          config.color
        )}
      />
      {showLabel && (
        <span className="text-xs text-gray-500">
          {config.label}
        </span>
      )}
    </div>
  );
}

export default ConnectionStatus;
