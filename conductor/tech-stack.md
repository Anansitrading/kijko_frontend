# KIJKO - Tech Stack

## Overview

KIJKO is built with a modern React stack optimized for developer experience and performance.

## Core Technologies

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| TypeScript | 5.8.2 | Type safety |
| Vite | 6.2.0 | Build tool & dev server |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.1.18 | Utility-first CSS |
| clsx | 2.1.1 | Conditional class names |
| tailwind-merge | 3.4.0 | Class conflict resolution |

### UI Components

| Technology | Version | Purpose |
|------------|---------|---------|
| Lucide React | 0.562.0 | Icon library |
| Recharts | 3.6.0 | Data visualization |

### AI Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| @google/genai | 1.34.0 | Gemini API client |

## Architecture Decisions

### State Management

**Decision**: Local component state with React Hooks

**Rationale**:
- Application state is relatively simple
- No need for complex global state patterns
- Component state provides clear data flow
- Can add Zustand/Jotai if complexity increases

### Routing

**Decision**: State-based mode switching (no router)

**Rationale**:
- Single-page application with three main views
- URL routing not required for current use case
- Simpler mental model for navigation
- Can add React Router if deep linking needed

### Styling Approach

**Decision**: Tailwind CSS with utility-first approach

**Rationale**:
- Rapid prototyping and iteration
- Consistent design tokens via CSS variables
- No CSS-in-JS runtime overhead
- Built-in responsive design utilities

### Build Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: { port: 3000, host: "0.0.0.0" },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./") },
    },
  };
});
```

## Project Structure

```
kijko/
├── App.tsx                 # Root component
├── index.tsx               # React DOM mount
├── types.ts                # Shared type definitions
├── components/
│   ├── Sidebar.tsx
│   ├── ChatInterface.tsx
│   ├── ContextStore.tsx
│   ├── SettingsModal.tsx
│   ├── MonitorInterface.tsx
│   ├── Agents/
│   │   └── AgentsView.tsx
│   └── Panopticon/
│       ├── PanopticonView.tsx
│       ├── PanopticonDashboard.tsx
│       ├── MarketplacePanel.tsx
│       └── TelemetryBar.tsx
├── services/
│   ├── geminiService.ts    # AI integration
│   └── mcpRegistry.ts      # MCP registry
├── utils/
│   └── cn.ts               # Class utility
└── ui/
    └── index.css           # Global styles
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 90 |

## Future Considerations

- **State Management**: Zustand if global state complexity increases
- **Testing**: Vitest + React Testing Library when adding test coverage
- **Routing**: React Router if deep linking/URL state needed
- **PWA**: Service worker for offline capabilities
