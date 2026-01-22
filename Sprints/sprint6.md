# Sprint 6: Users & Access Control Tab

## Sprint Goal
Implement the Users tab with user management, permission controls, and activity logging functionality.

## Prerequisites (from Sprint 1-5)
- Modal shell with tab navigation
- TypeScript interfaces (UserAccess, ActivityEvent)
- List/timeline component patterns
- Dropdown component
- Search input component

---

## User Stories

### US-6.1: Current Users List
**As a** user
**I want** to see all users with access to this context
**So that** I can manage who has access

**Acceptance Criteria:**
- [ ] Header showing "CURRENT USERS (X)" with count
- [ ] Scrollable user list
- [ ] Each user card shows: Avatar, Name, Role badge, Email, Last active
- [ ] Permission dropdown for changing access level
- [ ] Settings icon for additional options
- [ ] Search input to filter users

### US-6.2: Invite Users
**As a** user
**I want** to invite new users to access this context
**So that** I can collaborate with others

**Acceptance Criteria:**
- [ ] "+ Invite User" button in toolbar
- [ ] Invite modal opens with email input
- [ ] Role selector dropdown in invite modal
- [ ] Success/error feedback on invite

### US-6.3: Permission Management
**As a** user
**I want** to change user permissions
**So that** I can control access levels

**Acceptance Criteria:**
- [ ] Permission dropdown with levels: Full Access, Admin, Editor, Read Only
- [ ] Changes update immediately
- [ ] Confirmation for permission changes
- [ ] Cannot change own permissions (owner)

### US-6.4: Activity Log
**As a** user
**I want** to see activity on this context
**So that** I can track who is doing what

**Acceptance Criteria:**
- [ ] Section header "ACTIVITY LOG"
- [ ] Filter by type: All Activity, Views, Chats, Ingestions, Changes
- [ ] Filter by time: Last 7 days, 30 days, etc.
- [ ] Scrollable activity timeline
- [ ] Each entry shows: Icon, User, Description, Timestamp
- [ ] "Load More" for pagination

---

## Technical Tasks

### T-6.1: API Endpoints
Implement or mock:

```
GET    /api/context/:id/users               # User access list
POST   /api/context/:id/users/invite        # Invite user
PATCH  /api/context/:id/users/:userId       # Update permissions
DELETE /api/context/:id/users/:userId       # Remove access
GET    /api/context/:id/activity            # Activity log
```

### T-6.2: User Card Component
Create `components/ContextDetailInspector/tabs/UsersTab/UserCard.tsx`:

```typescript
interface UserCardProps {
  user: UserAccess;
  isCurrentUser: boolean;
  onPermissionChange: (userId: string, role: UserRole) => void;
  onSettings: (userId: string) => void;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 👤 Sarah Chen                   Admin            │
│    sarah@kijko.ai                                │
│    Last active: 2 hours ago                      │
│    [Admin ▼]                               [⚙️]  │
└──────────────────────────────────────────────────┘
```

### T-6.3: Role Badge Component
Create `components/common/RoleBadge.tsx`:

```typescript
interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}
```

**Styling:**
- Owner: Gold/yellow badge
- Admin: Blue badge
- Editor: Green badge
- Viewer: Gray badge

### T-6.4: Permission Dropdown Component
Create `components/ContextDetailInspector/tabs/UsersTab/PermissionDropdown.tsx`:

```typescript
interface PermissionDropdownProps {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

const permissionOptions = [
  { value: 'owner', label: 'Full Access', disabled: true },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Read Only' },
];
```

### T-6.5: Invite User Modal
Create `components/ContextDetailInspector/tabs/UsersTab/InviteUserModal.tsx`:

```typescript
interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => Promise<void>;
}
```

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ Invite User                                 [✕]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Email Address                                    │
│ ┌──────────────────────────────────────────────┐│
│ │ Enter email address                          ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Permission Level                                 │
│ [Editor ▼]                                       │
│                                                  │
│         [Cancel]  [Send Invite]                  │
└──────────────────────────────────────────────────┘
```

### T-6.6: Activity Event Component
Create `components/ContextDetailInspector/tabs/UsersTab/ActivityEvent.tsx`:

```typescript
interface ActivityEventProps {
  event: ActivityEvent;
}
```

**Activity Icons:**
- 👁️ = File view
- 💬 = Chat interaction
- 📥 = Ingestion
- 🔐 = Permission change
- ⚙️ = Configuration change

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 👁️  You viewed /src/core/client.ts               │
│     2 minutes ago                                │
└──────────────────────────────────────────────────┘
```

### T-6.7: Activity Filter Toolbar
Create `components/ContextDetailInspector/tabs/UsersTab/ActivityFilter.tsx`:

```typescript
interface ActivityFilterProps {
  typeFilter: ActivityType | 'all';
  timeFilter: TimeRange;
  onTypeChange: (type: ActivityType | 'all') => void;
  onTimeChange: (range: TimeRange) => void;
}

type ActivityType = 'view' | 'chat' | 'ingestion' | 'permission' | 'config';
```

### T-6.8: User Search Component
Create `components/ContextDetailInspector/tabs/UsersTab/UserSearch.tsx`:

```typescript
interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

### T-6.9: Permission Info Box
Create `components/ContextDetailInspector/tabs/UsersTab/PermissionInfo.tsx`:

```typescript
// Static info box explaining permission levels
const permissionLevels = [
  { role: 'Owner', description: 'Full control, can delete, manage users' },
  { role: 'Admin', description: 'Can ingest, configure, view all activity' },
  { role: 'Editor', description: 'Can chat, view, suggest changes' },
  { role: 'Viewer', description: 'Read-only access, can chat' },
];
```

### T-6.10: Main Users Tab Component
Create `components/ContextDetailInspector/tabs/UsersTab/index.tsx`:

```typescript
interface UsersTabProps {
  contextId: string;
}

function UsersTab({ contextId }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { users, isLoading, error, updatePermission, removeUser, inviteUser } = useUsers(contextId);
  const { events, loadMore, hasMore, filters, setFilters } = useActivity(contextId);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render user list and activity log
}
```

### T-6.11: Custom Hooks
Create hooks for users and activity:

```typescript
// hooks/useUsers.ts
interface UseUsersReturn {
  users: UserAccess[];
  isLoading: boolean;
  error: string | null;
  updatePermission: (userId: string, role: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  inviteUser: (email: string, role: UserRole) => Promise<void>;
}

// hooks/useActivity.ts
interface UseActivityReturn {
  events: ActivityEvent[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
  filters: ActivityFilters;
  setFilters: (filters: ActivityFilters) => void;
}
```

### T-6.12: Footer Buttons for Users Tab
Update `ModalFooter.tsx`:

```typescript
const usersFooterButtons = [
  { icon: '+', label: 'Invite User', onClick: handleInvite, variant: 'primary' },
  { icon: '⬇️', label: 'Export Activity Log', onClick: handleExport, variant: 'secondary' },
];
```

### T-6.13: User Settings Menu
Create dropdown menu for user settings icon:

```typescript
interface UserSettingsMenuProps {
  user: UserAccess;
  onRemove: () => void;
  onResendInvite?: () => void;
}
```

Options:
- Remove access
- Resend invite (if pending)
- View user profile

---

## UI Specifications

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Context Name                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Compression] [Enrichments] [Users] [Changelog]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🔍 Search users...]                      [+ Invite User]  │
│                                                             │
│  CURRENT USERS (4)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 You                          Owner               │   │
│  │    user@kijko.ai                                    │   │
│  │    Last active: Just now                            │   │
│  │    [Full Access ▼]                            [⚙️]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 👤 Sarah Chen                   Admin               │   │
│  │    sarah@kijko.ai                                   │   │
│  │    Last active: 2 hours ago                         │   │
│  │    [Admin ▼]                                  [⚙️]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────         │
│                                                             │
│  ACTIVITY LOG                                               │
│  [All Activity ▼]  [Last 7 days ▼]                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️  You viewed /src/core/client.ts                  │   │
│  │     2 minutes ago                                   │   │
│  │                                                     │   │
│  │ 💬 Sarah Chen asked about authentication           │   │
│  │     2 hours ago                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Load More...]                                            │
│                                                             │
│  ─────────────────────────────────────────────────         │
│  PERMISSION LEVELS:                                        │
│  • Owner: Full control, can delete, manage users          │
│  • Admin: Can ingest, configure, view all activity        │
│  • Editor: Can chat, view, suggest changes                │
│  • Viewer: Read-only access, can chat                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│        [+ Invite User]          [⬇️ Export Activity Log]    │
└─────────────────────────────────────────────────────────────┘
```

### Colors & Styling
- User cards: Subtle border, hover state
- Role badges: Colored based on role
- Activity icons: Distinct colors per type
- Permission dropdown: Dark background, clear focus states
- Search input: Dark with subtle border

---

## Definition of Done
- [ ] User list displays with all info (avatar, name, role, email, last active)
- [ ] User search filters list correctly
- [ ] Permission dropdown changes role
- [ ] Invite modal opens and submits
- [ ] Activity log displays with correct icons
- [ ] Activity filters work (type and time)
- [ ] "Load More" pagination works
- [ ] Permission info box displays
- [ ] Loading states for async operations
- [ ] Error handling for API failures
- [ ] Cannot modify own Owner permissions

---

## Deliverables
1. `tabs/UsersTab/` - All user management components
2. `InviteUserModal` component
3. `RoleBadge` reusable component
4. `useUsers` and `useActivity` hooks
5. Permission dropdown component
6. Activity event components

---

## Dependencies for Next Sprint
Sprint 7 requires:
- Modal-within-modal pattern (for diff viewer)
- Confirmation dialog pattern (for rollback)
- All changelog entries functional
