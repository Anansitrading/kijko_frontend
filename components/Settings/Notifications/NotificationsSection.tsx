import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { EmailNotifications } from './EmailNotifications';
import { InAppNotifications } from './InAppNotifications';
import { FrequencySettings } from './FrequencySettings';
import { QuietHours } from './QuietHours';

export function NotificationsSection() {
  const { state } = useSettings();

  if (state.activeSection !== 'notifications') {
    return null;
  }

  return (
    <div className="space-y-8">
      <EmailNotifications />
      <InAppNotifications />
      <FrequencySettings />
      <QuietHours />
    </div>
  );
}

export default NotificationsSection;
