// Audit Log Types
// Sprint 10: Audit Log

import type { PlanTier } from './billing';

// Audit log event categories
export type AuditEventCategory =
  | 'user'
  | 'context'
  | 'team'
  | 'security'
  | 'integration'
  | 'system';

// Audit log event types per category
export type AuditUserEventType =
  | 'login'
  | 'logout'
  | 'profile_updated'
  | 'password_changed'
  | '2fa_enabled'
  | '2fa_disabled';

export type AuditContextEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'shared'
  | 'exported';

export type AuditTeamEventType =
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'role_changed';

export type AuditSecurityEventType =
  | 'login_failed'
  | 'session_terminated'
  | 'api_key_created'
  | 'api_key_revoked';

export type AuditIntegrationEventType =
  | 'connected'
  | 'disconnected'
  | 'webhook_triggered';

export type AuditSystemEventType =
  | 'export_completed'
  | 'backup_created';

export type AuditEventType =
  | `user.${AuditUserEventType}`
  | `context.${AuditContextEventType}`
  | `team.${AuditTeamEventType}`
  | `security.${AuditSecurityEventType}`
  | `integration.${AuditIntegrationEventType}`
  | `system.${AuditSystemEventType}`;

// Audit log entry entity
export interface AuditLogEntry {
  id: string;
  teamId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string;
  eventType: AuditEventType;
  eventCategory: AuditEventCategory;
  description: string;
  metadata?: Record<string, unknown>;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  ipAddress?: string;
  sessionId?: string;
  createdAt: Date;
}

// Audit log filter options
export interface AuditLogFilters {
  userId?: string;
  eventCategory?: AuditEventCategory;
  eventTypes?: AuditEventType[];
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

// Saved filter entity
export interface AuditLogSavedFilter {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  filters: AuditLogFilters;
  isShared: boolean;
  createdAt: Date;
}

// Date range presets
export type AuditDateRangePreset = 'today' | '7days' | '30days' | 'custom';

// Export format options
export type AuditExportFormat = 'csv' | 'json' | 'pdf';

// Export schedule frequency
export type AuditExportSchedule = 'daily' | 'weekly' | 'monthly';

// Export request
export interface AuditExportRequest {
  format: AuditExportFormat;
  filters: AuditLogFilters;
  schedule?: AuditExportSchedule;
}

// Retention policy by plan
export const AUDIT_RETENTION_DAYS: Record<PlanTier, number> = {
  free: 7,
  pro: 30,
  teams: 90,
  enterprise: 365,
};

// Event category labels and colors
export const AUDIT_CATEGORY_CONFIG: Record<AuditEventCategory, { label: string; color: string; bgColor: string }> = {
  user: { label: 'User', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  context: { label: 'Context', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  team: { label: 'Team', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  security: { label: 'Security', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  integration: { label: 'Integration', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  system: { label: 'System', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
};

// Event type labels
export const AUDIT_EVENT_TYPE_LABELS: Partial<Record<AuditEventType, string>> = {
  'user.login': 'Logged In',
  'user.logout': 'Logged Out',
  'user.profile_updated': 'Profile Updated',
  'user.password_changed': 'Password Changed',
  'user.2fa_enabled': '2FA Enabled',
  'user.2fa_disabled': '2FA Disabled',
  'context.created': 'Context Created',
  'context.updated': 'Context Updated',
  'context.deleted': 'Context Deleted',
  'context.shared': 'Context Shared',
  'context.exported': 'Context Exported',
  'team.member_invited': 'Member Invited',
  'team.member_joined': 'Member Joined',
  'team.member_removed': 'Member Removed',
  'team.role_changed': 'Role Changed',
  'security.login_failed': 'Login Failed',
  'security.session_terminated': 'Session Terminated',
  'security.api_key_created': 'API Key Created',
  'security.api_key_revoked': 'API Key Revoked',
  'integration.connected': 'Integration Connected',
  'integration.disconnected': 'Integration Disconnected',
  'integration.webhook_triggered': 'Webhook Triggered',
  'system.export_completed': 'Export Completed',
  'system.backup_created': 'Backup Created',
};

// Audit log state
export interface AuditLogState {
  entries: AuditLogEntry[];
  filters: AuditLogFilters;
  savedFilters: AuditLogSavedFilter[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;
  error: string | null;
}

// Audit log actions
export type AuditLogAction =
  | { type: 'SET_ENTRIES'; payload: AuditLogEntry[] }
  | { type: 'APPEND_ENTRIES'; payload: AuditLogEntry[] }
  | { type: 'PREPEND_ENTRY'; payload: AuditLogEntry }
  | { type: 'SET_FILTERS'; payload: AuditLogFilters }
  | { type: 'SET_SAVED_FILTERS'; payload: AuditLogSavedFilter[] }
  | { type: 'ADD_SAVED_FILTER'; payload: AuditLogSavedFilter }
  | { type: 'REMOVE_SAVED_FILTER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_TOTAL_COUNT'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null };

// Component Props for Audit Log Section

export interface AuditTimelineProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onEntryClick: (entry: AuditLogEntry) => void;
}

export interface AuditEventCardProps {
  entry: AuditLogEntry;
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

export interface AuditFiltersProps {
  filters: AuditLogFilters;
  savedFilters: AuditLogSavedFilter[];
  teamMembers: { id: string; name: string; email: string }[];
  onFiltersChange: (filters: AuditLogFilters) => void;
  onSaveFilter: (name: string, isShared: boolean) => Promise<void>;
  onApplySavedFilter: (filterId: string) => void;
  onDeleteSavedFilter: (filterId: string) => Promise<void>;
}

export interface AuditExportModalProps {
  isOpen: boolean;
  filters: AuditLogFilters;
  currentPlan: PlanTier;
  onClose: () => void;
  onExport: (request: AuditExportRequest) => Promise<void>;
}

export interface AuditLogSectionProps {
  currentPlan: PlanTier;
}
