# Kijko MVP Dashboard

The Kijko MVP Dashboard is a React/TypeScript single-page application that serves as the primary frontend for the Kijko platform. It provides a tabbed dashboard interface for managing projects, integrations, skills, and HyperVisa sessions.

**Repository:** [Anansitrading/kijko_frontend](https://github.com/Anansitrading/kijko_frontend)
**Deployed at:** `https://app.kijko.nl`

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Charting:** Recharts
- **Markdown:** react-markdown with remark-gfm
- **Routing:** React Router DOM 7
- **Validation:** Zod
- **AI SDKs:** `@google/genai` (Gemini), `@anthropic-ai/sdk` (Claude)
- **Graph Visualization:** react-force-graph-2d

## Project Structure

```
Kijko-MVP/
├── App.tsx                    # Root component with routing
├── index.tsx                  # Entry point
├── index.html                 # HTML template
├── vite.config.ts             # Vite config (dev proxy, env vars)
├── package.json               # Dependencies and scripts
├── nginx.conf                 # Production nginx config
├── Dockerfile                 # Multi-stage build (node + nginx)
├── docker-compose.yml         # Container orchestration
├── deploy.sh                  # Deployment script
├── components/
│   ├── Dashboard/             # Main dashboard and tab components
│   │   ├── index.tsx          # Dashboard layout with header and tabs
│   │   ├── DashboardTabs.tsx  # Tab navigation (Projects, Integrations, Skills, HyperVisa)
│   │   ├── ProjectsTab.tsx    # Projects overview tab
│   │   ├── IntegrationsTab.tsx# MCP/API integrations marketplace
│   │   ├── SkillsTab.tsx      # Skills library with categories
│   │   ├── HyperVisaTab.tsx   # HyperVisa session management
│   │   ├── UserAvatar.tsx     # User avatar display
│   │   ├── UserDropdown.tsx   # User menu dropdown
│   │   └── integrations/      # Integration detail components
│   ├── Hypervisa/             # HyperVisa viewer (project-level)
│   │   ├── HypervisaView.tsx  # Main HyperVisa workspace
│   │   └── IngestionWizard.tsx# Data ingestion wizard
│   ├── Panopticon/            # Panopticon dashboard components
│   │   ├── PanopticonDashboard.tsx
│   │   ├── MarketplacePanel.tsx
│   │   └── TelemetryBar.tsx
│   ├── Skills/                # Skill builder and management UI
│   ├── Notifications/         # Notification bell and panel
│   ├── Settings/              # Settings modal and sub-panels
│   ├── SupportChat/           # Support chat widget
│   ├── ProjectOverview/       # Project cards and listing
│   ├── ProjectCreation/       # New project flow
│   ├── ContextDetailInspector/# Context detail inspection
│   ├── ChatInterface.tsx      # Chat component
│   ├── Sidebar.tsx            # Left sidebar (project view)
│   └── common/                # Shared UI primitives
├── contexts/                  # React context providers
│   ├── SettingsContext.tsx
│   ├── ProjectsContext.tsx
│   ├── NotificationContext.tsx
│   ├── ChatHistoryContext.tsx
│   ├── RealtimeContext.tsx
│   ├── IngestionContext.tsx
│   ├── SourceFilesContext.tsx
│   └── ...
├── hooks/                     # Custom React hooks
│   ├── useTabNavigation.ts
│   ├── useSkills.ts
│   ├── useNotifications.ts
│   ├── useIngestionSocket.ts
│   ├── useHabits.ts
│   ├── useReflexes.ts
│   └── ...
├── services/                  # API and backend service clients
│   ├── geminiService.ts       # Gemini AI integration
│   ├── claudeApi.ts           # Claude AI integration
│   ├── supabase.ts            # Supabase client
│   ├── skillsApi.ts           # Skills CRUD API
│   ├── projectApi.ts          # Project management API
│   ├── websocket.ts           # WebSocket connections
│   ├── knowledgeGraph.ts      # Knowledge graph service
│   ├── mcpRegistry.ts         # MCP server registry
│   └── ...
├── types/                     # TypeScript type definitions
├── lib/                       # Utility libraries
├── utils/                     # Helper utilities
├── styles/                    # CSS stylesheets
├── public/                    # Static assets
├── conductor/                 # Product guidelines and sprint tracks
└── supabase/                  # Supabase configuration
```

## Dashboard Tabs

The main dashboard presents four tabs:

1. **Projects** -- Browse and select projects. Selecting a project opens the HyperVisa workspace view with a sidebar, chat interface, and source file viewer.
2. **Integrations** -- Marketplace for discovering and connecting MCP servers and API integrations. Includes filtering, grid/list views, custom connector creation, and detail panels.
3. **Skills** -- A library of reusable AI skills (analysis, generation, transformation, communication, automation, custom). Includes a skill builder wizard, habits/reflexes configuration, and execution history.
4. **HyperVisa** -- Session management dashboard for the HyperVisa AI engine. Create sessions from URLs, local paths, or YouTube videos. Query sessions with Gemini. Manages persistent sessions with adaptive swarm support.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `WorkspaceView` | Main dashboard (tabs) or project workspace |
| `/integration/:integrationId` | `IntegrationDetailPage` | Full-page integration detail |
| `/project/:projectId` | `ProjectDetailPage` | Full-page context detail inspector |

## Development

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Set environment variable
# Create .env.local with GEMINI_API_KEY=your-key

# Start dev server (port 3000)
npm run dev
```

The Vite dev server runs on `http://localhost:3000` and proxies `/api/hypervisa` requests to the HyperVisa API at `http://localhost:8042`.

### Build

```bash
npm run build
```

Output is written to `dist/`.

## Deployment

### Docker (Production)

The production setup uses a multi-stage Docker build: Node.js builds the app, then nginx serves the static files.

```bash
# Build and start container (maps port 3000 -> nginx port 80)
GEMINI_API_KEY=your-key docker compose up -d --build
```

The container name is `kijko-mvp` and it restarts automatically unless stopped.

### Automated Deployment

```bash
./deploy.sh
```

The deploy script:
1. Fetches the latest from `origin`
2. Resets to `origin/Kijko-MVP`
3. Rebuilds the Docker container
4. Verifies the deployment with an HTTP health check

### Nginx Configuration

The nginx config (`nginx.conf`) serves the app at `app.kijko.nl`:
- `/api/hypervisa/` is proxied to the HyperVisa API backend at `172.17.0.1:8042`
- All other routes fall back to `index.html` for SPA routing
- CSP allows framing from `swarm.kijko.nl`

## Connected Services

| Service | Endpoint | Purpose |
|---------|----------|---------|
| HyperVisa API | `localhost:8042` (dev) / `172.17.0.1:8042` (prod) | AI session management |
| Gemini API | Google AI | Multimodal AI queries over HyperVisa sessions |
| Claude API | Anthropic | AI-powered chat and support |
| Supabase | Configured in services | Database and auth backend |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required for build and runtime) |
