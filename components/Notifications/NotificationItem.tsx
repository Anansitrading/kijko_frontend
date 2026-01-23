import React from 'react';
import {
  UserPlus,
  CheckCircle,
  Bell,
  FileText,
  Users,
  ShieldAlert,
  X,
  Check,
} from 'lucide-react';
import type { Notification, NotificationType } from '../../types/settings';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  formatTime: (date: Date) => string;
}

// Icon mapping for notification types
const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    new_lead: <UserPlus className="w-4 h-4 text-green-400" />,
    task_completion: <CheckCircle className="w-4 h-4 text-blue-400" />,
    system_update: <Bell className="w-4 h-4 text-amber-400" />,
    context_update: <FileText className="w-4 h-4 text-purple-400" />,
    team_activity: <Users className="w-4 h-4 text-cyan-400" />,
    security_alert: <ShieldAlert className="w-4 h-4 text-red-400" />,
  };
  return iconMap[type] || <Bell className="w-4 h-4 text-muted-foreground" />;
};

// Background color for notification types
const getNotificationBgColor = (type: NotificationType, isRead: boolean) => {
  if (isRead) return 'bg-transparent';

  const colorMap: Record<NotificationType, string> = {
    new_lead: 'bg-green-500/5',
    task_completion: 'bg-blue-500/5',
    system_update: 'bg-amber-500/5',
    context_update: 'bg-purple-500/5',
    team_activity: 'bg-cyan-500/5',
    security_alert: 'bg-red-500/5',
  };
  return colorMap[type] || 'bg-primary/5';
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  formatTime,
}: NotificationItemProps) {
  const { id, type, title, message, isRead, isUrgent, createdAt, link } = notification;

  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
    onClick(notification);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div
      className={`group relative flex items-start gap-3 p-3 cursor-pointer transition-colors
                  hover:bg-muted/50 ${getNotificationBgColor(type, isRead)}
                  ${!isRead ? 'border-l-2 border-primary' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5 p-1.5 rounded-full bg-secondary/50">
        {getNotificationIcon(type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm ${isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
            {title}
          </p>
          {isUrgent && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">
              Urgent
            </span>
          )}
        </div>

        {message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
        )}

        <p className="text-xs text-muted-foreground/70 mt-1">{formatTime(createdAt)}</p>
      </div>

      {/* Actions (visible on hover) */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isRead && (
          <button
            onClick={handleMarkAsRead}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
          title="Delete notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute right-3 bottom-3 w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
      )}
    </div>
  );
}

export default NotificationItem;
