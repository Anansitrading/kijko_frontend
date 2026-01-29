// Integration Detail Panel - Full-width panel for integration details
// Replaces the cards grid when an integration is selected
// Navigate between integrations using the sidebar

import { useState } from 'react';
import {
  X,
  Cloud,
  Link2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Shield,
  Zap,
  FolderSync,
  Clock,
  Search,
  FileText,
  Lock,
  Github,
  Slack,
  HardDrive,
  Network,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '../../../utils/cn';
import { INTEGRATION_APPS } from '../../../types/settings';
import type { IntegrationCardData } from '../../../types/settings';

// ─── Content Types ───────────────────────────────────────────────

interface PerformanceToolRow {
  tool: string;
  calls: number;
  latency: string;
  uptime: string;
}

interface IntegrationDetailContent {
  heroSubheader: string;
  heroBullets: string[];
  ctaText: string;
  whatItDoes: {
    intro: string;
    bullets: string[];
  };
  benefits: { title: string; description: string }[];
  steps: { title: string; description: string }[];
  performance?: {
    tools: PerformanceToolRow[];
    latencyData: { date: string; latency: number }[];
    uptimeData: { date: string; uptime: number }[];
  };
  usage?: {
    topClients: { name: string; sessions: number }[];
    dailySessions: { date: string; sessions: number }[];
  };
  requirements: {
    items: string[];
    security: string;
  };
  faq: { question: string; answer: string }[];
}

// ─── Content Data ───────────────────────────────────────────────

const INTEGRATION_CONTENT: Record<string, IntegrationDetailContent> = {
  'google-drive': {
    heroSubheader:
      'Connect Google Drive to Kijko and give your projects instant access to all your files.',
    heroBullets: [
      'Attach files directly to projects and contexts',
      'Automatic bi-directional sync between Kijko and Google Drive',
      'Search and find files instantly from the Kijko interface',
    ],
    ctaText: 'Activate Integration',
    whatItDoes: {
      intro:
        'The Google Drive integration seamlessly connects your cloud storage with your Kijko workspace.',
      bullets: [
        'Attach Google Drive files as context to projects inside Kijko',
        'Bi-directional sync: changes in Drive are automatically reflected in Kijko',
        'Search your entire Drive library from the Kijko search bar',
        'Share files with team members through shared project contexts',
      ],
    },
    benefits: [
      { title: 'Everything in one place', description: 'No more tab switching.' },
      { title: 'Real-time sync', description: 'Always work with the latest version.' },
      { title: 'Smart search', description: 'Find files by name, type, or content.' },
      { title: 'Secure sharing', description: 'Respects existing Drive permissions.' },
    ],
    steps: [
      { title: 'Select Google Drive', description: 'Click "Connect" on the Google Drive card.' },
      { title: 'Sign in with Google', description: 'Choose your Google account.' },
      { title: 'Choose your folders', description: 'Select which folders to make available.' },
      { title: 'Attach files', description: 'Add Drive files as context to projects.' },
    ],
    requirements: {
      items: [
        'A Google account (free or Workspace)',
        'Read access to the Drive files you want to connect',
        'No extra cost — included in every Kijko plan',
      ],
      security:
        'Kijko only requests the minimum required access permissions. Your files are never stored on Kijko servers.',
    },
    performance: {
      tools: [
        { tool: 'list_tasks', calls: 805, latency: '1.6s', uptime: '81.6%' },
        { tool: 'list_task_lists', calls: 200, latency: '1.5s', uptime: '84.0%' },
        { tool: 'batch_get', calls: 181, latency: '2.9s', uptime: '61.9%' },
        { tool: 'batch_update', calls: 155, latency: '2.9s', uptime: '78.7%' },
        { tool: 'lookup_spreadsheet...', calls: 128, latency: '2.7s', uptime: '71.1%' },
        { tool: 'download_file', calls: 112, latency: '3.0s', uptime: '70.5%' },
        { tool: 'insert_task', calls: 80, latency: '2.0s', uptime: '78.7%' },
        { tool: 'find_file', calls: 74, latency: '1.6s', uptime: '68.9%' },
        { tool: 'fetch_emails', calls: 71, latency: '2.0s', uptime: '46.5%' },
      ],
      latencyData: [
        { date: 'Jan 22', latency: 1.9 },
        { date: 'Jan 23', latency: 1.7 },
        { date: 'Jan 24', latency: 1.5 },
        { date: 'Jan 25', latency: 1.3 },
        { date: 'Jan 26', latency: 2.6 },
        { date: 'Jan 28', latency: 1.9 },
        { date: 'Jan 29', latency: 1.9 },
      ],
      uptimeData: [
        { date: 'Jan 22', uptime: 99.1 },
        { date: 'Jan 23', uptime: 99.5 },
        { date: 'Jan 24', uptime: 98.8 },
        { date: 'Jan 25', uptime: 99.9 },
        { date: 'Jan 26', uptime: 99.7 },
        { date: 'Jan 28', uptime: 99.2 },
        { date: 'Jan 29', uptime: 99.6 },
      ],
    },
    usage: {
      topClients: [
        { name: 'Claude.ai', sessions: 1420 },
        { name: 'Claude Code', sessions: 781 },
        { name: 'Cursor', sessions: 109 },
        { name: 'Smithery', sessions: 76 },
        { name: 'MCP Remote Test', sessions: 68 },
      ],
      dailySessions: [
        { date: 'Jan 22', sessions: 210 },
        { date: 'Jan 23', sessions: 320 },
        { date: 'Jan 24', sessions: 480 },
        { date: 'Jan 25', sessions: 290 },
        { date: 'Jan 26', sessions: 250 },
        { date: 'Jan 27', sessions: 310 },
        { date: 'Jan 28', sessions: 890 },
        { date: 'Jan 29', sessions: 280 },
      ],
    },
    faq: [
      {
        question: 'How often are files synchronized?',
        answer: 'Files are synchronized in real time via the Google Drive API.',
      },
      {
        question: 'Can I disconnect the integration?',
        answer: 'Yes, go to My Integrations and click "Disconnect".',
      },
    ],
  },
  // Default content for integrations without specific content
  default: {
    heroSubheader: 'Connect this integration to enhance your Kijko workspace.',
    heroBullets: [
      'Seamless integration with your workflow',
      'Automatic synchronization',
      'Easy to set up and manage',
    ],
    ctaText: 'Connect',
    whatItDoes: {
      intro: 'This integration connects external services with your Kijko workspace.',
      bullets: [
        'Access external data directly in Kijko',
        'Automatic synchronization keeps everything up to date',
        'Manage everything from a single interface',
      ],
    },
    benefits: [
      { title: 'Streamlined workflow', description: 'Work more efficiently.' },
      { title: 'Always synced', description: 'Real-time updates.' },
      { title: 'Easy setup', description: 'Connect in minutes.' },
    ],
    steps: [
      { title: 'Click Connect', description: 'Start the connection process.' },
      { title: 'Authorize', description: 'Grant the necessary permissions.' },
      { title: 'Configure', description: 'Set up your preferences.' },
      { title: 'Start using', description: 'Your integration is ready.' },
    ],
    requirements: {
      items: ['An account with the service', 'Required permissions'],
      security: 'Your data is handled securely with minimal required permissions.',
    },
    faq: [
      { question: 'Is my data secure?', answer: 'Yes, we use industry-standard security practices.' },
    ],
  },
};

// ─── Icon Helper ─────────────────────────────────────────────────

function getIntegrationIcon(iconName: string, className = 'w-8 h-8') {
  switch (iconName) {
    case 'kijko-file-storage':
      return <HardDrive className={className} />;
    case 'kijko-knowledge-graph':
      return <Network className={className} />;
    case 'github':
      return <Github className={className} />;
    case 'slack':
      return <Slack className={className} />;
    case 'zap':
    case 'custom':
      return <Zap className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

// ─── Benefit Icon Map ────────────────────────────────────────────

const BENEFIT_ICONS = [FolderSync, Clock, Search, Shield, Zap];

// ─── Custom Chart Tooltip ────────────────────────────────────────

function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-medium">
        {payload[0].value}
        {suffix}
      </p>
    </div>
  );
}

// ─── Performance Tab Toggle ──────────────────────────────────────

function PerformanceTabs({
  active,
  onChange,
}: {
  active: 'latency' | 'uptime';
  onChange: (tab: 'latency' | 'uptime') => void;
}) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-md w-fit">
      {(['latency', 'uptime'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded transition-all capitalize',
            active === tab
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab === 'latency' ? 'Latency' : 'Uptime'}
        </button>
      ))}
    </div>
  );
}

// ─── FAQ Accordion Item ──────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-2">{question}</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-3 text-sm text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <div className="pt-0.5">
        <h4 className="text-sm font-medium text-foreground mb-0.5">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Disconnect Confirm Popover ─────────────────────────────────

function DisconnectConfirmPopover({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to close on click outside */}
      <div className="fixed inset-0 z-40" onClick={onCancel} />

      {/* Popover */}
      <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-xl p-4 min-w-[220px]">
        <p className="text-sm text-foreground mb-3">
          Are you sure you want to disconnect?
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium rounded-md transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-md border border-border transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Props ───────────────────────────────────────────────────────

interface IntegrationDetailPanelProps {
  integration: IntegrationCardData | null;
  onClose: () => void;
  onConnect?: (id: string) => void;
  onDisconnect?: (id: string) => void;
  onReconnect?: (id: string) => void;
}


// ─── Main Component ──────────────────────────────────────────────

export function IntegrationDetailPanel({
  integration,
  onClose,
  onConnect,
  onDisconnect,
  onReconnect,
}: IntegrationDetailPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [perfTab, setPerfTab] = useState<'latency' | 'uptime'>('latency');

  if (!integration) return null;

  // Find the app data from INTEGRATION_APPS
  const app = INTEGRATION_APPS.find((a) => a.id === integration.id);
  const content = INTEGRATION_CONTENT[integration.id] || INTEGRATION_CONTENT['default'];

  const handleConnect = async () => {
    if (!onConnect) return;
    setIsConnecting(true);
    try {
      await onConnect(integration.id);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full bg-background/50">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card/30">
        <div className="flex items-center gap-4 min-w-0">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="shrink-0 p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Back to overview"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            {integration.iconUrl ? (
              <img
                src={integration.iconUrl}
                alt={integration.name}
                className="w-7 h-7 object-contain"
              />
            ) : (
              getIntegrationIcon(integration.icon, 'w-6 h-6 text-muted-foreground')
            )}
          </div>
          <div className="min-w-0 flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{integration.name}</h2>
              <span className="text-sm text-muted-foreground capitalize">{integration.category}</span>
            </div>
            {/* Status badges next to title */}
            {integration.isConnected && (
              <span
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  integration.connectionStatus === 'warning'
                    ? 'bg-amber-500/20 text-amber-500'
                    : integration.connectionStatus === 'default'
                      ? 'bg-orange-500/20 text-orange-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                )}
              >
                {integration.connectionStatus === 'warning'
                  ? 'Needs Attention'
                  : integration.connectionStatus === 'default'
                    ? 'Default'
                    : 'Connected'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Action Button in Header */}
          {!integration.isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  {content.ctaText}
                </>
              )}
            </button>
          ) : integration.connectionStatus === 'warning' ? (
            <button
              onClick={() => onReconnect?.(integration.id)}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-amber-500/20 transition-all"
            >
              <Link2 className="w-4 h-4" />
              Reconnect
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg border border-border transition-colors"
              >
                Disconnect
              </button>
              <DisconnectConfirmPopover
                isOpen={showDisconnectConfirm}
                onConfirm={() => {
                  setShowDisconnectConfirm(false);
                  onDisconnect?.(integration.id);
                }}
                onCancel={() => setShowDisconnectConfirm(false)}
              />
            </div>
          )}
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          {/* Hero Section */}
          <div>
            {(integration.isPopular || integration.isCustom) && (
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {integration.isPopular && (
                  <span className="text-sm px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">
                    Popular
                  </span>
                )}
                {integration.isCustom && (
                  <span className="text-sm px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full font-medium">
                    Custom
                  </span>
                )}
              </div>
            )}

            <p className="text-base text-muted-foreground mb-5">{content.heroSubheader}</p>

            <ul className="space-y-3">
              {content.heroBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What It Does */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">What it does</h3>
            <div className="bg-card/50 border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-4">{content.whatItDoes.intro}</p>
              <ul className="space-y-3">
                {content.whatItDoes.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-sm text-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Benefits */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Key Benefits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.benefits.map((benefit, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
                return (
                  <div
                    key={i}
                    className="bg-card/50 border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon size={16} className="text-primary" />
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">How It Works</h3>
            <div className="bg-card/50 border border-border rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.steps.map((step, i) => (
                  <StepCard
                    key={i}
                    number={i + 1}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Performance */}
          {content.performance && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-primary" />
                <h3 className="text-base font-semibold text-foreground">Performance</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tools Table */}
                <div className="bg-card/50 border border-border rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="text-left pb-2 font-medium">Tool</th>
                        <th className="text-right pb-2 font-medium">Calls</th>
                        <th className="text-right pb-2 font-medium">Latency</th>
                        <th className="text-right pb-2 font-medium">Uptime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {content.performance.tools.map((row) => (
                        <tr key={row.tool} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 text-primary font-medium text-xs">{row.tool}</td>
                          <td className="py-2 text-right text-foreground tabular-nums text-xs">
                            {row.calls.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-foreground tabular-nums text-xs">
                            {row.latency}
                          </td>
                          <td className="py-2 text-right text-foreground tabular-nums text-xs">
                            {row.uptime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border text-xs text-muted-foreground">
                        <td className="pt-2 font-semibold text-foreground">
                          {content.performance.tools.reduce((sum, t) => sum + t.calls, 0).toLocaleString()}
                        </td>
                        <td className="pt-2 text-right font-semibold text-foreground tabular-nums">
                          {(content.performance.tools.reduce((sum, t) => sum + parseFloat(t.latency), 0) / content.performance.tools.length).toFixed(1)}s
                        </td>
                        <td className="pt-2 text-right tabular-nums">
                          {(content.performance.tools.reduce((sum, t) => sum + parseFloat(t.uptime), 0) / content.performance.tools.length).toFixed(1)}%
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Latency / Uptime Chart */}
                <div className="bg-card/50 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <PerformanceTabs active={perfTab} onChange={setPerfTab} />
                    <span className="text-xs text-muted-foreground">{content.performance.tools[0]?.tool}</span>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={
                          perfTab === 'latency'
                            ? content.performance.latencyData
                            : content.performance.uptimeData
                        }
                      >
                        <defs>
                          <linearGradient id="perfGradientPanel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          domain={perfTab === 'uptime' ? [97, 100] : ['auto', 'auto']}
                          tickFormatter={(v: number) =>
                            perfTab === 'uptime' ? `${v}%` : `${v}s`
                          }
                          width={40}
                        />
                        <Tooltip
                          content={
                            <ChartTooltip suffix={perfTab === 'uptime' ? '%' : 's'} />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey={perfTab}
                          stroke="#f97316"
                          strokeWidth={2}
                          fill="url(#perfGradientPanel)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage */}
          {content.usage && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-primary" />
                <h3 className="text-base font-semibold text-foreground">Usage</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Clients */}
                <div className="bg-card/50 border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Top Clients</h4>
                  <div className="space-y-2.5">
                    {content.usage.topClients.map((client, i) => {
                      const maxSessions = Math.max(...content.usage!.topClients.map((c) => c.sessions));
                      return (
                        <div key={client.name} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4 tabular-nums">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground truncate">
                                {client.name}
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums ml-2">
                                {client.sessions.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${(client.sessions / maxSessions) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border flex justify-between">
                    <span className="text-xs font-medium text-foreground">Total</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {content.usage.topClients.reduce((sum, c) => sum + c.sessions, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Daily Sessions Chart */}
                <div className="bg-card/50 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Daily Sessions</h4>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={content.usage.dailySessions}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip content={<ChartTooltip suffix="" />} />
                        <Bar
                          dataKey="sessions"
                          fill="#f97316"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Requirements & Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Requirements */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Requirements</h3>
              <div className="bg-card/50 border border-border rounded-xl p-5 space-y-4 h-full">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">What you need</span>
                  </div>
                  <ul className="space-y-2">
                    {content.requirements.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Security</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{content.requirements.security}</p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {app?.permissions && app.permissions.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">Permissions</h3>
                <div className="bg-card/50 border border-border rounded-xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Required access</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-sm px-3 py-1.5 bg-muted text-muted-foreground rounded-lg border border-border"
                      >
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQ */}
          {content.faq.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {content.faq.map((item, i) => (
                  <FaqItem key={i} question={item.question} answer={item.answer} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IntegrationDetailPanel;
