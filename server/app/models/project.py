"""Project domain Pydantic models matching SQL schema and TypeScript interfaces."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from server.app.models.base import BaseSchema, TimestampMixin
from server.app.models.enums import (
    ChunkingStrategy,
    GitProvider,
    IngestionPhase,
    ProjectMemberRole,
    ProjectPrivacy,
    ProjectStatus,
    ProjectType,
    RepositoryStatus,
)


# --- Project ---

class ProjectCreate(BaseSchema):
    """Request body for creating a project."""

    name: str = Field(min_length=3, max_length=50)
    description: str | None = None
    type: ProjectType = ProjectType.REPOSITORY
    privacy: ProjectPrivacy = ProjectPrivacy.PRIVATE
    chunking_strategy: ChunkingStrategy = ChunkingStrategy.SEMANTIC
    include_metadata: bool = True
    anonymize_secrets: bool = True
    custom_settings: dict[str, Any] | None = None


class ProjectUpdate(BaseSchema):
    """Request body for updating a project."""

    name: str | None = Field(None, min_length=3, max_length=50)
    description: str | None = None
    privacy: ProjectPrivacy | None = None
    chunking_strategy: ChunkingStrategy | None = None
    include_metadata: bool | None = None
    anonymize_secrets: bool | None = None
    custom_settings: dict[str, Any] | None = None


class ProjectResponse(BaseSchema, TimestampMixin):
    """Full project entity returned in responses."""

    id: UUID
    user_id: UUID
    organization_id: UUID
    name: str
    description: str | None
    type: ProjectType
    status: ProjectStatus
    privacy: ProjectPrivacy
    chunking_strategy: ChunkingStrategy
    include_metadata: bool
    anonymize_secrets: bool
    custom_settings: dict[str, Any] | None
    total_repos: int
    total_files: int
    original_tokens: int | None
    optimized_tokens: int | None
    ingestion_time_seconds: int | None


class ProjectWithRelations(ProjectResponse):
    """Project with related data (repos, members, progress)."""

    repositories: list["RepositoryResponse"] = []
    members: list["MemberResponse"] = []
    ingestion_progress: "IngestionProgressResponse | None" = None


# --- Repository ---

class RepositoryCreate(BaseSchema):
    """Request body for adding a repository to a project."""

    provider: GitProvider
    repository_url: str = Field(pattern=r"^https?://")
    repository_name: str = Field(max_length=200)
    branch: str = "main"
    include_paths: list[str] = []
    exclude_paths: list[str] = []


class RepositoryResponse(BaseSchema, TimestampMixin):
    """Full repository entity."""

    id: UUID
    project_id: UUID
    provider: GitProvider
    repository_url: str
    repository_name: str
    branch: str
    status: RepositoryStatus
    last_sync_at: datetime | None
    last_commit_hash: str | None
    file_count: int | None
    include_paths: list[str]
    exclude_paths: list[str]


# --- Member ---

class MemberCreate(BaseSchema):
    """Request body for adding a member to a project."""

    email: str = Field(pattern=r"^[^@]+@[^@]+\.[^@]+$")
    name: str | None = Field(None, max_length=100)
    role: ProjectMemberRole = ProjectMemberRole.VIEWER


class MemberUpdate(BaseSchema):
    """Request body for updating a member."""

    role: ProjectMemberRole | None = None
    notify_on_ingestion: bool | None = None
    notify_on_error: bool | None = None
    notify_on_team_changes: bool | None = None


class MemberResponse(BaseSchema, TimestampMixin):
    """Full member entity."""

    id: UUID
    project_id: UUID
    user_id: UUID
    email: str
    name: str | None
    avatar_url: str | None
    role: ProjectMemberRole
    notify_on_ingestion: bool
    notify_on_error: bool
    notify_on_team_changes: bool
    invited_at: datetime
    accepted_at: datetime | None
    last_active_at: datetime | None


class BulkInviteRequest(BaseSchema):
    """Request body for bulk member invitations."""

    emails: list[str] = Field(min_length=1)
    role: ProjectMemberRole = ProjectMemberRole.VIEWER


# --- Ingestion Progress ---

class IngestionProgressResponse(BaseSchema, TimestampMixin):
    """Ingestion progress tracking."""

    id: UUID
    project_id: UUID
    phase: IngestionPhase
    progress_percent: int
    message: str | None
    metrics: dict[str, Any]
    started_at: datetime
    estimated_completion_at: datetime | None
    completed_at: datetime | None
    error_message: str | None
    error_code: str | None


# --- Project File ---

class ProjectFileResponse(BaseSchema, TimestampMixin):
    """Uploaded file metadata."""

    id: UUID
    project_id: UUID
    name: str
    path: str
    mime_type: str | None
    size_bytes: int
    checksum: str | None
    storage_key: str
    storage_provider: str
    processed: bool
    processed_at: datetime | None


# --- Validation ---

class ProjectNameValidation(BaseSchema):
    """Response for project name uniqueness check."""

    available: bool
    name: str
    message: str | None = None


class RepositoryUrlValidation(BaseSchema):
    """Response for repository URL accessibility check."""

    accessible: bool
    url: str
    message: str | None = None


# Forward reference resolution
ProjectWithRelations.model_rebuild()
