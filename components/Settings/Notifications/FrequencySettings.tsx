import React from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import { tw } from '../../../styles/settings';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSettings } from '../../../contexts/SettingsContext';
import type { NotificationFrequency } from '../../../types/settings';

const frequencyOptions: { value: NotificationFrequency; label: string; description: string }[] = [
  {
    value: 'realtime',
    label: 'Real-time',
    description: 'Receive notifications immediately as they happen',
  },
  {
    value: 'daily',
    label: 'Daily Digest',
    description: 'Receive a single daily summary email',
  },
  {
    value: 'weekly',
    label: 'Weekly Summary',
    description: 'Receive a weekly roundup email',
  },
];

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Generate time options in 30-minute intervals
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { value: time, label };
});

export function FrequencySettings() {
  const { preferences, updateFrequencySettings } = useNotifications();
  const { getSetting } = useSettings();

  const timezone = getSetting('timezone', 'America/New_York') as string;
  const { frequency, digestTime, digestDay } = preferences.frequency;

  const handleFrequencyChange = (newFrequency: NotificationFrequency) => {
    updateFrequencySettings({ frequency: newFrequency });
  };

  const handleTimeChange = (time: string) => {
    updateFrequencySettings({ digestTime: time });
  };

  const handleDayChange = (day: number) => {
    updateFrequencySettings({ digestDay: day });
  };

  return (
    <SettingsSection
      title="Notification Frequency"
      description="Choose how often you receive non-urgent notifications"
    >
      {/* Frequency Selection */}
      <div className="space-y-2 mb-6">
        {frequencyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFrequencyChange(option.value)}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors ${
              frequency === option.value
                ? 'bg-primary/10 border-primary/50'
                : 'bg-secondary/30 border-border hover:border-border/80'
            }`}
          >
            <div
              className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                frequency === option.value
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}
            >
              {frequency === option.value && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Digest Configuration (only shown for daily/weekly) */}
      {frequency !== 'realtime' && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Digest Configuration</span>
          </div>

          {/* Delivery Time */}
          <SettingsRow label="Delivery Time" description="When to send the digest email">
            <div className="relative">
              <select
                value={digestTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={`${tw.dropdown} pr-10 min-w-[150px]`}
              >
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value} className={tw.dropdownOption}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Day Selection (only for weekly) */}
          {frequency === 'weekly' && (
            <SettingsRow label="Delivery Day" description="Day of the week for the summary">
              <div className="relative">
                <select
                  value={digestDay}
                  onChange={(e) => handleDayChange(Number(e.target.value))}
                  className={`${tw.dropdown} pr-10 min-w-[150px]`}
                >
                  {dayOptions.map((option) => (
                    <option key={option.value} value={option.value} className={tw.dropdownOption}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </SettingsRow>
          )}

          {/* Timezone Notice */}
          <p className="text-xs text-muted-foreground">
            Times are shown in your timezone: {timezone}
          </p>
        </div>
      )}
    </SettingsSection>
  );
}

export default FrequencySettings;
