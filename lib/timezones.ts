// Timezone Utilities
// Setting Sprint 2: My Profile

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export interface TimezoneGroup {
  region: string;
  timezones: TimezoneOption[];
}

// Common IANA timezones grouped by region
export const timezoneData: TimezoneGroup[] = [
  {
    region: 'Americas',
    timezones: [
      { value: 'America/New_York', label: 'New York (Eastern)', offset: 'UTC-5', region: 'Americas' },
      { value: 'America/Chicago', label: 'Chicago (Central)', offset: 'UTC-6', region: 'Americas' },
      { value: 'America/Denver', label: 'Denver (Mountain)', offset: 'UTC-7', region: 'Americas' },
      { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific)', offset: 'UTC-8', region: 'Americas' },
      { value: 'America/Anchorage', label: 'Anchorage (Alaska)', offset: 'UTC-9', region: 'Americas' },
      { value: 'Pacific/Honolulu', label: 'Honolulu (Hawaii)', offset: 'UTC-10', region: 'Americas' },
      { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-5', region: 'Americas' },
      { value: 'America/Vancouver', label: 'Vancouver', offset: 'UTC-8', region: 'Americas' },
      { value: 'America/Mexico_City', label: 'Mexico City', offset: 'UTC-6', region: 'Americas' },
      { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3', region: 'Americas' },
      { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3', region: 'Americas' },
      { value: 'America/Lima', label: 'Lima', offset: 'UTC-5', region: 'Americas' },
      { value: 'America/Bogota', label: 'Bogotá', offset: 'UTC-5', region: 'Americas' },
    ],
  },
  {
    region: 'Europe',
    timezones: [
      { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0', region: 'Europe' },
      { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Rome', label: 'Rome', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Stockholm', label: 'Stockholm', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Warsaw', label: 'Warsaw', offset: 'UTC+1', region: 'Europe' },
      { value: 'Europe/Athens', label: 'Athens', offset: 'UTC+2', region: 'Europe' },
      { value: 'Europe/Helsinki', label: 'Helsinki', offset: 'UTC+2', region: 'Europe' },
      { value: 'Europe/Kiev', label: 'Kyiv', offset: 'UTC+2', region: 'Europe' },
      { value: 'Europe/Moscow', label: 'Moscow', offset: 'UTC+3', region: 'Europe' },
      { value: 'Europe/Istanbul', label: 'Istanbul', offset: 'UTC+3', region: 'Europe' },
    ],
  },
  {
    region: 'Asia',
    timezones: [
      { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+4', region: 'Asia' },
      { value: 'Asia/Karachi', label: 'Karachi', offset: 'UTC+5', region: 'Asia' },
      { value: 'Asia/Kolkata', label: 'Mumbai / New Delhi', offset: 'UTC+5:30', region: 'Asia' },
      { value: 'Asia/Dhaka', label: 'Dhaka', offset: 'UTC+6', region: 'Asia' },
      { value: 'Asia/Bangkok', label: 'Bangkok', offset: 'UTC+7', region: 'Asia' },
      { value: 'Asia/Jakarta', label: 'Jakarta', offset: 'UTC+7', region: 'Asia' },
      { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8', region: 'Asia' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'UTC+8', region: 'Asia' },
      { value: 'Asia/Shanghai', label: 'Shanghai / Beijing', offset: 'UTC+8', region: 'Asia' },
      { value: 'Asia/Taipei', label: 'Taipei', offset: 'UTC+8', region: 'Asia' },
      { value: 'Asia/Seoul', label: 'Seoul', offset: 'UTC+9', region: 'Asia' },
      { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC+9', region: 'Asia' },
    ],
  },
  {
    region: 'Pacific',
    timezones: [
      { value: 'Australia/Perth', label: 'Perth', offset: 'UTC+8', region: 'Pacific' },
      { value: 'Australia/Adelaide', label: 'Adelaide', offset: 'UTC+9:30', region: 'Pacific' },
      { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10', region: 'Pacific' },
      { value: 'Australia/Melbourne', label: 'Melbourne', offset: 'UTC+10', region: 'Pacific' },
      { value: 'Australia/Brisbane', label: 'Brisbane', offset: 'UTC+10', region: 'Pacific' },
      { value: 'Pacific/Auckland', label: 'Auckland', offset: 'UTC+12', region: 'Pacific' },
      { value: 'Pacific/Fiji', label: 'Fiji', offset: 'UTC+12', region: 'Pacific' },
    ],
  },
  {
    region: 'Africa & Middle East',
    timezones: [
      { value: 'Africa/Cairo', label: 'Cairo', offset: 'UTC+2', region: 'Africa & Middle East' },
      { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'UTC+2', region: 'Africa & Middle East' },
      { value: 'Africa/Lagos', label: 'Lagos', offset: 'UTC+1', region: 'Africa & Middle East' },
      { value: 'Africa/Nairobi', label: 'Nairobi', offset: 'UTC+3', region: 'Africa & Middle East' },
      { value: 'Asia/Jerusalem', label: 'Jerusalem', offset: 'UTC+2', region: 'Africa & Middle East' },
      { value: 'Asia/Riyadh', label: 'Riyadh', offset: 'UTC+3', region: 'Africa & Middle East' },
      { value: 'Asia/Tehran', label: 'Tehran', offset: 'UTC+3:30', region: 'Africa & Middle East' },
    ],
  },
];

/**
 * Get all timezones as a flat list
 */
export function getAllTimezones(): TimezoneOption[] {
  return timezoneData.flatMap(group => group.timezones);
}

/**
 * Search timezones by label or value
 */
export function searchTimezones(query: string): TimezoneOption[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return getAllTimezones();

  return getAllTimezones().filter(tz =>
    tz.label.toLowerCase().includes(normalizedQuery) ||
    tz.value.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get timezone by value
 */
export function getTimezone(value: string): TimezoneOption | undefined {
  return getAllTimezones().find(tz => tz.value === value);
}

/**
 * Detect user's timezone
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  const tz = getTimezone(timezone);
  if (tz) {
    return `${tz.label} (${tz.offset})`;
  }
  return timezone;
}
