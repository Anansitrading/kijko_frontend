// Integrations Tab - Dashboard Tab Component
// Redesigned with sub-tab navigation, custom connectors, and improved filtering
// Task 1_4: Integrations Tab Migration + Redesign

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  IntegrationCard,
  CustomConnectorModal,
  EmptyState,
  FilterSidebar,
  DEFAULT_SIDEBAR_FILTERS,
} from './integrations';
import type { SidebarFilters } from './integrations';
import { WebhookList } from '../Settings/Integrations/WebhookList';
import { WebhookForm } from '../Settings/Integrations/WebhookForm';
import type {
  IntegrationProvider,
  ConnectedIntegration,
  Webhook,
  CreateWebhookData,
  WebhookStatus,
  IntegrationsSubTab,
  IntegrationsFilterState,
  IntegrationCardData,
  CustomConnector,
  CreateCustomConnectorData,
} from '../../types/settings';
import { INTEGRATION_APPS } from '../../types/settings';

// Sub-tab configuration
const SUB_TABS: { id: IntegrationsSubTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'my-integrations', label: 'My Integrations' },
  { id: 'custom-connectors', label: 'Custom Connectors' },
];

// Sort options
const SORT_OPTIONS: { id: IntegrationsFilterState['sortBy']; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'popular', label: 'Popular' },
  { id: 'name', label: 'Name' },
];

// Default filter state
const DEFAULT_FILTERS: IntegrationsFilterState = {
  search: '',
  category: 'all',
  statusFilter: 'all',
  sortBy: 'popular',
  showConnectedOnly: false,
};

export function IntegrationsTab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-tab from URL
  const activeTab = (searchParams.get('subtab') as IntegrationsSubTab) || 'all';
  const setActiveTab = useCallback(
    (tab: IntegrationsSubTab) => {
      setSearchParams((prev) => {
        prev.set('subtab', tab);
        return prev;
      });
    },
    [setSearchParams]
  );

  // Filter state
  const [filters, setFilters] = useState<IntegrationsFilterState>(DEFAULT_FILTERS);

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Current sort label
  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === filters.sortBy)?.label || 'Sort';

  // Connected apps state (mock data - replace with actual API calls)
  const [connectedApps, setConnectedApps] = useState<ConnectedIntegration[]>([
    {
      id: '0',
      provider: 'kijko-file-storage',
      scopes: ['read_files', 'write_files', 'delete_files', 'manage_folders'],
      connectedAt: new Date('2024-01-01'),
      lastSyncAt: new Date(),
      status: 'active',
    },
    {
      id: '0b',
      provider: 'kijko-knowledge-graph',
      scopes: ['read_graph', 'write_graph', 'manage_entities', 'manage_relations'],
      connectedAt: new Date('2024-01-01'),
      lastSyncAt: new Date(),
      status: 'active',
    },
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
    {
      id: '3',
      provider: 'hubspot',
      scopes: ['read_contacts', 'write_contacts'],
      connectedAt: new Date('2024-01-05'),
      status: 'error',
    },
  ]);

  // Custom connectors state (mock data)
  const [customConnectors, setCustomConnectors] = useState<CustomConnector[]>([
    {
      id: 'custom-1',
      name: 'Internal CRM',
      description: 'Custom connector to internal CRM system',
      remoteMcpServerUrl: 'https://api.internal.com/mcp',
      category: 'crm',
      authType: 'api_key',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
      status: 'active',
    },
  ]);

  // Webhooks state (mock data)
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

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(DEFAULT_SIDEBAR_FILTERS);

  // Modal states
  const [isCustomConnectorModalOpen, setIsCustomConnectorModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<CustomConnector | undefined>();
  const [isWebhookFormOpen, setIsWebhookFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | undefined>();

  // Reset filters when changing tabs
  useEffect(() => {
    setFilters(DEFAULT_FILTERS);
    setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
  }, [activeTab]);

  // Transform pre-built apps to unified card data
  const transformAppToCardData = useCallback(
    (app: (typeof INTEGRATION_APPS)[0]): IntegrationCardData => {
      const connection = connectedApps.find((c) => c.provider === app.id);
      return {
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        icon: app.icon,
        isPopular: app.isPopular,
        isConnected: !!connection,
        connectionStatus: connection
          ? connection.status === 'error'
            ? 'warning'
            : app.id.startsWith('kijko-')
              ? 'default'
              : 'connected'
          : undefined,
        lastSynced: connection?.lastSyncAt,
        permissions: app.permissions,
        isCustom: false,
      };
    },
    [connectedApps]
  );

  // Transform custom connector to unified card data
  const transformConnectorToCardData = useCallback(
    (connector: CustomConnector): IntegrationCardData => ({
      id: connector.id,
      name: connector.name,
      description: connector.description || 'Custom MCP server integration',
      category: connector.category,
      icon: 'custom',
      iconUrl: connector.iconUrl,
      isConnected: connector.status === 'active',
      connectionStatus:
        connector.status === 'active'
          ? 'connected'
          : connector.status === 'error'
            ? 'disconnected'
            : 'warning',
      lastSynced: connector.lastUsedAt,
      isCustom: true,
    }),
    []
  );

  // Filter and sort integrations
  const filteredIntegrations = useMemo(() => {
    let items: IntegrationCardData[] = [];

    // Get items based on active tab
    if (activeTab === 'all') {
      items = [
        ...INTEGRATION_APPS.map(transformAppToCardData),
        ...customConnectors.map(transformConnectorToCardData),
      ];
    } else if (activeTab === 'my-integrations') {
      // Only show connected integrations
      const connectedAppIds = connectedApps.map((c) => c.provider);
      items = [
        ...INTEGRATION_APPS.filter((app) => connectedAppIds.includes(app.id)).map(
          transformAppToCardData
        ),
        ...customConnectors
          .filter((c) => c.status === 'active')
          .map(transformConnectorToCardData),
      ];
    } else if (activeTab === 'custom-connectors') {
      items = customConnectors.map(transformConnectorToCardData);
    }

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category !== 'all') {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters.showConnectedOnly) {
      items = items.filter((item) => item.isConnected);
    }

    if (activeTab === 'my-integrations' && filters.statusFilter !== 'all') {
      items = items.filter((item) => {
        if (filters.statusFilter === 'connected') {
          return item.connectionStatus === 'connected';
        }
        return item.connectionStatus === 'warning' || item.connectionStatus === 'disconnected';
      });
    }

    // Apply sidebar filters
    if (sidebarFilters.selectedCategories.length > 0) {
      items = items.filter(
        (item) =>
          item.category !== 'custom' &&
          sidebarFilters.selectedCategories.includes(item.category)
      );
    }

    if (sidebarFilters.selectedStatuses.length > 0) {
      items = items.filter((item) => {
        if (!item.isConnected && !item.connectionStatus) {
          // Unconnected items: show only if 'disconnected' is selected
          return sidebarFilters.selectedStatuses.includes('disconnected');
        }
        return (
          item.connectionStatus &&
          sidebarFilters.selectedStatuses.includes(item.connectionStatus)
        );
      });
    }

    if (sidebarFilters.selectedTypes.length > 0) {
      items = items.filter((item) => {
        if (item.isCustom) return sidebarFilters.selectedTypes.includes('custom');
        return sidebarFilters.selectedTypes.includes('pre-built');
      });
    }

    // Apply sorting
    return items.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.name.localeCompare(b.name);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          // Custom connectors first, then by name
          if (a.isCustom && !b.isCustom) return -1;
          if (!a.isCustom && b.isCustom) return 1;
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [
    activeTab,
    filters,
    sidebarFilters,
    connectedApps,
    customConnectors,
    transformAppToCardData,
    transformConnectorToCardData,
  ]);

  // Handlers for connected apps
  const handleConnect = async (id: string) => {
    console.log('Connecting to:', id);
    const app = INTEGRATION_APPS.find((a) => a.id === id);
    if (app) {
      const newConnection: ConnectedIntegration = {
        id: Date.now().toString(),
        provider: id as IntegrationProvider,
        scopes: app.permissions,
        connectedAt: new Date(),
        status: 'active',
      };
      setConnectedApps((prev) => [...prev, newConnection]);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (window.confirm('Are you sure you want to disconnect this integration?')) {
      setConnectedApps((prev) => prev.filter((c) => c.provider !== id));
    }
  };

  const handleManage = (id: string) => {
    console.log('Managing:', id);
    // TODO: Open management modal
  };

  const handleViewLogs = (id: string) => {
    console.log('Viewing logs for:', id);
    // TODO: Open logs modal
  };

  const handleReconnect = async (id: string) => {
    console.log('Reconnecting:', id);
    // Update the connection status
    setConnectedApps((prev) =>
      prev.map((c) =>
        c.provider === id ? { ...c, status: 'active', lastSyncAt: new Date() } : c
      )
    );
  };

  // Handlers for custom connectors
  const handleCreateCustomConnector = async (data: CreateCustomConnectorData) => {
    const newConnector: CustomConnector = {
      id: `custom-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };
    setCustomConnectors((prev) => [...prev, newConnector]);
  };

  const handleUpdateCustomConnector = async (data: CreateCustomConnectorData) => {
    if (!editingConnector) return;
    setCustomConnectors((prev) =>
      prev.map((c) =>
        c.id === editingConnector.id ? { ...c, ...data, updatedAt: new Date() } : c
      )
    );
    setEditingConnector(undefined);
  };

  const handleDeleteCustomConnector = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom connector?')) {
      setCustomConnectors((prev) => prev.filter((c) => c.id !== id));
    }
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
      prev.map((w) => (w.id === editingWebhook.id ? { ...w, ...data } : w))
    );
    setEditingWebhook(undefined);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    }
  };

  const handleToggleWebhookStatus = async (webhookId: string, status: WebhookStatus) => {
    setWebhooks((prev) => prev.map((w) => (w.id === webhookId ? { ...w, status } : w)));
  };

  const handleTestWebhook = async (webhookId: string) => {
    console.log('Testing webhook:', webhookId);
    alert('Test payload sent! Check your endpoint for the delivery.');
  };

  const handleViewWebhookLogs = (webhookId: string) => {
    console.log('Viewing logs for webhook:', webhookId);
  };

  // Determine if we should show empty states
  const showEmptyState =
    filteredIntegrations.length === 0 &&
    !filters.search &&
    (activeTab === 'my-integrations' || activeTab === 'custom-connectors');

  return (
    <div
      role="tabpanel"
      id="tabpanel-integrations"
      aria-labelledby="tab-integrations"
      className="flex flex-col h-full"
    >
      {/* Controls Bar - with border like Projects */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Sub-Tab Navigation - Pill style */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64 hidden md:block">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search integrations..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-muted/50 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{currentSortLabel}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'transition-transform',
                    isSortDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setFilters({ ...filters, sortBy: option.id });
                          setIsSortDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left transition-colors',
                          filters.sortBy === option.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setEditingConnector(undefined);
                setIsCustomConnectorModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={18} />
              <span>Custom Connector</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <FilterSidebar filters={sidebarFilters} onFiltersChange={setSidebarFilters} />

          {/* Content */}
          <div className="flex-1 min-w-0">
        {/* Content based on active tab */}
        {showEmptyState ? (
          <EmptyState
            variant={activeTab === 'my-integrations' ? 'no-integrations' : 'no-custom'}
            onAction={() => {
              if (activeTab === 'my-integrations') {
                setActiveTab('all');
              } else {
                setIsCustomConnectorModalOpen(true);
              }
            }}
          />
        ) : filteredIntegrations.length === 0 && filters.search ? (
          <EmptyState
            variant="no-results"
            searchQuery={filters.search}
            onAction={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : (
          <div className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          )}>
            {/* Integration Cards */}
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                viewMode={viewMode}
                onConnect={handleConnect}
                onDisconnect={
                  integration.isCustom
                    ? () => handleDeleteCustomConnector(integration.id)
                    : handleDisconnect
                }
                onManage={handleManage}
                onViewLogs={handleViewLogs}
                onReconnect={handleReconnect}
                onCardClick={(id) => navigate(`/integration/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Webhooks Section (only in My Integrations tab) */}
        {activeTab === 'my-integrations' && (
          <>
            <div className="border-t border-border pt-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time notifications when events occur in your account.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingWebhook(undefined);
                    setIsWebhookFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-muted text-secondary-foreground text-sm font-medium rounded-lg border border-border transition-colors"
                >
                  <Plus size={16} />
                  Add Webhook
                </button>
              </div>

              <WebhookList
                webhooks={webhooks}
                onEdit={handleEditWebhook}
                onDelete={handleDeleteWebhook}
                onToggleStatus={handleToggleWebhookStatus}
                onTest={handleTestWebhook}
                onViewLogs={handleViewWebhookLogs}
              />
            </div>
          </>
        )}
          </div>
        </div>
      </main>

      {/* Custom Connector Modal */}
      <CustomConnectorModal
        isOpen={isCustomConnectorModalOpen}
        connector={editingConnector}
        onClose={() => {
          setIsCustomConnectorModalOpen(false);
          setEditingConnector(undefined);
        }}
        onSubmit={editingConnector ? handleUpdateCustomConnector : handleCreateCustomConnector}
      />

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

export default IntegrationsTab;
