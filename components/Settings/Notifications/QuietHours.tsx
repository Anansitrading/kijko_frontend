import React from 'react';
import { Moon, ChevronDown, ShieldAlert } from 'lucide-react';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import { tw } from '../../../styles/settings';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSettings } from '../../../contexts/SettingsContext';
import type { QuietHoursDays } from '../../../types/settings';

const daysOptions: { value: QuietHoursDays; label: string }[] = [
  { value: 'all', label: 'All Days' },
  { value: 'weekdays', label: 'Weekdays Only' },
  { value: 'weekends', label: 'Weekends Only' },
  { value: 'custom', label: 'Custom' },
];

const weekDays = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
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

export function QuietHours() {
  const { preferences, updateQuietHours, isWithinQuietHours } = useNotifications();
  const { getSetting } = useSettings();

  const timezone = getSetting('timezone', 'America/New_York') as string;
  const { enabled, startTime, endTime, days, customDays = [] } = preferences.quietHours;

  const handleToggle = () => {
    updateQuietHours({ enabled: !enabled });
  };

  const handleStartTimeChange = (time: string) => {
    updateQuietHours({ startTime: time });
  };

  const handleEndTimeChange = (time: string) => {
    updateQuietHours({ endTime: time });
  };

  const handleDaysChange = (newDays: QuietHoursDays) => {
    updateQuietHours({ days: newDays });
  };

  const handleCustomDayToggle = (day: number) => {
    const newCustomDays = customDays.includes(day)
      ? customDays.filter(d => d !== day)
      : [...customDays, day];
    updateQuietHours({ customDays: newCustomDays });
  };

  const isCurrentlyQuiet = isWithinQuietHours();

  return (
    <SettingsSection
      title="Quiet Hours"
      description="Set times when non-urgent notifications are silenced"
    >
      {/* Enable Toggle */}
      <SettingsRow
        label="Enable Quiet Hours"
        description="Suppress notifications during specified hours"
      >
        <div className="flex items-center gap-3">
          {enabled && isCurrentlyQuiet && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
              <Moon className="w-3 h-3" />
              <span>Active now</span>
            </div>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Enable quiet hours"
            onClick={handleToggle}
            className={enabled ? tw.toggleActive : tw.toggle}
          >
            <span
              className={enabled ? tw.toggleKnobActive : tw.toggleKnob}
              aria-hidden="true"
            />
          </button>
        </div>
      </SettingsRow>

      {/* Configuration (only shown when enabled) */}
      {enabled && (
        <div className="space-y-4 pt-4 border-t border-border mt-4">
          {/* Time Range */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
              <div className="relative">
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`${tw.dropdown} pr-10 w-full`}
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value} className={tw.dropdownOption}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <span className="text-muted-foreground mt-5">to</span>

            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">End Time</label>
              <div className="relative">
                <select
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className={`${tw.dropdown} pr-10 w-full`}
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value} className={tw.dropdownOption}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Days Selection */}
          <SettingsRow label="Apply To" description="Which days to enable quiet hours">
            <div className="relative">
              <select
                value={days}
                onChange={(e) => handleDaysChange(e.target.value as QuietHoursDays)}
                className={`${tw.dropdown} pr-10 min-w-[150px]`}
              >
                {daysOptions.map((option) => (
                  <option key={option.value} value={option.value} className={tw.dropdownOption}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Custom Days Selector */}
          {days === 'custom' && (
            <div className="flex gap-2 pt-2">
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleCustomDayToggle(day.value)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    customDays.includes(day.value)
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-secondary/30 border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          {/* Timezone and Security Notice */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Times are based on your timezone: {timezone}
            </p>

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-amber-400 font-medium">Urgent Security Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Critical security notifications will bypass quiet hours to ensure your account safety.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default QuietHours;
