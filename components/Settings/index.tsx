// Settings Module - Main Entry Point
// Setting Sprint 1: Foundation & Settings Infrastructure
// Setting Sprint 2: My Profile
// Setting Sprint 3: General Settings
// Setting Sprint 4: Security and Data
// Setting Sprint 6: Integrations
// Setting Sprint 7: Billing and Usage
// Setting Sprint 8: Members (Team Management)
// Setting Sprint 10: Audit Log

// Layout
export { SettingsLayout, default as SettingsLayoutDefault } from './SettingsLayout';

// Navigation
export { SettingsSidebar } from './SettingsSidebar';

// Base Components
export { SettingsSection } from './SettingsSection';
export { SettingsRow } from './SettingsRow';

// Form Components
export { SettingsToggle } from './SettingsToggle';
export { SettingsDropdown } from './SettingsDropdown';
export { SettingsInput } from './SettingsInput';

// Status
export { SaveStatus } from './SaveStatus';

// Re-export context and hooks for convenience
export { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
export { useAutoSave } from '../../hooks/useAutoSave';

// Re-export types
export type {
  SettingsSection as SettingsSectionType,
  SaveStatus as SaveStatusType,
  SettingsValue,
  SettingsState,
  SettingsNavItem,
  UseAutoSaveOptions,
  UseAutoSaveReturn,
  // Security types (Sprint 4)
  TwoFactorSetupData,
  TwoFactorStatus,
  TwoFactorSetupStep,
  BackupCode,
  UserSession,
  ApiKeyScope,
  ApiKeyExpiration,
  ApiKey,
  CreateApiKeyData,
  CreatedApiKeyResponse,
  DataExportStatus,
  DataExportType,
  DataExportCategory,
  DataExportRequest,
  // Integrations types (Sprint 6)
  IntegrationCategory,
  IntegrationProvider,
  IntegrationApp,
  ConnectedIntegration,
  IntegrationConnectionStatus,
  WebhookEventType,
  WebhookStatus,
  Webhook,
  WebhookDelivery,
  CreateWebhookData,
} from '../../types/settings';

// Re-export integration constants
export { INTEGRATION_APPS, INTEGRATION_CATEGORIES, WEBHOOK_EVENT_LABELS } from '../../types/settings';

// Re-export design tokens
export { navigationItems, sectionConfig, tw as settingsTw } from '../../styles/settings';

// Profile Section (Sprint 2)
export { ProfileSection } from './Profile';
export { AvatarUpload, GravatarToggle, PasswordChange, TimezoneSelect, RoleSelect, EmailVerification } from './Profile';

// Note: General Section (Sprint 3) removed - functionality moved to My Profile modal
// ThemeToggle and ModelSelect can still be used in Profile modal if needed
export { ThemeToggle, ModelSelect } from './General';

// Re-export theme and model types
export type { Theme, AIModel, AIModelOption } from '../../types/settings';
export { AI_MODELS } from '../../types/settings';

// Re-export theme hook
export { useTheme } from '../../hooks/useTheme';

// Security Section (Sprint 4)
export { SecuritySection } from './Security';
export { TwoFactorSetup, BackupCodes, SessionsList, ApiKeyManager, ApiKeyCreate, DataExport } from './Security';

// Integrations Section (Sprint 6)
export { IntegrationsSection } from './Integrations';
export { IntegrationSearch, AppCard, AppGrid, WebhookForm, WebhookList } from './Integrations';

// Billing Section (Sprint 7)
export { BillingSection } from './Billing';
export { CurrentPlan, PaymentMethods, InvoiceHistory, UsageMetrics, BillingDetails } from './Billing';

// Re-export Billing types
export type {
  PlanTier,
  BillingInterval,
  Plan,
  SubscriptionStatus,
  Subscription,
  PaymentMethodType,
  CardBrand,
  PaymentMethod,
  InvoiceStatus,
  Invoice,
  UsageMetricType,
  UsageDataPoint,
  UsageMetric,
  BillingDetails as BillingDetailsType,
  BtwValidationResult,
  BillingState,
} from '../../types/settings';

// Re-export Billing constants
export { PLANS, USAGE_METRIC_LABELS } from '../../types/settings';

// Members Section (Sprint 8)
export { MembersSection } from './Members';
export { MemberList, RoleSelect as MemberRoleSelect, InviteModal, PendingInvitations } from './Members';

// Re-export Team context and types
export { TeamProvider, useTeam } from '../../contexts/TeamContext';
export type {
  TeamRole,
  TeamMemberStatus,
  InvitationStatus,
  RolePermissions,
  Team,
  TeamMember,
  TeamInvitation,
  TeamStats,
  InviteMemberData,
  TeamState,
} from '../../types/settings';
export { TEAM_ROLES } from '../../types/settings';

// Audit Log Section (Sprint 10)
export { AuditLogSection } from './AuditLog';
export { AuditTimeline, AuditEventCard, AuditFilters, ExportModal as AuditExportModal } from './AuditLog';

// Re-export Audit Log types
export type {
  AuditEventCategory,
  AuditEventType,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSavedFilter,
  AuditDateRangePreset,
  AuditExportFormat,
  AuditExportSchedule,
  AuditExportRequest,
  AuditLogState,
} from '../../types/settings';

// Re-export Audit Log constants
export { AUDIT_CATEGORY_CONFIG, AUDIT_EVENT_TYPE_LABELS, AUDIT_RETENTION_DAYS } from '../../types/settings';

// Re-export Audit Log utilities
export {
  generateMockAuditEntries,
  formatRelativeTime,
  formatFullTimestamp,
  getDateRangeFromPreset,
  filterAuditEntries,
  exportToCSV,
  exportToJSON,
  getInitials,
  getRetentionMessage,
  isAuditLogAvailable,
  isFullAuditAvailable,
  isPdfExportAvailable,
  isScheduledExportAvailable,
  getAvailableExportFormats,
  groupEntriesByDate,
} from '../../lib/audit-log';
