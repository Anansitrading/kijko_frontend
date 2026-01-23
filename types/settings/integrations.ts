// Integrations Types
// Sprint 6: Integrations

// Integration app categories
export type IntegrationCategory =
  | 'crm'
  | 'communication'
  | 'productivity'
  | 'analytics'
  | 'storage'
  | 'development';

// Integration provider identifiers
export type IntegrationProvider =
  // CRM
  | 'salesforce'
  | 'hubspot'
  | 'pipedrive'
  // Communication
  | 'slack'
  | 'microsoft-teams'
  | 'discord'
  // Productivity
  | 'google-workspace'
  | 'microsoft-365'
  | 'notion'
  // Analytics
  | 'google-analytics'
  | 'mixpanel'
  | 'amplitude'
  // Storage
  | 'google-drive'
  | 'dropbox'
  | 'onedrive'
  // Development
  | 'github'
  | 'gitlab'
  | 'jira';

// Integration app definition
export interface IntegrationApp {
  id: IntegrationProvider;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  permissions: string[];
  isPopular?: boolean;
}

// Connected integration status
export interface ConnectedIntegration {
  id: string;
  provider: IntegrationProvider;
  scopes: string[];
  connectedAt: Date;
  lastSyncAt?: Date;
  status: 'active' | 'error' | 'expired';
}

// Integration connection state
export type IntegrationConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Webhook event types
export type WebhookEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'context.created'
  | 'context.updated'
  | 'context.deleted'
  | 'user.login'
  | 'user.settings_changed'
  | 'export.completed';

// Webhook status
export type WebhookStatus = 'active' | 'paused';

// Webhook configuration
export interface Webhook {
  id: string;
  name: string;
  endpointUrl: string;
  secret: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

// Webhook delivery log entry
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  attemptNumber: number;
  status: 'success' | 'failed' | 'pending';
  createdAt: Date;
}

// Create webhook form data
export interface CreateWebhookData {
  name: string;
  endpointUrl: string;
  secret: string;
  events: WebhookEventType[];
}

// Available integrations by category
export const INTEGRATION_APPS: IntegrationApp[] = [
  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Sync leads and contacts with Salesforce CRM',
    icon: 'salesforce',
    permissions: ['read_contacts', 'write_contacts', 'read_leads', 'write_leads'],
    isPopular: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Connect with HubSpot CRM and marketing tools',
    icon: 'hubspot',
    permissions: ['read_contacts', 'write_contacts', 'read_deals'],
    isPopular: true,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'crm',
    description: 'Manage deals and contacts in Pipedrive',
    icon: 'pipedrive',
    permissions: ['read_deals', 'write_deals', 'read_contacts'],
  },
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Send notifications and updates to Slack channels',
    icon: 'slack',
    permissions: ['send_messages', 'read_channels'],
    isPopular: true,
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'communication',
    description: 'Integrate with Microsoft Teams for notifications',
    icon: 'microsoft-teams',
    permissions: ['send_messages', 'read_channels'],
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'communication',
    description: 'Send updates to Discord servers',
    icon: 'discord',
    permissions: ['send_messages', 'manage_webhooks'],
  },
  // Productivity
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'productivity',
    description: 'Connect with Google Docs, Sheets, and Calendar',
    icon: 'google',
    permissions: ['read_docs', 'write_docs', 'read_calendar'],
    isPopular: true,
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'productivity',
    description: 'Integrate with Microsoft Office apps',
    icon: 'microsoft',
    permissions: ['read_files', 'write_files', 'read_calendar'],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    description: 'Sync data with Notion workspaces',
    icon: 'notion',
    permissions: ['read_content', 'write_content'],
  },
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Track and analyze user behavior',
    icon: 'google-analytics',
    permissions: ['read_data', 'write_data'],
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'analytics',
    description: 'Product analytics and user tracking',
    icon: 'mixpanel',
    permissions: ['track_events', 'read_data'],
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    category: 'analytics',
    description: 'Behavioral analytics platform',
    icon: 'amplitude',
    permissions: ['track_events', 'read_data'],
  },
  // Storage
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'storage',
    description: 'Store and sync files with Google Drive',
    icon: 'google-drive',
    permissions: ['read_files', 'write_files', 'delete_files'],
    isPopular: true,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'storage',
    description: 'Sync files with Dropbox storage',
    icon: 'dropbox',
    permissions: ['read_files', 'write_files'],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'storage',
    description: 'Microsoft OneDrive file storage',
    icon: 'onedrive',
    permissions: ['read_files', 'write_files'],
  },
  // Development
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    description: 'Connect with GitHub repositories',
    icon: 'github',
    permissions: ['read_repos', 'write_repos', 'read_issues'],
    isPopular: true,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'development',
    description: 'Integrate with GitLab projects',
    icon: 'gitlab',
    permissions: ['read_repos', 'write_repos', 'read_issues'],
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'development',
    description: 'Sync with Jira project management',
    icon: 'jira',
    permissions: ['read_issues', 'write_issues', 'read_projects'],
  },
];

// Category labels
export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, string> = {
  crm: 'CRM',
  communication: 'Communication',
  productivity: 'Productivity',
  analytics: 'Analytics',
  storage: 'Storage',
  development: 'Development',
};

// Webhook event labels
export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'lead.created': 'Lead Created',
  'lead.updated': 'Lead Updated',
  'context.created': 'Context Created',
  'context.updated': 'Context Updated',
  'context.deleted': 'Context Deleted',
  'user.login': 'User Login',
  'user.settings_changed': 'User Settings Changed',
  'export.completed': 'Export Completed',
};

// Component Props for Integrations Section
export interface IntegrationSearchProps {
  searchQuery: string;
  selectedCategory: IntegrationCategory | 'all';
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: IntegrationCategory | 'all') => void;
}

export interface AppCardProps {
  app: IntegrationApp;
  isConnected: boolean;
  connectionStatus: IntegrationConnectionStatus;
  onConnect: (appId: IntegrationProvider) => void;
  onDisconnect: (appId: IntegrationProvider) => void;
  onManagePermissions: (appId: IntegrationProvider) => void;
}

export interface AppGridProps {
  apps: IntegrationApp[];
  connectedApps: ConnectedIntegration[];
  onConnect: (appId: IntegrationProvider) => void;
  onDisconnect: (appId: IntegrationProvider) => void;
  onManagePermissions: (appId: IntegrationProvider) => void;
}

export interface WebhookListProps {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
  onToggleStatus: (webhookId: string, status: WebhookStatus) => void;
  onTest: (webhookId: string) => void;
  onViewLogs: (webhookId: string) => void;
}

export interface WebhookFormProps {
  isOpen: boolean;
  webhook?: Webhook;
  onClose: () => void;
  onSubmit: (data: CreateWebhookData) => Promise<void>;
}

export interface WebhookLogsModalProps {
  isOpen: boolean;
  webhookId: string;
  deliveries: WebhookDelivery[];
  onClose: () => void;
  onRetry: (deliveryId: string) => Promise<void>;
}

export interface PermissionsModalProps {
  isOpen: boolean;
  app: IntegrationApp;
  connectedIntegration?: ConnectedIntegration;
  onClose: () => void;
  onRevokePermission: (permission: string) => Promise<void>;
  onDisconnect: () => void;
}
