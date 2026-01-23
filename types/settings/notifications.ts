// Notifications Types
// Sprint 5: Notifications

// Notification frequency options
export type NotificationFrequency = 'realtime' | 'daily' | 'weekly';

// Quiet hours days configuration
export type QuietHoursDays = 'all' | 'weekdays' | 'weekends' | 'custom';

// Notification types for in-app notifications
export type NotificationType =
  | 'new_lead'
  | 'task_completion'
  | 'system_update'
  | 'context_update'
  | 'team_activity'
  | 'security_alert';

// Email notification preferences
export interface EmailNotificationPreferences {
  productUpdates: boolean;
  securityAlerts: boolean;
  billingReminders: boolean;
  weeklyDigest: boolean;
}

// In-app notification preferences
export interface InAppNotificationPreferences {
  newLeads: boolean;
  taskCompletions: boolean;
  systemUpdates: boolean;
  contextUpdates: boolean;
  teamActivity: boolean;
}

// Quiet hours configuration
export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: QuietHoursDays;
  customDays?: number[];
}

// Notification frequency settings
export interface NotificationFrequencySettings {
  frequency: NotificationFrequency;
  digestTime: string;
  digestDay: number;
}

// Complete notification preferences
export interface NotificationPreferences {
  email: EmailNotificationPreferences;
  inApp: InAppNotificationPreferences;
  frequency: NotificationFrequencySettings;
  quietHours: QuietHoursConfig;
}

// Individual notification item
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  link?: string;
  isRead: boolean;
  isUrgent: boolean;
  createdAt: Date;
}

// Notification context state
export interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  isLoading: boolean;
  isPanelOpen: boolean;
}

// Notification context actions
export type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_PREFERENCES'; payload: Partial<NotificationPreferences> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_PANEL'; payload?: boolean };

// Component props for Notifications
export interface EmailNotificationsProps {
  preferences: EmailNotificationPreferences;
  onPreferenceChange: (key: keyof EmailNotificationPreferences, value: boolean) => void;
}

export interface InAppNotificationsProps {
  preferences: InAppNotificationPreferences;
  onPreferenceChange: (key: keyof InAppNotificationPreferences, value: boolean) => void;
}

export interface FrequencySettingsProps {
  settings: NotificationFrequencySettings;
  timezone?: string;
  onSettingsChange: (settings: Partial<NotificationFrequencySettings>) => void;
}

export interface QuietHoursProps {
  config: QuietHoursConfig;
  timezone?: string;
  onConfigChange: (config: Partial<QuietHoursConfig>) => void;
}

export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}
