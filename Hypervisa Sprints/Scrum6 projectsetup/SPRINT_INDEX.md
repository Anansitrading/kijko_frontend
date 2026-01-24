# Project Creation Flow - Sprint Index

## Overview

This document provides an overview of all sprints for implementing the persona-driven project creation flow. The sprints are designed to be completed sequentially, with each sprint building on the previous ones.

---

## Sprint Breakdown Summary

| Sprint | Theme | Key Deliverables | Prerequisites For |
|--------|-------|------------------|-------------------|
| **PC1** | Foundation & Database | Database schema, TypeScript types, API structure, WebSocket infrastructure | PC2, PC3, PC4, PC5, PC6 |
| **PC2** | Project Basics Modal | Step 1 UI, name validation, type selection, modal shell | PC3, PC4, PC5 |
| **PC3** | Repository/Files Config | Step 2A/2B/2C, repo validation, OAuth, file upload, batch import | PC4, PC5 |
| **PC4** | Advanced & Team | Step 3 (chunking, metadata), Step 4 (team invites, roles) | PC5, PC6 |
| **PC5** | Real-Time Ingestion | Step 5 review, WebSocket progress, 4-phase feedback, completion screen | PC6 |
| ↳ PC5a | Review & Confirmation | Review screen, cost estimation, ingestion API endpoint | PC5b |
| ↳ PC5b | Progress Container & Phases | Progress container, Phase 1-4 UIs, metrics sidebar | PC5c, PC5d |
| ↳ PC5c | WebSocket Infrastructure | Event types, client hook, server emitter, reconnection, auth | PC5d |
| ↳ PC5d | Completion & Polish | Completion screen, animations, insights, next steps | PC6 |
| **PC6** | Persona & Conversion | Persona detection, flow routing, error handling, conversion CTAs | - |

---

## Detailed Sprint Overview

### Sprint PC1: Foundation & Database Schema
**Goal:** Establish the database schema, TypeScript types, and API structure for the entire project creation flow.

**Key Deliverables:**
- Database tables: `projects`, `project_repositories`, `project_members`, `ingestion_progress`
- TypeScript interfaces for all entities
- Base REST API endpoints scaffolded
- WebSocket infrastructure for real-time updates
- Form state management setup

**Duration Estimate:** Foundation sprint - should be completed first

---

### Sprint PC2: Project Basics Modal (Step 1)
**Goal:** Build the first step of the project creation wizard with project name, description, and type selection.

**Key Deliverables:**
- Modal component with header, navigation, footer
- Project name field with duplicate detection and suggestions
- Description field (optional) with character counter
- Project type radio buttons (Repository/Files/Manual)
- Form validation and step navigation

**Duration Estimate:** Simple UI sprint

---

### Sprint PC3: Repository & Files Configuration (Step 2)
**Goal:** Build all three variants of Step 2: Single Repository, Batch Import, and File Upload.

**Key Deliverables:**
- Step 2A: Single repository URL input with validation
- Step 2B: Batch repository import via platform OAuth or CSV
- Step 2C: File/folder drag-and-drop upload
- Repository info preview cards
- Smart filters for excluding dependencies

**Duration Estimate:** Medium complexity - 3 distinct UIs

---

### Sprint PC4: Advanced Configuration & Team Access (Steps 3 & 4)
**Goal:** Build the advanced settings panel and team member management for power users.

**Key Deliverables:**
- Chunking strategy selection (Semantic, Fixed, Recursive, Custom)
- Metadata extraction options
- Output format selection
- File pattern filters
- Team member invitation with roles
- Bulk team import via CSV
- Directory sync integration (Okta, Azure AD)

**Duration Estimate:** Medium complexity - enterprise features

---

### Sprint PC5: Real-Time Ingestion Feedback
**Goal:** Build the complete real-time ingestion feedback system with WebSocket updates and progress visualization.

**Key Deliverables:**
- Step 5: Review & confirmation screen
- WebSocket event handlers (client + server)
- Phase 1-4 progress UIs with real-time metrics
- Progress bar animations
- Completion screen with metrics and CTAs
- Meaningful insights generation

**Duration Estimate:** High complexity - most technical sprint

> **Note:** Due to complexity, PC5 has been split into 4 sub-sprints:

#### Sub-Sprint PC5a: Review & Confirmation Screen
**Goal:** Build Step 5 review screen and ingestion API endpoint.
- Review screen with all project settings summary
- Cost estimation logic
- `POST /api/projects/:id/ingest` endpoint

#### Sub-Sprint PC5b: Progress Container & Phase UIs
**Goal:** Build the progress visualization UI components.
- Main progress container with phase indicator
- Phase 1-4 individual UIs (Fetching, Analyzing, Chunking, Optimizing)
- Metrics sidebar/footer

#### Sub-Sprint PC5c: WebSocket Infrastructure
**Goal:** Implement real-time communication layer.
- WebSocket event types and handlers
- Client-side React hook (`useIngestionSocket`)
- Server-side event emitter service
- Reconnection logic and polling fallback
- Connection authentication

#### Sub-Sprint PC5d: Completion Screen & Polish
**Goal:** Build completion experience and add visual polish.
- Completion screen with metrics and CTAs
- Celebration animations
- Progress bar animations
- Meaningful insights generation
- Next steps checklist

---

### Sprint PC6: Persona Routing, Error Handling & Conversion
**Goal:** Implement intelligent persona detection, flow routing, and conversion optimization.

**Key Deliverables:**
- Persona detection algorithm (Alex/Maya/Sam)
- Dynamic flow routing by persona
- Error recovery for fetch/parse/chunk failures
- Retry logic with exponential backoff
- Persona-specific completion CTAs
- Analytics event tracking

**Duration Estimate:** Medium complexity - ties everything together

---

## Dependency Graph

```
PC1 (Foundation)
 ├── PC2 (Project Basics)
 │    └── PC3 (Repository/Files)
 │         └── PC4 (Advanced/Team)
 │              └── PC5 (Ingestion Feedback)
 │                   ├── PC5a (Review Screen)
 │                   │    └── PC5b (Progress UIs)
 │                   │         ├── PC5c (WebSocket)
 │                   │         └── PC5d (Completion)
 │                   └── PC6 (Persona/Conversion)
```

---

## Persona Flow Summary

### Alex (Solo Developer) - Fast Path
- **Steps:** 1 → 2A → 5
- **Emphasis:** Cost savings
- **Total time:** ~3 minutes

### Maya (Enterprise) - Complete Path
- **Steps:** 1 → 2B → 3 → 4 → 5
- **Emphasis:** Team productivity, ROI
- **Total time:** ~10-15 minutes

### Sam (AI Engineer) - Technical Path
- **Steps:** 1 → 2A → 3 → 5
- **Emphasis:** Technical metrics, API integration
- **Total time:** ~5-8 minutes

---

## Getting Started

1. Start with **Sprint PC1** to establish the foundation
2. Each subsequent sprint can begin once its dependencies are complete
3. Sprints PC2-PC4 focus on wizard UI
4. Sprint PC5 is the most complex - consider breaking into sub-tasks
5. Sprint PC6 ties everything together and enables personalization

---

## Files in This Directory

- `project-creation-flow.md` - Original complete plan document
- `sprintPC1.md` - Foundation & Database Schema
- `sprintPC2.md` - Project Basics Modal (Step 1)
- `sprintPC3.md` - Repository & Files Configuration (Step 2)
- `sprintPC4.md` - Advanced Configuration & Team Access (Steps 3 & 4)
- `sprintPC5.md` - Real-Time Ingestion Feedback (original, kept for reference)
- `sprintPC5a.md` - Sub-Sprint: Review & Confirmation Screen
- `sprintPC5b.md` - Sub-Sprint: Progress Container & Phase UIs
- `sprintPC5c.md` - Sub-Sprint: WebSocket Infrastructure
- `sprintPC5d.md` - Sub-Sprint: Completion Screen & Polish
- `sprintPC6.md` - Persona Routing, Error Handling & Conversion
- `SPRINT_INDEX.md` - This file

---

## Notes

- Each sprint file is self-contained with enough context to work independently
- Acceptance criteria are provided as checklists for easy tracking
- Technical notes include code snippets where helpful
- Definition of Done ensures quality gates are clear
