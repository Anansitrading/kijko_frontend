"""Projects router — CRUD endpoints for projects, repositories, members."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client as SupabaseClient

from server.app.dependencies import get_supabase
from server.app.middleware.auth import require_auth
from server.app.models.base import MessageResponse, PaginatedResponse
from server.app.models.project import (
    BulkInviteRequest,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    ProjectCreate,
    ProjectNameValidation,
    ProjectResponse,
    ProjectUpdate,
    ProjectWithRelations,
    RepositoryCreate,
    RepositoryResponse,
    RepositoryUrlValidation,
    IngestionProgressResponse,
    ProjectFileResponse,
)
from server.app.services import projects as project_service

router = APIRouter(prefix="/projects", tags=["projects"])


# =========================================================================
# Project CRUD
# =========================================================================

@router.get("", response_model=PaginatedResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    type_filter: str | None = Query(None, alias="type"),
    search: str | None = None,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List projects for the current organization."""
    return await project_service.list_projects(
        db, page=page, page_size=page_size,
        status=status_filter, project_type=type_filter, search=search,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Create a new project."""
    return await project_service.create_project(
        db, data=body.model_dump(), user_id=user["sub"], org_id=user["org_id"],
    )


@router.get("/{project_id}", response_model=ProjectWithRelations)
async def get_project(
    project_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get a project with all related data."""
    result = await project_service.get_project_with_relations(db, project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Update a project."""
    result = await project_service.update_project(
        db, project_id, data=body.model_dump(exclude_unset=True),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Delete a project and all related data."""
    deleted = await project_service.delete_project(db, project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return MessageResponse(message="Project deleted successfully")


@router.post("/validate-name", response_model=ProjectNameValidation)
async def validate_name(
    body: dict,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Validate project name uniqueness within the organization."""
    return await project_service.validate_project_name(
        db, name=body.get("name", ""), exclude_id=body.get("exclude_id"),
    )


@router.post("/validate-repository", response_model=RepositoryUrlValidation)
async def validate_repository(
    body: dict,
    user: dict = Depends(require_auth),
):
    """Validate a repository URL and extract provider info."""
    return project_service.validate_repository_url(body.get("url", ""))


# =========================================================================
# Repositories
# =========================================================================

@router.get("/{project_id}/repositories", response_model=list[RepositoryResponse])
async def list_repositories(
    project_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List repositories for a project."""
    return await project_service.list_repositories(db, project_id)


@router.post(
    "/{project_id}/repositories",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_repository(
    project_id: UUID,
    body: RepositoryCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Add a repository to a project."""
    return await project_service.add_repository(
        db, project_id, data=body.model_dump(),
    )


@router.delete("/{project_id}/repositories/{repo_id}", response_model=MessageResponse)
async def remove_repository(
    project_id: UUID,
    repo_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Remove a repository from a project."""
    deleted = await project_service.remove_repository(db, project_id, repo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Repository not found")
    return MessageResponse(message="Repository removed successfully")


# =========================================================================
# Members
# =========================================================================

@router.get("/{project_id}/members", response_model=list[MemberResponse])
async def list_members(
    project_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List members of a project."""
    return await project_service.list_members(db, project_id)


@router.post(
    "/{project_id}/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    project_id: UUID,
    body: MemberCreate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Add a member to a project."""
    return await project_service.add_member(
        db, project_id, data=body.model_dump(),
    )


@router.patch("/{project_id}/members/{member_id}", response_model=MemberResponse)
async def update_member(
    project_id: UUID,
    member_id: UUID,
    body: MemberUpdate,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Update a member's role or notification settings."""
    result = await project_service.update_member(
        db, project_id, member_id, data=body.model_dump(exclude_unset=True),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Member not found")
    return result


@router.delete("/{project_id}/members/{member_id}", response_model=MessageResponse)
async def remove_member(
    project_id: UUID,
    member_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Remove a member from a project."""
    deleted = await project_service.remove_member(db, project_id, member_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Member not found")
    return MessageResponse(message="Member removed successfully")


@router.post("/{project_id}/members/bulk-invite")
async def bulk_invite(
    project_id: UUID,
    body: BulkInviteRequest,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Bulk invite members to a project."""
    return await project_service.bulk_invite_members(
        db, project_id,
        invitations=[inv.model_dump() for inv in body.invitations],
    )


# =========================================================================
# Ingestion & Files
# =========================================================================

@router.get("/{project_id}/ingestion")
async def get_ingestion_progress(
    project_id: UUID,
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """Get current ingestion progress for a project."""
    result = await project_service.get_ingestion_progress(db, project_id)
    if not result:
        return {"status": "idle", "project_id": str(project_id)}
    return result


@router.get("/{project_id}/files", response_model=PaginatedResponse)
async def list_files(
    project_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_auth),
    db: SupabaseClient = Depends(get_supabase),
):
    """List files for a project."""
    return await project_service.list_project_files(
        db, project_id, page=page, page_size=page_size,
    )
