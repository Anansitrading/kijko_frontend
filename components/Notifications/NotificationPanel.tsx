import React, { useEffect, useRef } from 'react';
import { X, CheckCheck, Settings, Inbox } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../../types/settings';

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: Notification[];
  groupedNotifications: GroupedNotifications;
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
  onSettingsClick?: () => void;
  formatTime: (date: Date) => string;
}

export function NotificationPanel({
  isOpen,
  notifications,
  groupedNotifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
  onSettingsClick,
  formatTime,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasNotifications = notifications.length > 0;

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="mb-2">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/30">
          {title}
        </div>
        <div className="divide-y divide-border/50">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onClick={onNotificationClick}
              formatTime={formatTime}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50
                 animate-in fade-in slide-in-from-top-2 duration-200"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasNotifications && unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {hasNotifications ? (
          <>
            {renderGroup('Today', groupedNotifications.today)}
            {renderGroup('Yesterday', groupedNotifications.yesterday)}
            {renderGroup('This Week', groupedNotifications.thisWeek)}
            {renderGroup('Older', groupedNotifications.older)}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-3 bg-secondary/50 rounded-full mb-3">
              <Inbox className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">You're all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {hasNotifications && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={onSettingsClick}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Manage notification preferences
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
