# Sprint PC4: Advanced Configuration & Team Access (Steps 3 & 4)

## Goal
Build the advanced settings panel (Step 3) and team member management (Step 4) for power users and enterprise flows.

## Prerequisites Completed By This Sprint
- Chunking strategy selection
- Metadata extraction options
- Output format configuration
- Team member invitation system
- Role-based access control setup
- Directory sync integration (Okta, Azure AD)

## Dependencies From Previous Sprints
- **Sprint PC1**: Database schema (project_members table), TypeScript types
- **Sprint PC2**: Modal shell, form state
- **Sprint PC3**: Repository/files selected (needed for context)

## Deliverables

### Feature 1: Step 3 - Chunking Strategy Selection
- **Description**: Radio buttons for selecting how content is chunked for AI processing
- **Acceptance Criteria**:
  - [ ] Four options with descriptions:
    - Semantic (recommended) - preserves meaning
    - Fixed size (1000 tokens) - predictable
    - Recursive - hierarchical structure
    - Custom (webhook) - bring your own logic
  - [ ] Default: Semantic
  - [ ] "Recommended" badge on Semantic option
  - [ ] Tooltip/info icon explaining each strategy
  - [ ] Custom option shows webhook URL input when selected
- **Technical Notes**:
  ```typescript
  type ChunkingStrategy = 'semantic' | 'fixed' | 'recursive' | 'custom';

  interface ChunkingOption {
    value: ChunkingStrategy;
    label: string;
    description: string;
    recommended?: boolean;
  }
  ```

### Feature 2: Metadata Extraction Options
- **Description**: Checkboxes for configuring what metadata to extract
- **Acceptance Criteria**:
  - [ ] Checkbox options:
    - Function signatures & docstrings (default: checked)
    - Import dependencies (default: checked)
    - Git history (authors, dates) (default: checked)
    - File structure (default: checked)
    - Custom annotations (comments) (default: unchecked)
  - [ ] Select all / Deselect all toggle
  - [ ] Brief description for each option
- **Technical Notes**:
  ```typescript
  interface MetadataOptions {
    functionSignatures: boolean;
    importDependencies: boolean;
    gitHistory: boolean;
    fileStructure: boolean;
    customAnnotations: boolean;
  }
  ```

### Feature 3: Output Format Selection
- **Description**: Radio buttons for output format
- **Acceptance Criteria**:
  - [ ] Three options: JSON, Markdown, Vector embeddings
  - [ ] Default: JSON
  - [ ] Preview snippet for each format (collapsible)
  - [ ] Vector embeddings shows embedding model selector (nice-to-have)
- **Technical Notes**: Output format affects how processed content is stored and retrieved

### Feature 4: File Pattern Filters
- **Description**: Input fields for include/exclude patterns
- **Acceptance Criteria**:
  - [ ] Language patterns input with tag-style chips
  - [ ] Placeholder: `*.py, *.ts, *.js`
  - [ ] Exclude patterns input with tag-style chips
  - [ ] Placeholder: `*test*, *.md`
  - [ ] Add pattern with Enter key or comma
  - [ ] Remove pattern by clicking X on chip
  - [ ] Validation for glob pattern syntax
- **Technical Notes**:
  ```typescript
  interface PatternFilters {
    languagePatterns: string[]; // e.g., ['*.py', '*.ts', '*.js']
    excludePatterns: string[];  // e.g., ['*test*', '*.md']
  }
  ```

### Feature 5: Processing Options
- **Description**: Checkboxes for processing behavior
- **Acceptance Criteria**:
  - [ ] Checkbox options:
    - Anonymize secrets (API keys) (default: checked)
    - Parallel processing (faster) (default: checked)
    - Real-time incremental (on commits) (default: unchecked)
  - [ ] Warning icon on "Real-time incremental" about additional costs
  - [ ] Tooltips explaining each option
- **Technical Notes**: These options affect ingestion performance and behavior

### Feature 6: Step 4 - Team Member Invitation
- **Description**: Interface for inviting team members and assigning roles
- **Acceptance Criteria**:
  - [ ] Email input field with role dropdown
  - [ ] Role options: Admin, Manager, Developer, Viewer, Auditor
  - [ ] Add multiple members (dynamic form rows)
  - [ ] Remove member row (X button)
  - [ ] Role descriptions on hover/tooltip
  - [ ] Validation for email format
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────────────────┐
  │ Teamleden uitnodigen & rollen toewijzen:         │
  │                                                  │
  │ [email@company.com]  [Role: Developer ▼] [X]    │
  │ [alex@company.com]   [Role: Manager ▼]  [X]    │
  │ [+ Add team member]                              │
  └──────────────────────────────────────────────────┘
  ```

### Feature 7: Bulk Team Import via CSV
- **Description**: CSV upload for adding multiple team members
- **Acceptance Criteria**:
  - [ ] Drag-and-drop zone for CSV
  - [ ] Format hint: `email, role, notifications`
  - [ ] Example: `email@company.com, Developer, daily`
  - [ ] Parse and preview imported members
  - [ ] Validation for email and role values
  - [ ] Error handling for malformed CSV
- **Technical Notes**: Reuse dropzone component from Sprint PC3

### Feature 8: Directory Sync Integration
- **Description**: Connect to identity providers for team sync
- **Acceptance Criteria**:
  - [ ] Buttons: "Connect Okta", "Connect Azure AD"
  - [ ] OAuth flow for directory connection
  - [ ] Group/team selector after connection
  - [ ] Sync status indicator
  - [ ] Ability to disconnect
- **Technical Notes**: This is enterprise feature - can be stubbed initially

### Feature 9: Role Definitions Display
- **Description**: Clear explanation of what each role can do
- **Acceptance Criteria**:
  - [ ] Collapsible section showing role permissions
  - [ ] Admin: Full access + project settings
  - [ ] Manager: Team mgmt + reports
  - [ ] Developer: Read/write + query
  - [ ] Viewer: Read-only + comments
  - [ ] Auditor: Logs + compliance only
- **Technical Notes**: Display as info panel or modal

### Feature 10: Notification Preferences
- **Description**: Default notification settings for invited members
- **Acceptance Criteria**:
  - [ ] Default notification dropdown: Daily digest (default), Real-time, Weekly, Disabled
  - [ ] Applied to all new invites
  - [ ] Can be overridden per-member (nice-to-have)
- **Technical Notes**:
  ```typescript
  type NotificationLevel = 'real-time' | 'daily' | 'weekly' | 'disabled';
  ```

### Feature 11: Team Invitation API
- **Description**: Backend endpoint to send team invitations
- **Acceptance Criteria**:
  - [ ] `POST /api/projects/:id/invitations`
  - [ ] Body: `{ members: [{ email, role, notificationLevel }] }`
  - [ ] Sends invitation emails (or queues them)
  - [ ] Creates pending project_member records
  - [ ] Returns invitation status per member
- **Technical Notes**: Consider email service integration (SendGrid, SES)

## Technical Considerations
- Step 3 (Advanced) is optional for Alex persona - provide "Skip" option
- Step 4 (Team) is optional for Alex and Sam - provide "Skip" option
- Form state should persist selections when navigating back
- Consider collapsible sections for advanced settings to reduce cognitive load
- Tag inputs should support paste (comma-separated values)
- Directory sync is complex - can be placeholder initially

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Step 3 shows advanced settings with all options
- [ ] Step 4 shows team invitation interface
- [ ] Settings persist in form state
- [ ] Navigation to Step 5 (Review) works
- [ ] Skip buttons work for optional steps
- [ ] API endpoint for invitations working
- [ ] Unit tests for form validation
- [ ] Component tests for dynamic form rows

## Notes
- Alex persona typically skips both Step 3 and Step 4
- Sam persona uses Step 3 extensively, may skip Step 4
- Maya persona uses both Step 3 (security options) and Step 4 (team)
- Advanced settings can have defaults that work for most users
- Consider "Show advanced" toggle instead of full step for simpler personas
- Step 3 settings directly affect ingestion behavior in Sprint PC5
