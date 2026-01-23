import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ unreadCount, onClick, className = '' }: NotificationBellProps) {
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-md hover:bg-muted transition-colors ${className}`}
      aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell className={`w-5 h-5 ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`} />

      {/* Unread Badge */}
      {hasUnread && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                     bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full px-1"
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}

      {/* Pulse animation for new notifications */}
      {hasUnread && (
        <span
          className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full animate-ping opacity-75"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default NotificationBell;
