# KIJKO - Product Guidelines

## Brand Voice

### Tone: Technical & Professional

KIJKO communicates with precision and reliability, positioning itself as an enterprise-ready platform while remaining accessible to developers of all skill levels.

**Voice Characteristics:**
- **Precise**: Use specific, accurate technical terminology
- **Confident**: State capabilities clearly without hedging
- **Helpful**: Guide users toward solutions, not just describe problems
- **Respectful**: Never condescend; assume technical competence

### Writing Style

**Do:**
- Use active voice: "KIJKO monitors your agents" not "Agents are monitored by KIJKO"
- Be concise: Remove unnecessary words
- Use technical terms correctly: "MCP server" not "MCP thing"
- Provide context: "Connection failed (timeout after 30s)"

**Don't:**
- Use marketing hyperbole: "revolutionary", "game-changing"
- Overuse jargon: Explain acronyms on first use
- Be vague: "Something went wrong" -> "WebSocket connection timeout"

### Error Messages

```
Format: [What happened] + [Why it matters] + [What to do]

Example:
"MCP server 'github-integration' disconnected.
Agent tools may be unavailable.
Check server status or reconnect in Settings."
```

## Visual Identity

### Color Philosophy

KIJKO uses a dark-first design language that:
- Reduces eye strain during extended use
- Creates focus on content and data
- Conveys a professional, technical aesthetic

### Theme Support

Full support for **both Dark and Light modes**:

#### Dark Mode (Primary)
- Background: Slate-950 (#020617)
- Cards: Slate-900 (#0f172a)
- Text: Slate-100 (#f1f5f9)
- Accent: Blue-500 (#3b82f6)

#### Light Mode
- Background: Slate-50 (#f8fafc)
- Cards: White (#ffffff)
- Text: Slate-900 (#0f172a)
- Accent: Blue-600 (#2563eb)

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Inter | 600-700 | 1.25-2rem |
| Body | Inter | 400 | 0.875-1rem |
| Code | JetBrains Mono | 400 | 0.875rem |
| Labels | Inter | 500 | 0.75rem |

### Iconography

- **Library**: Lucide React
- **Style**: Outline, consistent stroke width
- **Size**: 16px (inline), 20px (buttons), 24px (navigation)

### Motion & Animation

- **Duration**: 150-300ms for micro-interactions
- **Easing**: ease-out for entrances, ease-in-out for state changes
- **Purpose**: Animations should provide feedback, not decoration

## Component Patterns

### Status Indicators

| State | Color | Icon |
|-------|-------|------|
| Connected | Green (emerald-500) | CheckCircle |
| Connecting | Amber (amber-500) | Loader (spinning) |
| Disconnected | Red (red-500) | XCircle |
| Idle | Slate (slate-400) | Circle |

### Interactive Elements

- **Buttons**: Rounded corners (rounded-lg), hover state with brightness change
- **Inputs**: Border on focus (ring-2 ring-blue-500)
- **Cards**: Subtle border, hover lift effect

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Keyboard navigation for all features
- Screen reader compatible labels
