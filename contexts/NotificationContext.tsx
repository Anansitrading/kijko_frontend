import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type {
  NotificationState,
  NotificationAction,
  Notification,
  NotificationPreferences,
  EmailNotificationPreferences,
  InAppNotificationPreferences,
  NotificationFrequencySettings,
  QuietHoursConfig,
} from '../types/settings';

// Local storage keys
const NOTIFICATION_PREFS_KEY = 'notification_preferences';
const NOTIFICATIONS_KEY = 'notifications';

// Default preferences
const defaultEmailPreferences: EmailNotificationPreferences = {
  productUpdates: true,
  securityAlerts: true, // Cannot be disabled
  billingReminders: true,
  weeklyDigest: false,
};

const defaultInAppPreferences: InAppNotificationPreferences = {
  newLeads: true,
  taskCompletions: true,
  systemUpdates: true,
  contextUpdates: false,
  teamActivity: true,
};

const defaultFrequencySettings: NotificationFrequencySettings = {
  frequency: 'realtime',
  digestTime: '09:00',
  digestDay: 1, // Monday
};

const defaultQuietHours: QuietHoursConfig = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  days: 'all',
};

const defaultPreferences: NotificationPreferences = {
  email: defaultEmailPreferences,
  inApp: defaultInAppPreferences,
  frequency: defaultFrequencySettings,
  quietHours: defaultQuietHours,
};

// Initial state
const initialState: NotificationState = {
  notifications: [],
  preferences: defaultPreferences,
  unreadCount: 0,
  isLoading: true,
  isPanelOpen: false,
};

// Load from localStorage
function loadPreferencesFromStorage(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure security alerts is always true
      if (parsed.email) {
        parsed.email.securityAlerts = true;
      }
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load notification preferences:', error);
  }
  return defaultPreferences;
}

function loadNotificationsFromStorage(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: Notification) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
  return [];
}

// Save to localStorage
function savePreferencesToStorage(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
  }
}

function saveNotificationsToStorage(notifications: Notification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

// Calculate unread count
function calculateUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead).length;
}

// Reducer
function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS': {
      const notifications = action.payload;
      saveNotificationsToStorage(notifications);
      return {
        ...state,
        notifications,
        unreadCount: calculateUnreadCount(notifications),
        isLoading: false,
      };
    }
    case 'ADD_NOTIFICATION': {
      const notifications = [action.payload, ...state.notifications];
      saveNotificationsToStorage(notifications);
      return {
        ...state,
        notifications,
        unreadCount: calculateUnreadCount(notifications),
      };
    }
    case 'MARK_AS_READ': {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, isRead: true } : n
      );
      saveNotificationsToStorage(notifications);
      return {
        ...state,
        notifications,
        unreadCount: calculateUnreadCount(notifications),
      };
    }
    case 'MARK_ALL_AS_READ': {
      const notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      saveNotificationsToStorage(notifications);
      return {
        ...state,
        notifications,
        unreadCount: 0,
      };
    }
    case 'DELETE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.payload);
      saveNotificationsToStorage(notifications);
      return {
        ...state,
        notifications,
        unreadCount: calculateUnreadCount(notifications),
      };
    }
    case 'SET_PREFERENCES': {
      const preferences = {
        ...state.preferences,
        ...action.payload,
        email: {
          ...state.preferences.email,
          ...(action.payload.email || {}),
          securityAlerts: true, // Always enforce
        },
      };
      savePreferencesToStorage(preferences);
      return {
        ...state,
        preferences,
      };
    }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'TOGGLE_PANEL':
      return {
        ...state,
        isPanelOpen: action.payload ?? !state.isPanelOpen,
      };
    default:
      return state;
  }
}

// Context interface
interface NotificationContextValue {
  state: NotificationState;
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  // Preference actions
  updateEmailPreferences: (prefs: Partial<EmailNotificationPreferences>) => void;
  updateInAppPreferences: (prefs: Partial<InAppNotificationPreferences>) => void;
  updateFrequencySettings: (settings: Partial<NotificationFrequencySettings>) => void;
  updateQuietHours: (config: Partial<QuietHoursConfig>) => void;
  // Panel actions
  togglePanel: (open?: boolean) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider props
interface NotificationProviderProps {
  children: React.ReactNode;
}

// Provider component
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    const preferences = loadPreferencesFromStorage();
    const notifications = loadNotificationsFromStorage();
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }, []);

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        isRead: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    },
    []
  );

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  }, []);

  // Update email preferences
  const updateEmailPreferences = useCallback(
    (prefs: Partial<EmailNotificationPreferences>) => {
      dispatch({
        type: 'SET_PREFERENCES',
        payload: {
          email: { ...state.preferences.email, ...prefs },
        },
      });
    },
    [state.preferences.email]
  );

  // Update in-app preferences
  const updateInAppPreferences = useCallback(
    (prefs: Partial<InAppNotificationPreferences>) => {
      dispatch({
        type: 'SET_PREFERENCES',
        payload: {
          inApp: { ...state.preferences.inApp, ...prefs },
        },
      });
    },
    [state.preferences.inApp]
  );

  // Update frequency settings
  const updateFrequencySettings = useCallback(
    (settings: Partial<NotificationFrequencySettings>) => {
      dispatch({
        type: 'SET_PREFERENCES',
        payload: {
          frequency: { ...state.preferences.frequency, ...settings },
        },
      });
    },
    [state.preferences.frequency]
  );

  // Update quiet hours
  const updateQuietHours = useCallback(
    (config: Partial<QuietHoursConfig>) => {
      dispatch({
        type: 'SET_PREFERENCES',
        payload: {
          quietHours: { ...state.preferences.quietHours, ...config },
        },
      });
    },
    [state.preferences.quietHours]
  );

  // Toggle panel
  const togglePanel = useCallback((open?: boolean) => {
    dispatch({ type: 'TOGGLE_PANEL', payload: open });
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

export { NotificationContext };
