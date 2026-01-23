# Sprint 2: Overview & Chat Tab

## Sprint Goal
Implement the Overview & Chat tab with a split-view layout featuring context summary on the left and an interactive chat interface on the right.

## Prerequisites (from Sprint 1)
- Modal shell with tab navigation
- TypeScript interfaces (ContextItem, ChatMessage)
- State management context
- Loading/error/empty state components
- Base styling constants

---

## User Stories

### US-2.1: Context Summary Panel
**As a** user
**I want** to see a summary of the context item
**So that** I can quickly understand what this codebase contains

**Acceptance Criteria:**
- [ ] Left panel (40% width) displays "CONTEXT SUMMARY" header
- [ ] Icon + name of context item displayed
- [ ] Metadata cards showing: Type, Size, File count, Last Updated
- [ ] AI-generated summary section (3-4 sentences)
- [ ] Key Components bullet list (top 4-5 modules)
- [ ] "Regenerate Summary" button (secondary style)
- [ ] Loading skeleton while summary loads
- [ ] Summary auto-generates on first open

### US-2.2: Chat Interface
**As a** user
**I want** to chat with the context
**So that** I can ask questions about the codebase

**Acceptance Criteria:**
- [ ] Right panel (60% width) displays "CHAT WITH CONTEXT" header
- [ ] Subtitle: "Ask questions about this codebase"
- [ ] Scrollable message history container
- [ ] User/AI messages with distinct styling and avatars
- [ ] Input field with placeholder "Ask about this context..."
- [ ] Send button (arrow icon)
- [ ] Messages display with timestamps
- [ ] Empty state: "No chat history yet"

### US-2.3: Chat Persistence
**As a** user
**I want** my chat history to be saved
**So that** I can continue conversations later

**Acceptance Criteria:**
- [ ] Chat history persists per context item
- [ ] History loads when modal opens
- [ ] New messages append to history
- [ ] Chat state managed in context/store

---

## Technical Tasks

### T-2.1: API Endpoints
Implement or mock these endpoints:

```
GET    /api/context/:id                    # Basic context info
GET    /api/context/:id/summary            # AI summary
POST   /api/context/:id/summary/regenerate # Regenerate summary
GET    /api/context/:id/chat               # Chat history
POST   /api/context/:id/chat               # Send chat message
```

### T-2.2: Summary Panel Component
Create `components/ContextDetailInspector/tabs/OverviewTab/SummaryPanel.tsx`:

```typescript
interface SummaryPanelProps {
  contextItem: ContextItem;
  summary: ContextSummary | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

interface ContextSummary {
  description: string;        // AI-generated 3-4 sentences
  keyComponents: string[];    // Top 4-5 modules
  generatedAt: Date;
}
```

**UI Elements:**
- Context icon based on type (package/repo/files)
- Metadata grid with 4 cards
- Divider line
- AI summary with robot emoji header
- Bullet list of key components
- Regenerate button with refresh icon

### T-2.3: Chat Interface Component
Create `components/ContextDetailInspector/tabs/OverviewTab/ChatPanel.tsx`:

```typescript
interface ChatPanelProps {
  contextId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}
```

**UI Elements:**
- Header with chat icon
- Scrollable message list (auto-scroll to bottom)
- Message bubbles with user/assistant styling
- Avatar icons for each role
- Timestamp display (relative time)
- Input container fixed at bottom
- Send button (disabled when empty/loading)

### T-2.4: Message Component
Create `components/ContextDetailInspector/tabs/OverviewTab/ChatMessage.tsx`:

```typescript
interface ChatMessageProps {
  message: ChatMessage;
}
```

**Styling:**
- User messages: Right-aligned, primary color background
- Assistant messages: Left-aligned, darker background
- Avatar: User icon vs AI/robot icon
- Timestamp: Small, secondary text color
- Content: Support for markdown rendering

### T-2.5: Chat Input Component
Create `components/ContextDetailInspector/tabs/OverviewTab/ChatInput.tsx`:

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}
```

**Features:**
- Controlled input with local state
- Submit on Enter key (Shift+Enter for newline)
- Send button with arrow icon
- Loading spinner in button when sending
- Disabled state during message processing

### T-2.6: State Management for Overview Tab
Add to context/store:

```typescript
interface OverviewTabState {
  summary: ContextSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
}

type OverviewTabAction =
  | { type: 'LOAD_SUMMARY_START' }
  | { type: 'LOAD_SUMMARY_SUCCESS'; payload: ContextSummary }
  | { type: 'LOAD_SUMMARY_ERROR'; payload: string }
  | { type: 'REGENERATE_SUMMARY_START' }
  | { type: 'LOAD_CHAT_START' }
  | { type: 'LOAD_CHAT_SUCCESS'; payload: ChatMessage[] }
  | { type: 'SEND_MESSAGE_START'; payload: string }
  | { type: 'RECEIVE_MESSAGE'; payload: ChatMessage };
```

### T-2.7: Custom Hooks
Create hooks for data fetching:

```typescript
// hooks/useContextSummary.ts
function useContextSummary(contextId: string) {
  // Fetch summary on mount
  // Return { summary, isLoading, error, regenerate }
}

// hooks/useContextChat.ts
function useContextChat(contextId: string) {
  // Fetch chat history on mount
  // Return { messages, isLoading, error, sendMessage }
}
```

### T-2.8: Footer Buttons for Overview Tab
Update `ModalFooter.tsx` for Overview tab:

```typescript
const overviewFooterButtons = [
  { icon: '⟳', label: 'Regenerate Summary', onClick: handleRegenerate, variant: 'secondary' },
  { icon: '⬇️', label: 'Export Context Info', onClick: handleExport, variant: 'secondary' },
];
```

---

## UI Specifications

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Context Name                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│ [Overview & Chat] [Compression] [Enrichments] [Users] [Log] │
├─────────────────────────────────────────────────────────────┤
│                           │                                 │
│  CONTEXT SUMMARY          │  CHAT WITH CONTEXT              │
│                           │                                 │
│  [Icon] panopticon-core   │  💬 Ask questions about this    │
│                           │     codebase                    │
│  ┌─────┐ ┌─────┐         │                                 │
│  │Type │ │Size │         │  ┌─────────────────────────────┐│
│  │NPM  │ │2.4MB│         │  │ Chat messages...            ││
│  └─────┘ └─────┘         │  │                             ││
│  ┌─────┐ ┌─────┐         │  │                             ││
│  │Files│ │Last │         │  │                             ││
│  │847  │ │2h   │         │  │                             ││
│  └─────┘ └─────┘         │  └─────────────────────────────┘│
│                           │                                 │
│  ──────────────────       │  ┌─────────────────────────[→]┐│
│                           │  │ Ask about this context...   ││
│  🤖 AI-Generated Summary  │  └─────────────────────────────┘│
│  This codebase provides...│                                 │
│                           │                                 │
│  Key Components:          │                                 │
│  • PanopticonClient       │                                 │
│  • MonitoringService      │                                 │
│                           │                                 │
│  [⟳ Regenerate Summary]   │                                 │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│           [⟳ Regenerate Summary]  [Export Context Info]     │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- Summary panel: Slightly lighter background for cards
- Chat bubbles: User (#3b82f6), Assistant (#1f2937)
- Dividers: rgba(255,255,255,0.1)
- Input field: Dark background, white border on focus

---

## Definition of Done
- [ ] Split-view layout renders correctly (40/60)
- [ ] Summary displays with all metadata
- [ ] Summary regeneration works
- [ ] Chat messages display correctly
- [ ] Can send and receive chat messages
- [ ] Chat history persists
- [ ] Loading states for summary and chat
- [ ] Empty state for no chat history
- [ ] Error handling for API failures
- [ ] Responsive: Panels stack on narrow viewports

---

## Deliverables
1. `tabs/OverviewTab/` - All overview components
2. API integration for summary and chat
3. Custom hooks for data fetching
4. State management updates
5. Footer button configuration

---

## Dependencies for Next Sprint
Sprint 3 requires:
- Working modal with tab switching
- Pattern for creating tab content
- API integration patterns established
