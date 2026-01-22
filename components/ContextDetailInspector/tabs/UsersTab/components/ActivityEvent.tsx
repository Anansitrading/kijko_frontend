import { Eye, MessageSquare, Database, Shield, Settings, Clock } from 'lucide-react';
import { cn } from '../../../../../utils/cn';
import type { ActivityEvent as ActivityEventType, ActivityEventType as EventType } from '../../../../../types/contextInspector';

const EVENT_CONFIG: Record<EventType, { icon: typeof Eye; color: string; bgColor: string; label: string }> = {
  view: {
    icon: Eye,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'View',
  },
  chat: {
    icon: MessageSquare,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    label: 'Chat',
  },
  ingestion: {
    icon: Database,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Ingestion',
  },
  permission: {
    icon: Shield,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    label: 'Permission',
  },
  config: {
    icon: Settings,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    label: 'Config',
  },
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

interface ActivityEventProps {
  event: ActivityEventType;
}

export function ActivityEventComponent({ event }: ActivityEventProps) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
      <div className={cn('p-2 rounded-lg shrink-0', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          <span className="font-medium">{event.user.name}</span>
          {' '}
          <span className="text-gray-400">{event.description}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
