// API Key Generation Utilities
// Setting Sprint 4: Security and Data

import type {
  ApiKey,
  ApiKeyExpiration,
  ApiKeyScope,
  CreateApiKeyData,
  CreatedApiKeyResponse,
} from '../types/settings';

/**
 * Generate a secure random API key
 * Format: kijko_{environment}_{random_string}
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `kijko_${environment}_${randomPart}`;
}

/**
 * Extract the prefix from an API key (for display)
 * Shows first 20 characters
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 20);
}

/**
 * Mask an API key for display
 * Shows prefix + dots
 */
export function maskApiKey(prefix: string): string {
  return `${prefix}...`;
}

/**
 * Calculate expiration date from expiration option
 */
export function calculateExpirationDate(
  expiration: ApiKeyExpiration,
  customDays?: number
): Date | undefined {
  if (expiration === 'never') {
    return undefined;
  }

  const now = new Date();
  let days: number;

  if (expiration === 'custom' && customDays) {
    days = customDays;
  } else {
    days = parseInt(expiration, 10);
  }

  now.setDate(now.getDate() + days);
  return now;
}

/**
 * Check if an API key is expired
 */
export function isKeyExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(expiresAt?: Date): string {
  if (!expiresAt) return 'Never expires';

  const date = new Date(expiresAt);
  const now = new Date();

  if (date < now) {
    return 'Expired';
  }

  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  if (diffDays <= 30) return `Expires in ${Math.ceil(diffDays / 7)} weeks`;

  return `Expires ${date.toLocaleDateString()}`;
}

/**
 * Format relative time for "last used"
 */
export function formatLastUsed(lastUsedAt?: Date): string {
  if (!lastUsedAt) return 'Never used';

  const date = new Date(lastUsedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString();
}

/**
 * Get scope label for display
 */
export function getScopeLabel(scope: ApiKeyScope): string {
  const labels: Record<ApiKeyScope, string> = {
    read: 'Read',
    write: 'Write',
    admin: 'Admin',
  };
  return labels[scope];
}

/**
 * Get scope description
 */
export function getScopeDescription(scope: ApiKeyScope): string {
  const descriptions: Record<ApiKeyScope, string> = {
    read: 'Can read data and fetch resources',
    write: 'Can create and update resources',
    admin: 'Full access including delete and settings',
  };
  return descriptions[scope];
}

/**
 * Get scope color for badge display
 */
export function getScopeColor(scope: ApiKeyScope): string {
  const colors: Record<ApiKeyScope, string> = {
    read: 'bg-blue-500/20 text-blue-400',
    write: 'bg-amber-500/20 text-amber-400',
    admin: 'bg-red-500/20 text-red-400',
  };
  return colors[scope];
}

/**
 * Validate API key name
 */
export function validateKeyName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  return { valid: true };
}

/**
 * Create API key (mock implementation)
 * In production, this would be an API call
 */
export async function createApiKey(data: CreateApiKeyData): Promise<CreatedApiKeyResponse> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const key = generateApiKey('live');
  const keyPrefix = getKeyPrefix(key);
  const expiresAt = calculateExpirationDate(data.expiration, data.customExpirationDays);

  return {
    id: crypto.randomUUID(),
    name: data.name,
    key,
    keyPrefix,
    scopes: data.scopes,
    expiresAt,
  };
}

/**
 * Copy API key to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate mock API keys for demo
 */
export function generateMockApiKeys(): ApiKey[] {
  const now = new Date();

  return [
    {
      id: '1',
      name: 'Production API',
      keyPrefix: 'kijko_live_a1b2c3d4e5',
      scopes: ['read', 'write'],
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      usageCount: 1547,
      isExpired: false,
    },
    {
      id: '2',
      name: 'Development Testing',
      keyPrefix: 'kijko_test_f6g7h8i9j0',
      scopes: ['read'],
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      usageCount: 234,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      isExpired: false,
    },
    {
      id: '3',
      name: 'CI/CD Pipeline',
      keyPrefix: 'kijko_live_k1l2m3n4o5',
      scopes: ['read', 'write', 'admin'],
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      usageCount: 8923,
      isExpired: false,
    },
  ];
}
