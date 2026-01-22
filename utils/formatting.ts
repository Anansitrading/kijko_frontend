/**
 * Formatting utilities for numbers, dates, and currency
 */

/**
 * Formats a number with commas (e.g., 2331777 -> "2,331,777")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a date as "Jan 22, 2026 15:23"
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  }
}

/**
 * Formats interval in days (e.g., 3.2 -> "3.2d")
 */
export function formatInterval(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  return `${days.toFixed(1)}d`;
}

/**
 * Formats currency (e.g., 23.32 -> "$23.32")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats compression ratio (e.g., 19.4 -> "19.4x")
 */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)}x`;
}

/**
 * Formats percentage (e.g., 94.8 -> "94.8%")
 */
export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Formats file count with +/- prefix (e.g., 127, true -> "+127 files")
 */
export function formatFileChange(count: number, isAdded: boolean): string {
  const prefix = isAdded ? '+' : '-';
  const suffix = count === 1 ? 'file' : 'files';
  return `${prefix}${count} ${suffix}`;
}
