import { useCallback, useMemo } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import type {
  Notification,
  NotificationType,
  EmailNotificationPreferences,
  InAppNotificationPreferences,
  NotificationFrequencySettings,
  QuietHoursConfig,
} from '../types/settings';

// Grouped notifications by date
interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

export function useNotifications() {
  const {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateEmailPreferences,
    updateInAppPreferences,
    updateFrequencySettings,
    updateQuietHours,
    togglePanel,
  } = useNotificationContext();

  // Group notifications by date
  const groupedNotifications = useMemo((): GroupedNotifications => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    state.notifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notifDay >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [state.notifications]);

  // Check if within quiet hours
  const isWithinQuietHours = useCallback((): boolean => {
    if (!state.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    // Parse start and end times
    const [startHour, startMin] = state.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = state.preferences.quietHours.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Check days
    const { days, customDays } = state.preferences.quietHours;
    let isDayActive = false;

    switch (days) {
      case 'all':
        isDayActive = true;
        break;
      case 'weekdays':
        isDayActive = currentDay >= 1 && currentDay <= 5;
        break;
      case 'weekends':
        isDayActive = currentDay === 0 || currentDay === 6;
        break;
      case 'custom':
        isDayActive = customDays?.includes(currentDay) ?? false;
        break;
    }

    if (!isDayActive) return false;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }, [state.preferences.quietHours]);

  // Check if notification should be shown (based on preferences and quiet hours)
  const shouldShowNotification = useCallback(
    (type: NotificationType, isUrgent: boolean = false): boolean => {
      // Urgent notifications always bypass quiet hours
      if (!isUrgent && isWithinQuietHours()) {
        return false;
      }

      // Check in-app preferences
      const prefMap: Record<NotificationType, keyof InAppNotificationPreferences> = {
        new_lead: 'newLeads',
        task_completion: 'taskCompletions',
        system_update: 'systemUpdates',
        context_update: 'contextUpdates',
        team_activity: 'teamActivity',
        security_alert: 'systemUpdates', // Security alerts use system updates preference
      };

      const prefKey = prefMap[type];
      return state.preferences.inApp[prefKey] ?? true;
    },
    [state.preferences.inApp, isWithinQuietHours]
  );

  // Create and add a new notification
  const createNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      options?: {
        message?: string;
        data?: Record<string, unknown>;
        link?: string;
        isUrgent?: boolean;
      }
    ) => {
      if (!shouldShowNotification(type, options?.isUrgent)) {
        return;
      }

      addNotification({
        type,
        title,
        message: options?.message,
        data: options?.data,
        link: options?.link,
        isUrgent: options?.isUrgent ?? false,
      });
    },
    [addNotification, shouldShowNotification]
  );

  // Update a single email preference
  const setEmailPreference = useCallback(
    (key: keyof EmailNotificationPreferences, value: boolean) => {
      // Security alerts cannot be disabled
      if (key === 'securityAlerts') return;
      updateEmailPreferences({ [key]: value });
    },
    [updateEmailPreferences]
  );

  // Update a single in-app preference
  const setInAppPreference = useCallback(
    (key: keyof InAppNotificationPreferences, value: boolean) => {
      updateInAppPreferences({ [key]: value });
    },
    [updateInAppPreferences]
  );

  // Format time for display
  const formatNotificationTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Get notification icon name based on type
  const getNotificationIcon = useCallback((type: NotificationType): string => {
    const iconMap: Record<NotificationType, string> = {
      new_lead: 'UserPlus',
      task_completion: 'CheckCircle',
      system_update: 'Bell',
      context_update: 'FileText',
      team_activity: 'Users',
      security_alert: 'ShieldAlert',
    };
    return iconMap[type] || 'Bell';
  }, []);

  return {
    // State
    notifications: state.notifications,
    preferences: state.preferences,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    isPanelOpen: state.isPanelOpen,
    groupedNotifications,

    // Notification actions
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Preference actions
    setEmailPreference,
    setInAppPreference,
    updateEmailPreferences,
    updateInAppPreferences,
    updateFrequencySettings,
    updateQuietHours,

    // Panel actions
    togglePanel,
    openPanel: () => togglePanel(true),
    closePanel: () => togglePanel(false),

    // Utilities
    isWithinQuietHours,
    shouldShowNotification,
    formatNotificationTime,
    getNotificationIcon,
  };
}

export default useNotifications;
