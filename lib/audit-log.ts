// Audit Log Utility Functions
// Setting Sprint 10: Audit Log

import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditEventCategory,
  AuditEventType,
  AuditExportFormat,
  AuditDateRangePreset,
  PlanTier,
} from '../types/settings';

// Generate mock audit log entries for development
export function generateMockAuditEntries(count: number = 50): AuditLogEntry[] {
  const eventTypes: AuditEventType[] = [
    'user.login',
    'user.logout',
    'user.profile_updated',
    'user.password_changed',
    'user.2fa_enabled',
    'context.created',
    'context.updated',
    'context.deleted',
    'context.shared',
    'team.member_invited',
    'team.member_joined',
    'team.role_changed',
    'security.login_failed',
    'security.session_terminated',
    'security.api_key_created',
    'integration.connected',
    'integration.webhook_triggered',
    'system.export_completed',
  ];

  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatarUrl: undefined },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatarUrl: undefined },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatarUrl: undefined },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', avatarUrl: undefined },
  ];

  const entries: AuditLogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const category = eventType.split('.')[0] as AuditEventCategory;
    const user = users[Math.floor(Math.random() * users.length)];
    const hoursAgo = Math.floor(Math.random() * 720); // Random time in last 30 days

    entries.push({
      id: `audit-${i + 1}`,
      teamId: 'team-1',
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userAvatarUrl: user.avatarUrl,
      eventType,
      eventCategory: category,
      description: generateEventDescription(eventType, user.name),
      metadata: generateEventMetadata(eventType),
      changes: generateEventChanges(eventType),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      sessionId: `session-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    });
  }

  // Sort by date descending
  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function generateEventDescription(eventType: AuditEventType, userName: string): string {
  const descriptions: Record<string, string> = {
    'user.login': `${userName} logged in`,
    'user.logout': `${userName} logged out`,
    'user.profile_updated': `${userName} updated their profile`,
    'user.password_changed': `${userName} changed their password`,
    'user.2fa_enabled': `${userName} enabled two-factor authentication`,
    'user.2fa_disabled': `${userName} disabled two-factor authentication`,
    'context.created': `${userName} created a new context`,
    'context.updated': `${userName} updated a context`,
    'context.deleted': `${userName} deleted a context`,
    'context.shared': `${userName} shared a context`,
    'context.exported': `${userName} exported a context`,
    'team.member_invited': `${userName} invited a new team member`,
    'team.member_joined': `A new member joined the team`,
    'team.member_removed': `${userName} removed a team member`,
    'team.role_changed': `${userName} changed a member's role`,
    'security.login_failed': `Failed login attempt detected`,
    'security.session_terminated': `${userName} terminated a session`,
    'security.api_key_created': `${userName} created a new API key`,
    'security.api_key_revoked': `${userName} revoked an API key`,
    'integration.connected': `${userName} connected an integration`,
    'integration.disconnected': `${userName} disconnected an integration`,
    'integration.webhook_triggered': `Webhook was triggered`,
    'system.export_completed': `Data export completed`,
    'system.backup_created': `System backup created`,
  };

  return descriptions[eventType] || `${userName} performed an action`;
}

function generateEventMetadata(eventType: AuditEventType): Record<string, unknown> | undefined {
  const metadataGenerators: Record<string, () => Record<string, unknown>> = {
    'user.login': () => ({
      browser: 'Chrome 120',
      os: 'Windows 11',
      location: 'Amsterdam, Netherlands',
    }),
    'context.created': () => ({
      contextName: `Project ${Math.floor(Math.random() * 100)}`,
      contextType: 'sales',
    }),
    'context.shared': () => ({
      sharedWith: 'john@example.com',
      permission: 'edit',
    }),
    'team.member_invited': () => ({
      invitedEmail: 'newuser@example.com',
      role: 'member',
    }),
    'team.role_changed': () => ({
      targetUser: 'jane@example.com',
      oldRole: 'member',
      newRole: 'admin',
    }),
    'security.api_key_created': () => ({
      keyName: `API Key ${Math.floor(Math.random() * 10)}`,
      scopes: ['read', 'write'],
    }),
    'integration.connected': () => ({
      provider: ['Slack', 'Salesforce', 'HubSpot'][Math.floor(Math.random() * 3)],
    }),
  };

  const generator = metadataGenerators[eventType];
  return generator ? generator() : undefined;
}

function generateEventChanges(eventType: AuditEventType): AuditLogEntry['changes'] | undefined {
  if (eventType === 'user.profile_updated') {
    return [
      { field: 'displayName', oldValue: 'John', newValue: 'John Doe' },
      { field: 'timezone', oldValue: 'UTC', newValue: 'Europe/Amsterdam' },
    ];
  }
  if (eventType === 'context.updated') {
    return [
      { field: 'name', oldValue: 'Old Context Name', newValue: 'New Context Name' },
    ];
  }
  return undefined;
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Format full timestamp
export function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Get date range from preset
export function getDateRangeFromPreset(preset: AuditDateRangePreset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  switch (preset) {
    case 'today':
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
      break;
    case '7days':
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    case '30days':
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      break;
    default:
      from = new Date(now);
      from.setDate(from.getDate() - 30);
  }

  return { from, to };
}

// Filter audit entries
export function filterAuditEntries(
  entries: AuditLogEntry[],
  filters: AuditLogFilters
): AuditLogEntry[] {
  return entries.filter((entry) => {
    // Filter by user
    if (filters.userId && entry.userId !== filters.userId) {
      return false;
    }

    // Filter by category
    if (filters.eventCategory && entry.eventCategory !== filters.eventCategory) {
      return false;
    }

    // Filter by event types
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      if (!filters.eventTypes.includes(entry.eventType)) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateFrom && entry.createdAt < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && entry.createdAt > filters.dateTo) {
      return false;
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesDescription = entry.description.toLowerCase().includes(query);
      const matchesUserName = entry.userName?.toLowerCase().includes(query);
      const matchesUserEmail = entry.userEmail?.toLowerCase().includes(query);
      const matchesEventType = entry.eventType.toLowerCase().includes(query);

      if (!matchesDescription && !matchesUserName && !matchesUserEmail && !matchesEventType) {
        return false;
      }
    }

    return true;
  });
}

// Export audit entries to CSV
export function exportToCSV(entries: AuditLogEntry[]): string {
  const headers = ['Timestamp', 'User', 'Email', 'Category', 'Event', 'Description', 'IP Address'];
  const rows = entries.map((entry) => [
    formatFullTimestamp(entry.createdAt),
    entry.userName || 'System',
    entry.userEmail || '-',
    entry.eventCategory,
    entry.eventType,
    entry.description,
    entry.ipAddress || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Export audit entries to JSON
export function exportToJSON(entries: AuditLogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

// Generate initials from name
export function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Get retention message based on plan
export function getRetentionMessage(plan: PlanTier): string {
  const days = {
    free: 7,
    pro: 30,
    teams: 90,
    enterprise: 365,
  }[plan];

  if (plan === 'enterprise') {
    return 'Logs retained for 1+ year';
  }
  return `Logs retained for ${days} days`;
}

// Check if audit log feature is available for plan
export function isAuditLogAvailable(plan: PlanTier): boolean {
  return true; // Available for all plans with different retention
}

// Check if full audit log is available (Teams/Enterprise)
export function isFullAuditAvailable(plan: PlanTier): boolean {
  return plan === 'teams' || plan === 'enterprise';
}

// Check if PDF export is available (Enterprise only)
export function isPdfExportAvailable(plan: PlanTier): boolean {
  return plan === 'enterprise';
}

// Check if scheduled exports are available (Enterprise only)
export function isScheduledExportAvailable(plan: PlanTier): boolean {
  return plan === 'enterprise';
}

// Get available export formats based on plan
export function getAvailableExportFormats(plan: PlanTier): AuditExportFormat[] {
  if (plan === 'enterprise') {
    return ['csv', 'json', 'pdf'];
  }
  return ['csv', 'json'];
}

// Group entries by date for timeline display
export function groupEntriesByDate(entries: AuditLogEntry[]): Map<string, AuditLogEntry[]> {
  const groups = new Map<string, AuditLogEntry[]>();

  entries.forEach((entry) => {
    const dateKey = entry.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const existing = groups.get(dateKey) || [];
    existing.push(entry);
    groups.set(dateKey, existing);
  });

  return groups;
}
