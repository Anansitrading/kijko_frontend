import React from 'react';
import { Bell, UserPlus, CheckCircle, Info, FileText, Users } from 'lucide-react';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import { tw } from '../../../styles/settings';
import { useNotifications } from '../../../hooks/useNotifications';
import type { InAppNotificationPreferences } from '../../../types/settings';

interface InAppNotificationItem {
  key: keyof InAppNotificationPreferences;
  label: string;
  description: string;
  icon: React.ReactNode;
  teamsOnly?: boolean;
}

const inAppNotificationItems: InAppNotificationItem[] = [
  {
    key: 'newLeads',
    label: 'New Leads',
    description: 'When new leads are captured from your sources',
    icon: <UserPlus className="w-4 h-4 text-green-400" />,
  },
  {
    key: 'taskCompletions',
    label: 'Task Completions',
    description: 'When background tasks and jobs complete',
    icon: <CheckCircle className="w-4 h-4 text-blue-400" />,
  },
  {
    key: 'systemUpdates',
    label: 'System Updates',
    description: 'Maintenance notices and new feature announcements',
    icon: <Info className="w-4 h-4 text-amber-400" />,
  },
  {
    key: 'contextUpdates',
    label: 'Context Updates',
    description: 'Changes to your saved contexts and configurations',
    icon: <FileText className="w-4 h-4 text-purple-400" />,
  },
  {
    key: 'teamActivity',
    label: 'Team Activity',
    description: 'Actions by team members on shared resources',
    icon: <Users className="w-4 h-4 text-cyan-400" />,
    teamsOnly: true,
  },
];

export function InAppNotifications() {
  const { preferences, setInAppPreference } = useNotifications();

  const handleToggle = (key: keyof InAppNotificationPreferences) => {
    setInAppPreference(key, !preferences.inApp[key]);
  };

  return (
    <SettingsSection
      title="In-App Notifications"
      description="Configure which events trigger notifications in the app"
    >
      <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 border border-border rounded-lg">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          These notifications appear in your notification center
        </span>
      </div>

      {inAppNotificationItems.map((item) => {
        const isEnabled = preferences.inApp[item.key];

        return (
          <SettingsRow key={item.key} label={item.label} description={item.description}>
            <div className="flex items-center gap-3">
              {item.icon}
              {item.teamsOnly && (
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                  Teams
                </span>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={item.label}
                onClick={() => handleToggle(item.key)}
                className={isEnabled ? tw.toggleActive : tw.toggle}
              >
                <span
                  className={isEnabled ? tw.toggleKnobActive : tw.toggleKnob}
                  aria-hidden="true"
                />
              </button>
            </div>
          </SettingsRow>
        );
      })}
    </SettingsSection>
  );
}

export default InAppNotifications;
