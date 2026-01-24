# Sprint PC3: Repository & Files Configuration (Step 2)

## Goal
Build all three variants of Step 2: Single Repository (2A), Batch Import (2B), and File Upload (2C).

## Prerequisites Completed By This Sprint
- Repository URL input with validation and OAuth
- Batch repository import via platform connection or CSV
- File/folder upload with drag-and-drop
- Smart filters for excluding dependencies/build artifacts
- Repository info preview cards

## Dependencies From Previous Sprints
- **Sprint PC1**: Database schema, API structure, TypeScript types
- **Sprint PC2**: Modal shell, form state management, Step 1 data

## Deliverables

### Feature 1: Step 2A - Single Repository Input (Alex/Sam Path)
- **Description**: Simple repository URL input with validation and suggestions
- **Acceptance Criteria**:
  - [ ] Text input for repository URL
  - [ ] Accepts GitHub, GitLab, Bitbucket URLs
  - [ ] Real-time URL validation (format + accessibility)
  - [ ] GitHub/GitLab OAuth button for private repos
  - [ ] Smart suggestions based on user history (last 5 repos)
  - [ ] "+ Add another repo" link for upgrade path
  - [ ] Repository info card on valid URL (hover/focus)
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────────────┐
  │ Repository URL *                             │
  │ ┌──────────────────────────────────────────┐│
  │ │ github.com/user/repo                     ││
  │ └──────────────────────────────────────────┘│
  │                                              │
  │ Smart Suggestion (based on history):         │
  │ ◉ ai-agent-builder  (last analyzed)         │
  │ ○ portfolio-website (2 weeks ago)           │
  └──────────────────────────────────────────────┘
  ```

### Feature 2: Repository URL Validation
- **Description**: Validate repository URLs and check accessibility
- **Acceptance Criteria**:
  - [ ] URL format validation (regex for GitHub/GitLab/Bitbucket)
  - [ ] API call to check repo existence and access
  - [ ] Handle private repos (prompt for OAuth)
  - [ ] Show loading state while validating
  - [ ] Display error message for invalid/inaccessible repos
  - [ ] Return repo metadata on success (name, stars, size, language)
- **Technical Notes**:
  ```typescript
  const validateRepoUrl = async (url: string): Promise<RepoValidation> => {
    // 1. Format check
    const pattern = /^(https?:\/\/)?(github|gitlab|bitbucket)\.(com|org)\/[\w-]+\/[\w-]+/;
    if (!pattern.test(url)) {
      return { valid: false, error: 'Invalid repository URL format' };
    }

    // 2. API check
    try {
      const info = await fetchRepoInfo(url);
      return { valid: true, info };
    } catch (err) {
      return { valid: false, error: 'Repository not found or not accessible' };
    }
  };
  ```

### Feature 3: Repository Info Card
- **Description**: Display repository metadata in a preview card
- **Acceptance Criteria**:
  - [ ] Shows on valid URL (inline or on hover)
  - [ ] Displays: repo name, commits/month, file count, LOC estimate
  - [ ] Shows primary language with icon
  - [ ] Shows last update date
  - [ ] Loading skeleton while fetching
  - [ ] Error state if fetch fails
- **Technical Notes**:
  ```
  anthropic-sdk-python
  ━━━━━━━━━━━━━━━━━━━
  234 commits / month
  127 files • 45K LOC
  TypeScript
  Last updated: 2 days ago
  ```

### Feature 4: OAuth Integration for Private Repos
- **Description**: GitHub/GitLab OAuth flow for accessing private repositories
- **Acceptance Criteria**:
  - [ ] OAuth buttons for GitHub, GitLab
  - [ ] Opens OAuth popup/redirect flow
  - [ ] Stores access token securely
  - [ ] Shows connected account status
  - [ ] Ability to disconnect/reconnect
  - [ ] Handles OAuth errors gracefully
- **Technical Notes**: Use existing OAuth infrastructure if available

### Feature 5: Step 2B - Batch Repository Import (Maya/Enterprise Path)
- **Description**: Bulk import repositories from code platforms or CSV
- **Acceptance Criteria**:
  - [ ] Platform selection: GitHub Enterprise, GitLab, Bitbucket, Azure DevOps
  - [ ] "Authenticate" button per platform
  - [ ] CSV drag-and-drop upload zone
  - [ ] CSV format: `repo_url, team, priority`
  - [ ] Filter options: All repos, Updated in last 30 days, By team, Include archived
  - [ ] Repo count display (e.g., "234 total", "89 filtered")
  - [ ] Select/deselect individual repos from list
- **Technical Notes**:
  ```
  ┌──────────────────────────────────────────────────┐
  │ Connecteer je code platform *                    │
  │ ◉ GitHub Enterprise                              │
  │ ○ GitLab (Self-hosted / Cloud)                   │
  │ ○ Bitbucket                                      │
  │ ○ Azure DevOps                                   │
  │                                                  │
  │ [Authenticate →]                                 │
  │                                                  │
  │ ─────── of ───────                               │
  │                                                  │
  │ Bulk import via CSV:                             │
  │ ┌──────────────────────────────────────────────┐│
  │ │ Sleep CSV file hier of klik                  ││
  │ └──────────────────────────────────────────────┘│
  └──────────────────────────────────────────────────┘
  ```

### Feature 6: Step 2C - File Upload
- **Description**: Upload files/folders directly instead of from repository
- **Acceptance Criteria**:
  - [ ] Drag-and-drop zone for files/folders
  - [ ] "Browse" button as alternative
  - [ ] Accepts: .zip files, individual files, folder selection
  - [ ] Smart filter checkboxes:
    - [ ] Exclude node_modules & dependencies (default: checked)
    - [ ] Exclude build artifacts /dist, /build (default: checked)
    - [ ] Exclude test files *test*, *spec* (default: checked)
    - [ ] Include documentation README, docs/ (default: unchecked)
  - [ ] File list preview with sizes
  - [ ] Progress indicator for large uploads
- **Technical Notes**:
  ```typescript
  interface FileFilter {
    excludeNodeModules: boolean;
    excludeBuildArtifacts: boolean;
    excludeTests: boolean;
    includeDocumentation: boolean;
  }

  const defaultFilters: FileFilter = {
    excludeNodeModules: true,
    excludeBuildArtifacts: true,
    excludeTests: true,
    includeDocumentation: false
  };
  ```

### Feature 7: Repository Suggestions API
- **Description**: Backend endpoint to fetch user's recently analyzed repos
- **Acceptance Criteria**:
  - [ ] `GET /api/users/:userId/recent-repos`
  - [ ] Returns last 5 unique repos with usage stats
  - [ ] Includes: repo_url, last_analyzed, usage_count
  - [ ] Sorted by recency + frequency
  - [ ] Cached for performance
- **Technical Notes**:
  ```typescript
  interface RecentRepo {
    repoUrl: string;
    repoName: string;
    lastAnalyzed: Date;
    usageCount: number;
  }
  ```

## Technical Considerations
- Use react-dropzone for file upload functionality
- Debounce URL validation (500ms) to reduce API calls
- Store OAuth tokens securely (encrypted, httpOnly cookies or secure storage)
- CSV parsing should handle malformed data gracefully
- Consider chunked upload for large files (>50MB)
- Repository list virtualization for batch import (100+ repos)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Step 2A works for single repo selection
- [ ] Step 2B works for batch import (at least GitHub)
- [ ] Step 2C works for file upload
- [ ] OAuth flow completes successfully
- [ ] Navigation from Step 1 shows correct variant
- [ ] Navigation to Step 3 (or Step 5 for Alex) works
- [ ] Unit tests for validation logic
- [ ] Integration tests for OAuth flow

## Notes
- Step 2A is the default for Alex and Sam personas
- Step 2B is shown when Maya persona or enterprise features detected
- Step 2C is fallback when repository access isn't available
- Alex's flow can skip directly to Step 5 (Review) from Step 2A
- Sam's flow proceeds to Step 3 (Advanced Settings) from Step 2A
- Maya's flow proceeds to Step 3 (Advanced) then Step 4 (Team)
