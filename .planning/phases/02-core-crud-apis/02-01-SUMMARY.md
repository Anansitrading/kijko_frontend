# Plan 02-01 Summary: Projects CRUD

## Status: COMPLETE

## What was built
- `server/app/services/projects.py` — Full project service with 16 functions:
  - CRUD: list, get, get_with_relations, create, update, delete
  - Repositories: list, add, remove
  - Members: list, add, update, remove, bulk_invite
  - Ingestion: get_ingestion_progress
  - Files: list_project_files
  - Validation: validate_project_name, validate_repository_url

- `server/app/routers/projects.py` — 17 API endpoints:
  - `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}`
  - `POST /projects/validate-name`, `POST /projects/validate-repository`
  - `GET/POST /projects/{id}/repositories`, `DELETE /projects/{id}/repositories/{repo_id}`
  - `GET/POST /projects/{id}/members`, `PATCH/DELETE /projects/{id}/members/{member_id}`
  - `POST /projects/{id}/members/bulk-invite`
  - `GET /projects/{id}/ingestion`, `GET /projects/{id}/files`

## Key decisions
- Repository URL validation done in-process (regex-based provider detection)
- Bulk invite returns individual success/failure per invitation
- Ingestion progress returns `{"status": "idle"}` when no ingestion active
