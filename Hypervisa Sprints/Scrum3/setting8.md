# Setting Sprint 8: Members (Team Management)

## Overview
Implements team member management for Teams and Enterprise plans, including invitations, role assignment, and granular permissions control.

## Prerequisites
- **Sprint 1 Complete**: Settings infrastructure
- **Sprint 2 Complete**: User profile (roles foundation)
- **Sprint 4 Complete**: Security (permissions require security context)
- **Sprint 7 Complete**: Billing (seat limits from subscription)

## Plan Requirement
**Teams** and **Enterprise** plans only.

## Deliverables

### 1. Team Overview
- Member list with avatar, name, email, role, status
- Quick stats: Total/active members, pending invites, available seats

### 2. Role System
| Role | Permissions |
|------|-------------|
| Owner | All permissions |
| Admin | All except billing, transfer |
| Member | Read/write contexts, limited settings |
| Viewer | View contexts only |

### 3. Invite Members
- Enter email(s), select role, optional message
- Invitation email with branded template
- 7-day expiration

### 4. Pending Invitations
- List with resend/cancel options
- Shows inviter, sent date, expiration

### 5. Member Management
- Change roles, deactivate/reactivate members
- Remove with data handling options

## Database Schema
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  max_seats INTEGER DEFAULT 5
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Acceptance Criteria
- [ ] Member list displays all team members
- [ ] Seat count shows current/max
- [ ] Can invite new members by email
- [ ] Invitation emails are sent
- [ ] Roles can be changed
- [ ] Members can be removed
- [ ] Plan gate prevents access for non-Teams plans

## Files to Create/Modify
- `app/settings/members/page.tsx`
- `components/Settings/Members/MemberList.tsx`
- `components/Settings/Members/InviteModal.tsx`
- `components/Settings/Members/PendingInvitations.tsx`
- `components/Settings/Members/RoleSelect.tsx`
- `contexts/TeamContext.tsx`
