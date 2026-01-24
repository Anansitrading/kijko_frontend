# Sprint PC1: Foundation & Database Schema

## Goal
Establish the database schema, TypeScript types, and API structure for the entire project creation flow.

## Prerequisites Completed By This Sprint
- Database tables ready for all subsequent sprints
- TypeScript types/interfaces available for UI components
- Base API endpoints scaffolded
- WebSocket infrastructure in place for Sprint PC5

## Dependencies From Previous Sprints
None - This is the foundation sprint.

## Deliverables

### Feature 1: Database Schema Implementation
- **Description**: Create all database tables for projects, repositories, team members, and ingestion tracking
- **Acceptance Criteria**:
  - [ ] `projects` table created with all fields (id, user_id, organization_id, name, description, type, status, privacy, settings, stats)
  - [ ] `project_repositories` table created with repo tracking fields
  - [ ] `project_members` table created with role and notification preferences
  - [ ] `ingestion_progress` table created for real-time progress tracking
  - [ ] All UNIQUE constraints and indexes in place
  - [ ] Foreign key relationships properly defined
- **Technical Notes**:
  ```sql
  -- Key tables to create:
  CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    type ENUM('repository', 'files', 'manual') NOT NULL,
    status ENUM('draft', 'processing', 'active', 'error') DEFAULT 'draft',
    privacy ENUM('private', 'shared') DEFAULT 'private',
    chunking_strategy VARCHAR(20) DEFAULT 'semantic',
    include_metadata BOOLEAN DEFAULT TRUE,
    anonymize_secrets BOOLEAN DEFAULT TRUE,
    total_repos INT DEFAULT 0,
    total_files INT DEFAULT 0,
    original_tokens INT,
    optimized_tokens INT,
    ingestion_time_seconds INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE project_repositories (...);
  CREATE TABLE project_members (...);
  CREATE TABLE ingestion_progress (...);
  ```

### Feature 2: TypeScript Types & Interfaces
- **Description**: Define all TypeScript types for the project creation flow
- **Acceptance Criteria**:
  - [ ] `Project` interface with all fields
  - [ ] `ProjectRepository` interface
  - [ ] `ProjectMember` interface with role types
  - [ ] `IngestionProgress` interface with phase enum
  - [ ] `ProjectCreationForm` type for form state
  - [ ] `PersonaType` enum (alex, maya, sam)
  - [ ] `ChunkingStrategy` enum
  - [ ] `ProjectType` enum (repository, files, manual)
- **Technical Notes**:
  ```typescript
  // types/project.ts
  export type ProjectType = 'repository' | 'files' | 'manual';
  export type ProjectStatus = 'draft' | 'processing' | 'active' | 'error';
  export type ChunkingStrategy = 'semantic' | 'fixed' | 'recursive' | 'custom';
  export type PersonaType = 'alex' | 'maya' | 'sam';
  export type MemberRole = 'admin' | 'manager' | 'developer' | 'viewer' | 'auditor';
  export type IngestionPhase = 'repository_fetch' | 'parsing' | 'chunking' | 'optimization' | 'indexing';

  export interface Project {
    id: string;
    userId: string;
    organizationId: string;
    name: string;
    description?: string;
    type: ProjectType;
    status: ProjectStatus;
    // ... etc
  }
  ```

### Feature 3: Base API Endpoints Structure
- **Description**: Scaffold API endpoints for project CRUD operations
- **Acceptance Criteria**:
  - [ ] `POST /api/projects` - Create new project
  - [ ] `GET /api/projects/:id` - Get project details
  - [ ] `PUT /api/projects/:id` - Update project
  - [ ] `DELETE /api/projects/:id` - Delete project
  - [ ] `POST /api/projects/:id/repositories` - Add repository
  - [ ] `POST /api/projects/:id/members` - Add team member
  - [ ] `GET /api/projects/:id/progress` - Get ingestion progress
  - [ ] Request/Response types defined
  - [ ] Error handling structure in place
- **Technical Notes**: Use REST conventions, return proper HTTP status codes

### Feature 4: WebSocket Infrastructure
- **Description**: Set up WebSocket server for real-time ingestion updates
- **Acceptance Criteria**:
  - [ ] Socket.io or similar WebSocket library integrated
  - [ ] Namespace pattern: `/api/projects/:projectId`
  - [ ] Event types defined: `phase_started`, `progress_update`, `ingestion_complete`, `error`
  - [ ] Connection authentication via token
  - [ ] Basic emit/subscribe pattern working
- **Technical Notes**:
  ```typescript
  // WebSocket event types
  interface PhaseStartedEvent {
    phase: IngestionPhase;
    message: string;
    startTime: Date;
  }

  interface ProgressUpdateEvent {
    phase: IngestionPhase;
    progressPercent: number;
    metrics: IngestionMetrics;
  }
  ```

### Feature 5: Form State Management Setup
- **Description**: Set up form state management for multi-step wizard
- **Acceptance Criteria**:
  - [ ] Form context/store created (React Context or Zustand)
  - [ ] Multi-step navigation state
  - [ ] Form data persistence between steps
  - [ ] Reset/clear functionality
  - [ ] Step validation state tracking
- **Technical Notes**: Consider using react-hook-form with zod for validation

## Technical Considerations
- Use UUID for all primary keys (consistent with existing codebase)
- Ensure database migrations are reversible
- WebSocket namespace pattern should match REST API structure
- Form state should support both client-side and server-side validation
- Consider using optimistic updates for better UX

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Database migrations created and tested
- [ ] TypeScript compiles without errors
- [ ] API endpoints return proper responses (can be stubs)
- [ ] WebSocket connection establishes successfully
- [ ] Unit tests for types and utilities

## Notes
- This sprint creates no visible UI - it's purely infrastructure
- All subsequent sprints depend on these foundations
- The database schema supports all three personas (Alex, Maya, Sam)
- WebSocket infrastructure will be fully utilized in Sprint PC5
