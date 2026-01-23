import React from 'react';
import { Mail, Lock } from 'lucide-react';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import { tw } from '../../../styles/settings';
import { useNotifications } from '../../../hooks/useNotifications';
import type { EmailNotificationPreferences } from '../../../types/settings';

interface EmailNotificationItem {
  key: keyof EmailNotificationPreferences;
  label: string;
  description: string;
  locked?: boolean;
}

const emailNotificationItems: EmailNotificationItem[] = [
  {
    key: 'productUpdates',
    label: 'Product Updates',
    description: 'New features, improvements, and releases',
  },
  {
    key: 'securityAlerts',
    label: 'Security Alerts',
    description: 'Login attempts, password changes, and 2FA updates',
    locked: true,
  },
  {
    key: 'billingReminders',
    label: 'Billing Reminders',
    description: 'Payment due dates and subscription changes',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly Digest',
    description: 'Summary of your activity and platform updates',
  },
];

export function EmailNotifications() {
  const { preferences, setEmailPreference } = useNotifications();

  const handleToggle = (key: keyof EmailNotificationPreferences) => {
    if (key === 'securityAlerts') return; // Cannot toggle security alerts
    setEmailPreference(key, !preferences.email[key]);
  };

  return (
    <SettingsSection
      title="Email Notifications"
      description="Control which emails you receive from us"
    >
      <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Mail className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Emails will be sent to your registered email address
        </span>
      </div>

      {emailNotificationItems.map((item) => {
        const isEnabled = preferences.email[item.key];
        const isLocked = item.locked;

        return (
          <SettingsRow key={item.key} label={item.label} description={item.description}>
            <div className="flex items-center gap-2">
              {isLocked && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Required</span>
                </div>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={item.label}
                disabled={isLocked}
                onClick={() => handleToggle(item.key)}
                className={`${isEnabled ? tw.toggleActive : tw.toggle} ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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

      <p className="text-xs text-muted-foreground mt-4">
        Security alerts cannot be disabled for your account protection.
        Unsubscribe links in emails will sync with these settings.
      </p>
    </SettingsSection>
  );
}

export default EmailNotifications;
