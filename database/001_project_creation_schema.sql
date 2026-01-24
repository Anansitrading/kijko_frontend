-- =============================================================================
-- Migration: 001_project_creation_schema
-- Description: Database schema for project creation flow
-- Sprint: PC1 - Foundation & Database Schema
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM Types
-- =============================================================================

-- Project type determines how code is ingested
CREATE TYPE project_type AS ENUM ('repository', 'files', 'manual');

-- Project lifecycle status
CREATE TYPE project_status AS ENUM ('draft', 'processing', 'active', 'error');

-- Privacy level for project visibility
CREATE TYPE project_privacy AS ENUM ('private', 'shared');

-- Chunking strategy for code processing
CREATE TYPE chunking_strategy AS ENUM ('semantic', 'fixed', 'recursive', 'custom');

-- Git provider supported
CREATE TYPE git_provider AS ENUM ('github', 'gitlab', 'bitbucket', 'azure');

-- Repository sync status
CREATE TYPE repository_status AS ENUM ('pending', 'connected', 'syncing', 'error');

-- Project member role (distinct from team roles)
CREATE TYPE project_member_role AS ENUM ('admin', 'manager', 'developer', 'viewer', 'auditor');

-- Ingestion process phases
CREATE TYPE ingestion_phase AS ENUM (
  'repository_fetch',
  'parsing',
  'chunking',
  'optimization',
  'indexing'
);

-- =============================================================================
-- Table: projects
-- Main projects table storing all project metadata
-- =============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,

  -- Basic info
  name VARCHAR(50) NOT NULL,
  description TEXT,
  type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  privacy project_privacy NOT NULL DEFAULT 'private',

  -- Processing settings
  chunking_strategy chunking_strategy NOT NULL DEFAULT 'semantic',
  include_metadata BOOLEAN NOT NULL DEFAULT TRUE,
  anonymize_secrets BOOLEAN NOT NULL DEFAULT TRUE,
  custom_settings JSONB,

  -- Stats (updated during/after ingestion)
  total_repos INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  original_tokens INTEGER,
  optimized_tokens INTEGER,
  ingestion_time_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT projects_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 50)
);

-- Indexes for projects
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE UNIQUE INDEX idx_projects_name_org ON projects(organization_id, LOWER(name));

-- =============================================================================
-- Table: project_repositories
-- Stores repository connections for projects
-- =============================================================================

CREATE TABLE project_repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Repository info
  provider git_provider NOT NULL,
  repository_url VARCHAR(500) NOT NULL,
  repository_name VARCHAR(200) NOT NULL,
  branch VARCHAR(100) NOT NULL DEFAULT 'main',
  status repository_status NOT NULL DEFAULT 'pending',

  -- Sync tracking
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_commit_hash VARCHAR(64),
  file_count INTEGER,

  -- Filter settings (stored as JSON arrays)
  include_paths JSONB DEFAULT '[]'::JSONB,
  exclude_paths JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT project_repositories_url_valid CHECK (repository_url ~ '^https?://')
);

-- Indexes for project_repositories
CREATE INDEX idx_project_repositories_project_id ON project_repositories(project_id);
CREATE INDEX idx_project_repositories_provider ON project_repositories(provider);
CREATE INDEX idx_project_repositories_status ON project_repositories(status);
CREATE UNIQUE INDEX idx_project_repositories_unique ON project_repositories(project_id, repository_url, branch);

-- =============================================================================
-- Table: project_members
-- Stores team members with project access
-- =============================================================================

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Member info
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url VARCHAR(500),
  role project_member_role NOT NULL DEFAULT 'viewer',

  -- Notification preferences
  notify_on_ingestion BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_error BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_team_changes BOOLEAN NOT NULL DEFAULT TRUE,

  -- Status tracking
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT project_members_email_valid CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Indexes for project_members
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_email ON project_members(email);
CREATE INDEX idx_project_members_role ON project_members(role);
CREATE UNIQUE INDEX idx_project_members_unique ON project_members(project_id, user_id);
CREATE UNIQUE INDEX idx_project_members_email_unique ON project_members(project_id, LOWER(email));

-- =============================================================================
-- Table: ingestion_progress
-- Real-time tracking of ingestion process
-- =============================================================================

CREATE TABLE ingestion_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Progress tracking
  phase ingestion_phase NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  message TEXT,

  -- Metrics (stored as JSONB for flexibility)
  metrics JSONB NOT NULL DEFAULT '{
    "filesProcessed": 0,
    "totalFiles": 0,
    "tokensProcessed": 0,
    "bytesProcessed": 0,
    "chunksCreated": 0,
    "errorsEncountered": 0
  }'::JSONB,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  estimated_completion_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT,
  error_code VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for ingestion_progress
CREATE INDEX idx_ingestion_progress_project_id ON ingestion_progress(project_id);
CREATE INDEX idx_ingestion_progress_phase ON ingestion_progress(phase);
CREATE INDEX idx_ingestion_progress_started_at ON ingestion_progress(started_at DESC);

-- Only one active ingestion per project (not completed)
CREATE UNIQUE INDEX idx_ingestion_progress_active ON ingestion_progress(project_id)
  WHERE completed_at IS NULL;

-- =============================================================================
-- Table: project_files (for 'files' type projects)
-- Stores uploaded files metadata
-- =============================================================================

CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- File info
  name VARCHAR(255) NOT NULL,
  path VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64), -- SHA-256 hash

  -- Storage
  storage_key VARCHAR(500) NOT NULL, -- S3/storage path
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',

  -- Processing status
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for project_files
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_mime_type ON project_files(mime_type);
CREATE UNIQUE INDEX idx_project_files_path ON project_files(project_id, path);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_repositories_updated_at
  BEFORE UPDATE ON project_repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingestion_progress_updated_at
  BEFORE UPDATE ON ingestion_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Trigger to update project stats
-- =============================================================================

-- Function to update project repository count
CREATE OR REPLACE FUNCTION update_project_repo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE projects
    SET total_repos = (
      SELECT COUNT(*) FROM project_repositories WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_repo_count
  AFTER INSERT OR DELETE ON project_repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_project_repo_count();

-- Function to update project file count
CREATE OR REPLACE FUNCTION update_project_file_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE projects
    SET total_files = (
      SELECT COUNT(*) FROM project_files WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_file_count
  AFTER INSERT OR DELETE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_project_file_count();

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies should be defined based on your auth system
-- Example policies (using Supabase auth.uid() pattern):

-- Projects: Users can see their own projects or projects they're members of
-- CREATE POLICY "Users can view own projects" ON projects
--   FOR SELECT USING (
--     user_id = auth.uid() OR
--     id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
--   );

-- CREATE POLICY "Users can create projects" ON projects
--   FOR INSERT WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "Project admins can update" ON projects
--   FOR UPDATE USING (
--     user_id = auth.uid() OR
--     id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
--   );

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE projects IS 'Main projects table for code intelligence workspaces';
COMMENT ON TABLE project_repositories IS 'Git repositories connected to projects';
COMMENT ON TABLE project_members IS 'Team members with access to projects';
COMMENT ON TABLE ingestion_progress IS 'Real-time tracking of code ingestion process';
COMMENT ON TABLE project_files IS 'Uploaded files for file-type projects';

COMMENT ON COLUMN projects.chunking_strategy IS 'Strategy for splitting code: semantic (AST-aware), fixed (token count), recursive (hierarchical), custom';
COMMENT ON COLUMN projects.anonymize_secrets IS 'Whether to detect and mask secrets/credentials in code';
COMMENT ON COLUMN ingestion_progress.metrics IS 'JSON object with filesProcessed, totalFiles, tokensProcessed, bytesProcessed, chunksCreated, errorsEncountered';
