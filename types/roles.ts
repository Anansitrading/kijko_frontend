// Unified Role & Permission System
// Consolidates UserRole (context-level) and TeamRole (team-level) into a single system

// Base role type - used across both team and context levels
export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

// Legacy aliases for backwards compatibility
export type UserRole = Role;
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

// Map TeamRole 'member' to Role 'editor' for consistency
export function teamRoleToRole(teamRole: TeamRole): Role {
  return teamRole === 'member' ? 'editor' : teamRole;
}

export function roleToTeamRole(role: Role): TeamRole {
  return role === 'editor' ? 'member' : role;
}

// Role hierarchy (higher index = higher permissions)
export const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin', 'owner'];

// Check if role A has higher or equal permissions than role B
export function hasHigherOrEqualRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(roleB);
}

// Role permissions definition
export interface RolePermissions {
  // Team-level permissions
  canManageTeam: boolean;
  canManageBilling: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canManageIntegrations: boolean;
  canViewAuditLog: boolean;
  canTransferOwnership: boolean;
  // Context-level permissions
  canEditContexts: boolean;
  canViewContexts: boolean;
  canDeleteContexts: boolean;
  canShareContexts: boolean;
  canManageContextUsers: boolean;
}

// Role definitions with labels, descriptions, and permissions
export const ROLE_CONFIG: Record<Role, {
  label: string;
  description: string;
  permissions: RolePermissions;
  color: string;
}> = {
  owner: {
    label: 'Owner',
    description: 'Full access to all features including billing and ownership transfer',
    color: '#8b5cf6',
    permissions: {
      canManageTeam: true,
      canManageBilling: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canEditContexts: true,
      canViewContexts: true,
      canDeleteContexts: true,
      canShareContexts: true,
      canManageContextUsers: true,
      canManageIntegrations: true,
      canViewAuditLog: true,
      canTransferOwnership: true,
    },
  },
  admin: {
    label: 'Admin',
    description: 'Full access except billing and ownership transfer',
    color: '#3b82f6',
    permissions: {
      canManageTeam: true,
      canManageBilling: false,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canEditContexts: true,
      canViewContexts: true,
      canDeleteContexts: true,
      canShareContexts: true,
      canManageContextUsers: true,
      canManageIntegrations: true,
      canViewAuditLog: true,
      canTransferOwnership: false,
    },
  },
  editor: {
    label: 'Editor',
    description: 'Can read and write contexts with limited settings access',
    color: '#10b981',
    permissions: {
      canManageTeam: false,
      canManageBilling: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canEditContexts: true,
      canViewContexts: true,
      canDeleteContexts: false,
      canShareContexts: false,
      canManageContextUsers: false,
      canManageIntegrations: false,
      canViewAuditLog: false,
      canTransferOwnership: false,
    },
  },
  viewer: {
    label: 'Viewer',
    description: 'View-only access to contexts',
    color: '#6b7280',
    permissions: {
      canManageTeam: false,
      canManageBilling: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canEditContexts: false,
      canViewContexts: true,
      canDeleteContexts: false,
      canShareContexts: false,
      canManageContextUsers: false,
      canManageIntegrations: false,
      canViewAuditLog: false,
      canTransferOwnership: false,
    },
  },
};

// Legacy TEAM_ROLES export for backwards compatibility
export const TEAM_ROLES: Record<TeamRole, { label: string; description: string; permissions: RolePermissions }> = {
  owner: ROLE_CONFIG.owner,
  admin: ROLE_CONFIG.admin,
  member: { ...ROLE_CONFIG.editor, label: 'Member' },
  viewer: ROLE_CONFIG.viewer,
};

// Get role label
export function getRoleLabel(role: Role): string {
  return ROLE_CONFIG[role]?.label || role;
}

// Get role color
export function getRoleColor(role: Role): string {
  return ROLE_CONFIG[role]?.color || '#6b7280';
}

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: keyof RolePermissions): boolean {
  return ROLE_CONFIG[role]?.permissions[permission] ?? false;
}

// Get all roles that have a specific permission
export function getRolesWithPermission(permission: keyof RolePermissions): Role[] {
  return ROLE_HIERARCHY.filter(role => hasPermission(role, permission));
}
