// Security Types
// Sprint 4: Basic Security + Sprint 9: Advanced Security

// ===========================================
// Two-Factor Authentication Types
// ===========================================

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  enabledAt?: Date;
  backupCodesRemaining?: number;
}

export type TwoFactorSetupStep = 'initial' | 'qr-scan' | 'verify' | 'backup-codes' | 'complete';

// ===========================================
// Backup Codes Types
// ===========================================

export interface BackupCode {
  code: string;
  isUsed: boolean;
  usedAt?: Date;
}

// ===========================================
// Session Types
// ===========================================

export interface UserSession {
  id: string;
  deviceInfo: {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  ipAddress: string;
  location: {
    city?: string;
    country?: string;
    region?: string;
  };
  lastActive: Date;
  createdAt: Date;
  isCurrent: boolean;
}

// ===========================================
// API Key Types
// ===========================================

export type ApiKeyScope = 'read' | 'write' | 'admin';

export type ApiKeyExpiration = 'never' | '30' | '60' | '90' | 'custom';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  expiresAt?: Date;
  isExpired: boolean;
}

export interface CreateApiKeyData {
  name: string;
  expiration: ApiKeyExpiration;
  customExpirationDays?: number;
  scopes: ApiKeyScope[];
}

export interface CreatedApiKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
}

// ===========================================
// Data Export Types
// ===========================================

export type DataExportStatus = 'pending' | 'processing' | 'ready' | 'expired' | 'failed';

export type DataExportType = 'full' | 'selective';

export type DataExportCategory =
  | 'profile'
  | 'settings'
  | 'activity'
  | 'contexts'
  | 'integrations';

export interface DataExportRequest {
  id: string;
  type: DataExportType;
  categories: DataExportCategory[];
  status: DataExportStatus;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  fileUrl?: string;
  fileSize?: number;
}

// ===========================================
// Login History Types (Advanced Security)
// ===========================================

export type LoginStatus = 'success' | 'failed' | 'blocked';

export type LoginMethod = 'password' | 'sso' | '2fa' | 'api_key' | 'magic_link';

export interface LoginLocation {
  city?: string;
  country?: string;
  region?: string;
  timezone?: string;
}

export interface LoginDeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  status: LoginStatus;
  ipAddress: string;
  location: LoginLocation;
  deviceInfo: LoginDeviceInfo;
  authMethod: LoginMethod;
  failureReason?: string;
  createdAt: Date;
}

export interface LoginHistoryFilters {
  status?: LoginStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

// ===========================================
// Security Policies Types (Advanced Security)
// ===========================================

export type Require2FA = 'none' | 'admins' | 'all';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  expiryDays?: number;
  preventReuse: number;
}

export interface SessionPolicy {
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  maxConcurrentSessions: number;
  rememberDeviceDays: number;
}

export interface AuthenticationPolicy {
  require2fa: Require2FA;
  ssoEnforcement: boolean;
  allowPasswordAuth: boolean;
  allowMagicLinkAuth: boolean;
}

export interface SecurityPolicies {
  teamId: string;
  password: PasswordPolicy;
  session: SessionPolicy;
  authentication: AuthenticationPolicy;
  updatedAt: Date;
}

// ===========================================
// IP Whitelist Types (Advanced Security)
// ===========================================

export type IPWhitelistMode = 'disabled' | 'warn' | 'enforce';

export interface IPWhitelistEntry {
  id: string;
  teamId: string;
  name: string;
  ipAddress?: string;
  ipRange?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface IPWhitelistGroup {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  entries: IPWhitelistEntry[];
  isActive: boolean;
}

export interface IPWhitelistSettings {
  teamId: string;
  mode: IPWhitelistMode;
  adminBypassEnabled: boolean;
  entries: IPWhitelistEntry[];
  groups: IPWhitelistGroup[];
}

// ===========================================
// Compliance Dashboard Types (Advanced Security)
// ===========================================

export type ComplianceFramework = 'soc2' | 'iso27001' | 'gdpr' | 'hipaa';

export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';

export interface ComplianceDocument {
  id: string;
  framework: ComplianceFramework;
  name: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  version: string;
  validFrom: Date;
  validUntil?: Date;
  uploadedAt: Date;
}

export interface ComplianceFrameworkStatus {
  framework: ComplianceFramework;
  status: ComplianceStatus;
  score: number;
  lastAssessment?: Date;
  nextAssessment?: Date;
  documents: ComplianceDocument[];
  requirements: {
    total: number;
    met: number;
    partial: number;
    notMet: number;
  };
}

export interface DataResidency {
  region: string;
  country: string;
  provider: string;
  certifications: string[];
}

export interface ComplianceDashboardData {
  frameworks: ComplianceFrameworkStatus[];
  dataResidency: DataResidency;
  lastUpdated: Date;
}

// ===========================================
// Security Score Types (Advanced Security)
// ===========================================

export interface SecurityScoreCategory {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  earnedPoints: number;
  items: SecurityScoreItem[];
}

export interface SecurityScoreItem {
  id: string;
  name: string;
  description: string;
  points: number;
  isEnabled: boolean;
  recommendation?: string;
  actionUrl?: string;
}

export interface SecurityScore {
  totalScore: number;
  maxScore: number;
  categories: SecurityScoreCategory[];
  recommendations: SecurityRecommendation[];
  lastCalculated: Date;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  points: number;
  actionUrl?: string;
  category: string;
}

// ===========================================
// Default Policies
// ===========================================

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: false,
  expiryDays: 0,
  preventReuse: 0,
};

export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  sessionTimeoutMinutes: 480,
  idleTimeoutMinutes: 30,
  maxConcurrentSessions: 0,
  rememberDeviceDays: 30,
};

export const DEFAULT_AUTH_POLICY: AuthenticationPolicy = {
  require2fa: 'none',
  ssoEnforcement: false,
  allowPasswordAuth: true,
  allowMagicLinkAuth: true,
};

// ===========================================
// Labels & Constants
// ===========================================

export const COMPLIANCE_FRAMEWORK_LABELS: Record<ComplianceFramework, { name: string; description: string }> = {
  soc2: {
    name: 'SOC 2 Type II',
    description: 'Security, availability, and confidentiality controls',
  },
  iso27001: {
    name: 'ISO 27001',
    description: 'Information security management system',
  },
  gdpr: {
    name: 'GDPR',
    description: 'EU General Data Protection Regulation',
  },
  hipaa: {
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
  },
};

export const LOGIN_STATUS_LABELS: Record<LoginStatus, { label: string; color: string }> = {
  success: { label: 'Success', color: '#10b981' },
  failed: { label: 'Failed', color: '#ef4444' },
  blocked: { label: 'Blocked', color: '#f59e0b' },
};

export const LOGIN_METHOD_LABELS: Record<LoginMethod, string> = {
  password: 'Password',
  sso: 'Single Sign-On',
  '2fa': 'Two-Factor Auth',
  api_key: 'API Key',
  magic_link: 'Magic Link',
};

// ===========================================
// Component Props for Security Section
// ===========================================

export interface TwoFactorSetupProps {
  status: TwoFactorStatus;
  onSetupComplete: () => void;
  onDisable: () => void;
}

export interface BackupCodesProps {
  codes: BackupCode[];
  onRegenerate: () => Promise<BackupCode[]>;
  onClose: () => void;
}

export interface SessionsListProps {
  sessions: UserSession[];
  onTerminate: (sessionId: string) => Promise<void>;
  onTerminateAllOthers: () => Promise<void>;
}

export interface ApiKeyManagerProps {
  keys: ApiKey[];
  onCreateKey: (data: CreateApiKeyData) => Promise<CreatedApiKeyResponse>;
  onRevokeKey: (keyId: string) => Promise<void>;
}

export interface ApiKeyCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApiKeyData) => Promise<CreatedApiKeyResponse>;
}

export interface DataExportProps {
  exports: DataExportRequest[];
  onRequestExport: (type: DataExportType, categories?: DataExportCategory[]) => Promise<void>;
}

export interface LoginHistoryProps {
  entries: LoginHistoryEntry[];
  filters: LoginHistoryFilters;
  isLoading: boolean;
  hasMore: boolean;
  onFiltersChange: (filters: LoginHistoryFilters) => void;
  onExport: () => Promise<void>;
  onLoadMore: () => Promise<void>;
}

export interface SecurityPoliciesProps {
  policies: SecurityPolicies;
  onUpdatePasswordPolicy: (policy: Partial<PasswordPolicy>) => Promise<void>;
  onUpdateSessionPolicy: (policy: Partial<SessionPolicy>) => Promise<void>;
  onUpdateAuthPolicy: (policy: Partial<AuthenticationPolicy>) => Promise<void>;
  isEnterprise: boolean;
}

export interface IPWhitelistProps {
  settings: IPWhitelistSettings;
  onModeChange: (mode: IPWhitelistMode) => Promise<void>;
  onAddEntry: (entry: Omit<IPWhitelistEntry, 'id' | 'teamId' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onRemoveEntry: (entryId: string) => Promise<void>;
  onToggleEntry: (entryId: string, isActive: boolean) => Promise<void>;
  onToggleAdminBypass: (enabled: boolean) => Promise<void>;
  isEnterprise: boolean;
}

export interface ComplianceDashboardProps {
  data: ComplianceDashboardData;
  onDownloadDocument: (documentId: string) => Promise<void>;
  isEnterprise: boolean;
}

export interface SecurityScoreProps {
  score: SecurityScore;
  onRefresh: () => Promise<void>;
}
