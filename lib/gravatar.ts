// Gravatar Utilities
// Setting Sprint 2: My Profile

/**
 * Generate MD5 hash for Gravatar
 * Uses a simple implementation since we're in browser
 */
async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Take first 16 bytes to simulate MD5 length
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate Gravatar URL from email
 * @param email User's email address
 * @param size Image size in pixels (default 80)
 * @param defaultImage Fallback image type
 */
export async function getGravatarUrl(
  email: string,
  size: number = 80,
  defaultImage: 'mp' | 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'blank' | '404' = 'mp'
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = await md5(normalizedEmail);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Synchronous Gravatar URL generation using pre-computed hash
 */
export function getGravatarUrlSync(
  emailHash: string,
  size: number = 80,
  defaultImage: 'mp' | 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'blank' | '404' = 'mp'
): string {
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=${defaultImage}`;
}

/**
 * Check if a Gravatar exists for an email
 * @param email User's email address
 * @returns true if Gravatar exists
 */
export async function hasGravatar(email: string): Promise<boolean> {
  try {
    const url = await getGravatarUrl(email, 80, '404');
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate initials from name
 * @param firstName First name
 * @param lastName Last name
 * @returns Two-letter initials
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '?';
}

/**
 * Generate a color from a string (for avatar background)
 * @param str Input string (e.g., email or name)
 * @returns Hex color string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  return colors[Math.abs(hash) % colors.length];
}
