// Integrations Section - Main Entry Point
// Setting Sprint 6: Integrations

export { IntegrationSearch } from './IntegrationSearch';
export { AppCard } from './AppCard';
export { AppGrid } from './AppGrid';
export { WebhookForm } from './WebhookForm';
export { WebhookList } from './WebhookList';

// IntegrationsSection - Main section component that combines all integrations features
import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { IntegrationSearch } from './IntegrationSearch';
import { AppGrid } from './AppGrid';
import { WebhookList } from './WebhookList';
import { WebhookForm } from './WebhookForm';
import { SettingsSection } from '../SettingsSection';
import { tw } from '../../../styles/settings';
import type {
  IntegrationCategory,
  IntegrationProvider,
  ConnectedIntegration,
  Webhook,
  CreateWebhookData,
  WebhookStatus,
} from '../../../types/settings';
import { INTEGRATION_APPS } from '../../../types/settings';

export function IntegrationsSection() {
  const { state } = useSettings();

  // Only render when integrations section is active
  if (state.activeSection !== 'integrations') {
    return null;
  }
  // Connected apps state (mock data - replace with actual API calls)
  const [connectedApps, setConnectedApps] = useState<ConnectedIntegration[]>([
    {
      id: '1',
      provider: 'slack',
      scopes: ['send_messages', 'read_channels'],
      connectedAt: new Date('2024-01-15'),
      lastSyncAt: new Date('2024-01-20'),
      status: 'active',
    },
    {
      id: '2',
      provider: 'github',
      scopes: ['read_repos', 'write_repos'],
      connectedAt: new Date('2024-01-10'),
      status: 'active',
    },
  ]);

  // Webhooks state (mock data - replace with actual API calls)
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Lead Notifications',
      endpointUrl: 'https://example.com/webhooks/leads',
      secret: 'whsec_xxxxxxxxxxxxx',
      events: ['lead.created', 'lead.updated'],
      status: 'active',
      createdAt: new Date('2024-01-05'),
      lastTriggeredAt: new Date('2024-01-19'),
    },
  ]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');

  // Webhook form state
  const [isWebhookFormOpen, setIsWebhookFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | undefined>();

  // Filter apps based on search and category
  const filteredApps = useMemo(() => {
    return INTEGRATION_APPS.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || app.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Handlers for connected apps
  const handleConnect = async (appId: IntegrationProvider) => {
    // Simulate OAuth flow - in real app, open OAuth popup
    console.log('Connecting to:', appId);

    // Mock successful connection
    const app = INTEGRATION_APPS.find((a) => a.id === appId);
    if (app) {
      const newConnection: ConnectedIntegration = {
        id: Date.now().toString(),
        provider: appId,
        scopes: app.permissions,
        connectedAt: new Date(),
        status: 'active',
      };
      setConnectedApps((prev) => [...prev, newConnection]);
    }
  };

  const handleDisconnect = async (appId: IntegrationProvider) => {
    // Confirm and disconnect
    if (window.confirm(`Are you sure you want to disconnect ${appId}? This will revoke all access.`)) {
      setConnectedApps((prev) => prev.filter((c) => c.provider !== appId));
    }
  };

  const handleManagePermissions = (appId: IntegrationProvider) => {
    // Open permissions modal
    console.log('Managing permissions for:', appId);
  };

  // Handlers for webhooks
  const handleCreateWebhook = async (data: CreateWebhookData) => {
    const newWebhook: Webhook = {
      id: Date.now().toString(),
      ...data,
      status: 'active',
      createdAt: new Date(),
    };
    setWebhooks((prev) => [...prev, newWebhook]);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsWebhookFormOpen(true);
  };

  const handleUpdateWebhook = async (data: CreateWebhookData) => {
    if (!editingWebhook) return;

    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === editingWebhook.id
          ? { ...w, ...data }
          : w
      )
    );
    setEditingWebhook(undefined);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    }
  };

  const handleToggleWebhookStatus = async (webhookId: string, status: WebhookStatus) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === webhookId ? { ...w, status } : w
      )
    );
  };

  const handleTestWebhook = async (webhookId: string) => {
    // Send test payload
    console.log('Testing webhook:', webhookId);
    alert('Test payload sent! Check your endpoint for the delivery.');
  };

  const handleViewWebhookLogs = (webhookId: string) => {
    // Open logs modal
    console.log('Viewing logs for webhook:', webhookId);
  };

  return (
    <div className="space-y-8">
      {/* Connected Apps Section */}
      <SettingsSection
        title="Connected Apps"
        description="Connect third-party apps to extend functionality and sync data."
      >
        {/* Search and Filter */}
        <IntegrationSearch
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
        />

        {/* App Grid */}
        <AppGrid
          apps={filteredApps}
          connectedApps={connectedApps}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onManagePermissions={handleManagePermissions}
        />
      </SettingsSection>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Webhooks Section */}
      <SettingsSection
        title="Webhooks"
        description="Receive real-time notifications when events occur in your account."
      >
        {/* Add webhook button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setEditingWebhook(undefined);
              setIsWebhookFormOpen(true);
            }}
            className={`${tw.buttonPrimary} flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {/* Webhook List */}
        <WebhookList
          webhooks={webhooks}
          onEdit={handleEditWebhook}
          onDelete={handleDeleteWebhook}
          onToggleStatus={handleToggleWebhookStatus}
          onTest={handleTestWebhook}
          onViewLogs={handleViewWebhookLogs}
        />
      </SettingsSection>

      {/* Webhook Form Modal */}
      <WebhookForm
        isOpen={isWebhookFormOpen}
        webhook={editingWebhook}
        onClose={() => {
          setIsWebhookFormOpen(false);
          setEditingWebhook(undefined);
        }}
        onSubmit={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}
      />
    </div>
  );
}

export default IntegrationsSection;
