// Team Types
// Sprint 8: Team Members

import type { Role, RolePermissions, TeamRole, TEAM_ROLES } from '../roles';

// Re-export role types for convenience
export type { Role, RolePermissions, TeamRole };
export { TEAM_ROLES };

// Team member status
export type TeamMemberStatus = 'active' | 'inactive' | 'pending';

// Team invitation status
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

// Team entity
export interface Team {
  id: string;
  name: string;
  ownerId: string;
  maxSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

// Team member entity
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: Date;
  lastActiveAt?: Date;
}

// Team invitation entity
export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: {
    id: string;
    name: string;
  };
  message?: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

// Team stats
export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  availableSeats: number;
  maxSeats: number;
}

// Invite member form data
export interface InviteMemberData {
  emails: string[];
  role: TeamRole;
  message?: string;
}

// Team context state
export interface TeamState {
  team: Team | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  stats: TeamStats;
  currentUserRole: TeamRole | null;
  isLoading: boolean;
  error: string | null;
}

// Team context actions
export type TeamAction =
  | { type: 'SET_TEAM'; payload: Team }
  | { type: 'SET_MEMBERS'; payload: TeamMember[] }
  | { type: 'ADD_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'SET_INVITATIONS'; payload: TeamInvitation[] }
  | { type: 'ADD_INVITATION'; payload: TeamInvitation }
  | { type: 'UPDATE_INVITATION'; payload: { id: string; updates: Partial<TeamInvitation> } }
  | { type: 'REMOVE_INVITATION'; payload: string }
  | { type: 'SET_STATS'; payload: TeamStats }
  | { type: 'SET_CURRENT_USER_ROLE'; payload: TeamRole }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Component Props for Members Section

export interface MemberListProps {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: TeamRole;
  onRoleChange: (memberId: string, newRole: TeamRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onDeactivateMember: (memberId: string) => Promise<void>;
  onReactivateMember: (memberId: string) => Promise<void>;
}

export interface RoleSelectProps {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  disabled?: boolean;
  disabledRoles?: TeamRole[];
  size?: 'sm' | 'md';
}

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteMemberData) => Promise<void>;
  availableSeats: number;
}

export interface PendingInvitationsProps {
  invitations: TeamInvitation[];
  onResend: (invitationId: string) => Promise<void>;
  onCancel: (invitationId: string) => Promise<void>;
}

export interface TeamOverviewProps {
  stats: TeamStats;
  onInviteClick: () => void;
}

export interface MemberActionsMenuProps {
  member: TeamMember;
  currentUserRole: TeamRole;
  onRoleChange: (role: TeamRole) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onRemove: () => void;
}
