// Integration Detail Page - One-pager for individual integrations
// Shows hero, features, benefits, steps, performance, usage, requirements, and FAQ

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Cloud,
  Link2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Shield,
  Zap,
  FolderSync,
  Clock,
  Search,
  FileText,
  Lock,
  Github,
  Slack,
  Activity,
  BarChart3,
  Settings,
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
import { DashboardTabs } from '../DashboardTabs';
import { UserAvatar } from '../UserAvatar';
import { UserDropdown } from '../UserDropdown';
import { SettingsModal } from '../../SettingsModal';
import { MyProfileModal } from '../../Profile/MyProfileModal';
import type { DashboardTabType } from '../../../hooks/useTabNavigation';

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
  performance: {
    tools: PerformanceToolRow[];
    latencyData: { date: string; latency: number }[];
    uptimeData: { date: string; uptime: number }[];
  };
  usage: {
    topClients: { name: string; sessions: number }[];
    dailySessions: { date: string; sessions: number }[];
  };
  requirements: {
    items: string[];
    security: string;
  };
  faq: { question: string; answer: string }[];
}

// ─── Google Drive Content (EN) ───────────────────────────────────

const INTEGRATION_CONTENT: Record<string, IntegrationDetailContent> = {
  'google-drive': {
    heroSubheader:
      'Connect Google Drive to Kijko and give your projects instant access to all your files. Upload, share, and collaborate from a single workspace.',
    heroBullets: [
      'Attach files directly to projects and contexts',
      'Automatic bi-directional sync between Kijko and Google Drive',
      'Search and find files instantly from the Kijko interface',
    ],
    ctaText: 'Activate Integration',
    whatItDoes: {
      intro:
        'The Google Drive integration seamlessly connects your cloud storage with your Kijko workspace. Work more efficiently without constantly switching between apps.',
      bullets: [
        'Attach Google Drive files as context to projects inside Kijko',
        'Bi-directional sync: changes in Drive are automatically reflected in Kijko',
        'Search your entire Drive library from the Kijko search bar',
        'Share files with team members through shared project contexts',
        'Automatically export reports and generated documents to a Drive folder',
      ],
    },
    benefits: [
      {
        title: 'Everything in one place',
        description:
          'No more tab switching. View and manage your Drive files directly inside your Kijko projects.',
      },
      {
        title: 'Real-time sync',
        description:
          'Changes in Google Drive are reflected in real time. You always work with the latest version.',
      },
      {
        title: 'Smart search',
        description:
          'Search your entire Drive from within Kijko. Find files by name, type, or content in seconds.',
      },
      {
        title: 'Secure sharing',
        description:
          'Share files via projects without configuring extra permissions. Kijko respects existing Drive permissions.',
      },
      {
        title: 'Less manual work',
        description:
          'Automatic exports and file attachments save you repetitive copy-paste work every day.',
      },
    ],
    steps: [
      {
        title: 'Select Google Drive',
        description:
          'Go to the Integrations tab in Kijko and click "Connect" on the Google Drive card.',
      },
      {
        title: 'Sign in with Google',
        description:
          'Choose the Google account you want to connect and grant Kijko access to your Drive files.',
      },
      {
        title: 'Choose your folders',
        description:
          'Select which Drive folders you want to make available inside Kijko. You can adjust this later.',
      },
      {
        title: 'Attach files to projects',
        description:
          'Open a project and add Drive files as context. They are instantly searchable and available.',
      },
    ],
    performance: {
      tools: [
        { tool: 'file-sync', calls: 3_487, latency: '1.8s', uptime: '99.2%' },
        { tool: 'file-search', calls: 1_256, latency: '0.9s', uptime: '99.8%' },
        { tool: 'file-export', calls: 412, latency: '2.4s', uptime: '98.5%' },
        { tool: 'metadata-read', calls: 8_921, latency: '0.3s', uptime: '99.9%' },
      ],
      latencyData: [
        { date: 'Jan 19', latency: 1.9 },
        { date: 'Jan 20', latency: 1.7 },
        { date: 'Jan 21', latency: 2.1 },
        { date: 'Jan 22', latency: 1.6 },
        { date: 'Jan 23', latency: 1.8 },
        { date: 'Jan 24', latency: 1.5 },
        { date: 'Jan 25', latency: 1.4 },
        { date: 'Jan 26', latency: 1.6 },
      ],
      uptimeData: [
        { date: 'Jan 19', uptime: 99.1 },
        { date: 'Jan 20', uptime: 99.5 },
        { date: 'Jan 21', uptime: 98.8 },
        { date: 'Jan 22', uptime: 99.9 },
        { date: 'Jan 23', uptime: 99.7 },
        { date: 'Jan 24', uptime: 99.2 },
        { date: 'Jan 25', uptime: 99.8 },
        { date: 'Jan 26', uptime: 99.6 },
      ],
    },
    usage: {
      topClients: [
        { name: 'Claude.ai', sessions: 1_051 },
        { name: 'Claude Code', sessions: 1_748 },
        { name: 'Smithery', sessions: 1_116 },
        { name: 'OpenCode', sessions: 525 },
        { name: 'Cursor', sessions: 389 },
      ],
      dailySessions: [
        { date: 'Jan 19', sessions: 820 },
        { date: 'Jan 20', sessions: 1_150 },
        { date: 'Jan 21', sessions: 980 },
        { date: 'Jan 22', sessions: 1_340 },
        { date: 'Jan 23', sessions: 1_480 },
        { date: 'Jan 24', sessions: 1_120 },
        { date: 'Jan 25', sessions: 670 },
        { date: 'Jan 26', sessions: 410 },
      ],
    },
    requirements: {
      items: [
        'A Google account (free or Workspace)',
        'Read access to the Drive files you want to connect',
        'Write access is optional — only needed for exports',
        'No extra cost — the integration is included in every Kijko plan',
      ],
      security:
        'Kijko only requests the minimum required access permissions. Your files are never stored on Kijko servers; we exclusively use the Google Drive API for real-time access. The connection is GDPR-compliant and can be revoked at any time from your Google account settings.',
    },
    faq: [
      {
        question: 'How often are files synchronized?',
        answer:
          'Files are synchronized in real time via the Google Drive API. As soon as a file changes in Drive, the update is visible in Kijko within seconds.',
      },
      {
        question: 'Which file types are supported?',
        answer:
          'All file types supported by Google Drive, including Google Docs, Sheets, Slides, PDFs, images, and more. Kijko can search the contents of text-based files.',
      },
      {
        question: 'Can I disconnect the integration?',
        answer:
          'Yes. Go to My Integrations and click the menu on the Google Drive card. Choose "Disconnect" to remove the connection. Your files in Drive remain unaffected.',
      },
      {
        question: 'Are my files copied to Kijko?',
        answer:
          'No. Kijko reads files through the Google Drive API but does not store them. Your data stays in Google Drive.',
      },
      {
        question: 'Can I exclude specific folders?',
        answer:
          'Yes. During setup you choose which folders to connect. You can adjust this selection later in the integration settings.',
      },
    ],
  },
};

// ─── Icon Helper ─────────────────────────────────────────────────

function getIntegrationIcon(iconName: string, className = 'w-10 h-10') {
  switch (iconName) {
    case 'github':
      return <Github className={className} />;
    case 'slack':
      return <Slack className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

// ─── Benefit Icon Map ────────────────────────────────────────────

const BENEFIT_ICONS = [FolderSync, Clock, Search, Shield, Zap];

// ─── Custom Tooltip ──────────────────────────────────────────────

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

// ─── FAQ Accordion Item ──────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-colors hover:border-primary/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground pr-4">{question}</span>
        <ChevronDown
          size={18}
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
          <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
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
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
        <span className="text-sm font-bold text-primary">{number}</span>
      </div>
      <div className="pt-1">
        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
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
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────

export function IntegrationDetailPage() {
  const navigate = useNavigate();
  const { integrationId } = useParams<{ integrationId: string }>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [perfTab, setPerfTab] = useState<'latency' | 'uptime'>('latency');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Navigate to dashboard with the selected tab
  const handleTabChange = (tab: DashboardTabType) => {
    const params = tab === 'projects' ? '' : `?tab=${tab}`;
    navigate(`/${params}`);
  };

  // Find the integration app data
  const app = INTEGRATION_APPS.find((a) => a.id === integrationId);
  const content = integrationId ? INTEGRATION_CONTENT[integrationId] : undefined;

  if (!app || !content) {
    return (
      <div className="h-screen w-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Integration not found</h2>
          <p className="text-muted-foreground mb-6">
            This integration page does not exist or is unavailable.
          </p>
          <button
            onClick={() => navigate('/?tab=integrations')}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Integrations
          </button>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsConnecting(false);
  };

  const totalCalls = content.performance.tools.reduce((sum, t) => sum + t.calls, 0);
  const avgLatency =
    content.performance.tools.reduce((sum, t) => sum + parseFloat(t.latency), 0) /
    content.performance.tools.length;
  const avgUptime =
    content.performance.tools.reduce((sum, t) => sum + parseFloat(t.uptime), 0) /
    content.performance.tools.length;
  const totalSessions = content.usage.topClients.reduce((sum, c) => sum + c.sessions, 0);
  const maxClientSessions = Math.max(...content.usage.topClients.map((c) => c.sessions));

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans overflow-hidden flex flex-col">
      {/* Main Dashboard Header */}
      <header className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl overflow-visible relative z-50">
        <div className="flex items-center justify-between px-6 py-4 overflow-visible">
          {/* Logo and Tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/public/favicon.png"
                alt="Kijko logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-bold text-xl text-foreground tracking-tight hidden sm:inline">
                KIJKO
              </span>
            </div>

            {/* Main Navigation Tabs - Integrations is active */}
            <DashboardTabs activeTab="integrations" onTabChange={handleTabChange} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="relative z-50">
              <UserAvatar onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} />
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onLogout={() => console.log('Logout clicked')}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* ═══ HERO ═══ */}
          <section className="mb-12">
            <div className="flex items-start gap-5 mb-6">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                {getIntegrationIcon(app.icon, 'w-10 h-10 text-muted-foreground')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    {app.name} Integration for Kijko
                  </h1>
                  {app.isPopular && (
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                      Popular
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {app.category === 'storage' ? 'Cloud Storage' : app.category}
                </span>
              </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-5 max-w-2xl">
              {content.heroSubheader}
            </p>

            <ul className="space-y-2.5 mb-6">
              {content.heroBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{bullet}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
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
          </section>

          {/* ═══ WHAT DOES THIS INTEGRATION DO? ═══ */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              What does this integration do?
            </h2>
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {content.whatItDoes.intro}
              </p>
              <ul className="space-y-3">
                {content.whatItDoes.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-sm text-foreground leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ═══ KEY BENEFITS ═══ */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">Key Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.benefits.map((benefit, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
                return (
                  <div
                    key={i}
                    className="bg-card/50 border border-border rounded-xl p-5 transition-all hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══ HOW IT WORKS ═══ */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">How It Works</h2>
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <div className="space-y-6">
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
          </section>

          {/* ═══ PERFORMANCE ═══ */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Performance</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tools Table */}
              <div className="bg-card/50 border border-border rounded-xl p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left pb-3 font-medium">Tool</th>
                      <th className="text-right pb-3 font-medium">Calls</th>
                      <th className="text-right pb-3 font-medium">Latency</th>
                      <th className="text-right pb-3 font-medium">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {content.performance.tools.map((row) => (
                      <tr key={row.tool} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 text-primary font-medium">{row.tool}</td>
                        <td className="py-2.5 text-right text-foreground tabular-nums">
                          {row.calls.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-foreground tabular-nums">
                          {row.latency}
                        </td>
                        <td className="py-2.5 text-right text-foreground tabular-nums">
                          {row.uptime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border text-xs text-muted-foreground">
                      <td className="pt-3 font-semibold text-foreground">Total</td>
                      <td className="pt-3 text-right font-semibold text-foreground tabular-nums">
                        {totalCalls.toLocaleString()}
                      </td>
                      <td className="pt-3 text-right tabular-nums">{avgLatency.toFixed(1)}s</td>
                      <td className="pt-3 text-right tabular-nums">{avgUptime.toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Latency / Uptime Chart */}
              <div className="bg-card/50 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <PerformanceTabs active={perfTab} onChange={setPerfTab} />
                  <span className="text-xs text-muted-foreground">Last 7 days</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        perfTab === 'latency'
                          ? content.performance.latencyData
                          : content.performance.uptimeData
                      }
                    >
                      <defs>
                        <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        domain={perfTab === 'uptime' ? [97, 100] : ['auto', 'auto']}
                        tickFormatter={(v: number) =>
                          perfTab === 'uptime' ? `${v}%` : `${v}s`
                        }
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
                        fill="url(#perfGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ USAGE ═══ */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Usage</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Clients */}
              <div className="bg-card/50 border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Top Clients</h3>
                <div className="space-y-3">
                  {content.usage.topClients.map((client, i) => (
                    <div key={client.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4 tabular-nums">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {client.name}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums ml-2">
                            {client.sessions.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(client.sessions / maxClientSessions) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between">
                  <span className="text-xs font-medium text-foreground">Total</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {totalSessions.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Daily Sessions Chart */}
              <div className="bg-card/50 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Daily Sessions</h3>
                  <span className="text-xs text-muted-foreground">Last 7 days</span>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={content.usage.dailySessions}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip suffix="" />} />
                      <Bar
                        dataKey="sessions"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ REQUIREMENTS & SETTINGS ═══ */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Requirements & Settings
            </h2>
            <div className="bg-card/50 border border-border rounded-xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText size={15} className="text-muted-foreground" />
                  What you need
                </h3>
                <ul className="space-y-2">
                  {content.requirements.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lock size={15} className="text-muted-foreground" />
                  Security & Privacy
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.requirements.security}
                </p>
              </div>
            </div>
          </section>

          {/* ═══ FAQ ═══ */}
          <section className="mb-16">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {content.faq.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </section>

          {/* ═══ BOTTOM CTA ═══ */}
          <section className="mb-10 text-center">
            <div className="bg-card/50 border border-border rounded-xl p-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to connect {app.name}?
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Activate the integration and start using your {app.name} files inside Kijko.
              </p>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
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
            </div>
          </section>

          {/* Permissions Footer */}
          <footer className="border-t border-border pt-6 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Requested Permissions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {app.permissions.map((perm) => (
                <span
                  key={perm}
                  className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-md border border-border"
                >
                  {perm.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </footer>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* My Profile Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Settings Button - Bottom Left */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-all shadow-lg group z-10"
      >
        <Settings
          size={16}
          className="transition-transform duration-500 group-hover:rotate-90"
        />
        <span>Settings</span>
      </button>
    </div>
  );
}

export default IntegrationDetailPage;
