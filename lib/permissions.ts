// Centralized Permission Checker
// Unified permission checking for both team-level and context-level access

import {
  type Role,
  type TeamRole,
  type RolePermissions,
  ROLE_CONFIG,
  ROLE_HIERARCHY,
  hasPermission as roleHasPermission,
  hasHigherOrEqualRole,
  teamRoleToRole,
} from '../types/roles';

// Re-export for convenience
export {
  type Role,
  type TeamRole,
  type RolePermissions,
  ROLE_CONFIG,
  ROLE_HIERARCHY,
  hasHigherOrEqualRole,
  teamRoleToRole,
};

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// Check if a role has a specific permission
export function checkPermission(
  role: Role | TeamRole | null | undefined,
  permission: keyof RolePermissions
): PermissionCheckResult {
  if (!role) {
    return { allowed: false, reason: 'No role assigned' };
  }

  // Convert TeamRole to Role if needed
  const normalizedRole = role === 'member' ? 'editor' : role as Role;

  const allowed = roleHasPermission(normalizedRole, permission);

  return {
    allowed,
    reason: allowed ? undefined : `Role "${normalizedRole}" does not have "${permission}" permission`,
  };
}

// Check if user can manage another user based on role hierarchy
export function canManageUser(
  actorRole: Role | TeamRole | null | undefined,
  targetRole: Role | TeamRole | null | undefined,
  isSelf: boolean = false
): PermissionCheckResult {
  if (!actorRole) {
    return { allowed: false, reason: 'Actor has no role' };
  }

  if (isSelf) {
    return { allowed: false, reason: 'Cannot manage yourself' };
  }

  if (!targetRole) {
    return { allowed: true };
  }

  const actorNormalized = actorRole === 'member' ? 'editor' : actorRole as Role;
  const targetNormalized = targetRole === 'member' ? 'editor' : targetRole as Role;

  // Can only manage users with lower or equal role
  if (!hasHigherOrEqualRole(actorNormalized, targetNormalized)) {
    return { allowed: false, reason: 'Cannot manage users with higher role' };
  }

  // Owners can manage anyone (except themselves)
  if (actorNormalized === 'owner') {
    return { allowed: true };
  }

  // Admins can manage members/editors and viewers
  if (actorNormalized === 'admin') {
    if (targetNormalized === 'admin' || targetNormalized === 'owner') {
      return { allowed: false, reason: 'Admins cannot manage other admins or owners' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Insufficient permissions to manage users' };
}

// Check if user can change another user's role
export function canChangeRole(
  actorRole: Role | TeamRole | null | undefined,
  targetCurrentRole: Role | TeamRole | null | undefined,
  targetNewRole: Role | TeamRole,
  isSelf: boolean = false
): PermissionCheckResult {
  // First check if actor can manage the target
  const canManage = canManageUser(actorRole, targetCurrentRole, isSelf);
  if (!canManage.allowed) {
    return canManage;
  }

  // Check permission to change roles
  const hasChangePermission = checkPermission(actorRole, 'canChangeRoles');
  if (!hasChangePermission.allowed) {
    return hasChangePermission;
  }

  const actorNormalized = actorRole === 'member' ? 'editor' : actorRole as Role;
  const newRoleNormalized = targetNewRole === 'member' ? 'editor' : targetNewRole as Role;

  // Can't promote to a role higher than your own
  if (!hasHigherOrEqualRole(actorNormalized, newRoleNormalized)) {
    return { allowed: false, reason: 'Cannot promote user to a role higher than your own' };
  }

  // Only owners can change someone to owner
  if (newRoleNormalized === 'owner' && actorNormalized !== 'owner') {
    return { allowed: false, reason: 'Only owners can transfer ownership' };
  }

  return { allowed: true };
}

// Check if user can invite new members
export function canInviteMembers(
  role: Role | TeamRole | null | undefined,
  availableSeats: number
): PermissionCheckResult {
  const hasPermission = checkPermission(role, 'canInviteMembers');
  if (!hasPermission.allowed) {
    return hasPermission;
  }

  if (availableSeats <= 0) {
    return { allowed: false, reason: 'No available seats' };
  }

  return { allowed: true };
}

// Check if user can remove a member
export function canRemoveMember(
  actorRole: Role | TeamRole | null | undefined,
  targetRole: Role | TeamRole | null | undefined,
  isSelf: boolean = false
): PermissionCheckResult {
  const hasPermission = checkPermission(actorRole, 'canRemoveMembers');
  if (!hasPermission.allowed) {
    return hasPermission;
  }

  return canManageUser(actorRole, targetRole, isSelf);
}

// Check if user can view audit logs
export function canViewAuditLog(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canViewAuditLog');
}

// Check if user can manage integrations
export function canManageIntegrations(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canManageIntegrations');
}

// Check if user can manage billing
export function canManageBilling(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canManageBilling');
}

// Check if user can edit contexts
export function canEditContext(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canEditContexts');
}

// Check if user can delete contexts
export function canDeleteContext(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canDeleteContexts');
}

// Check if user can share contexts
export function canShareContext(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canShareContexts');
}

// Check if user can manage context users
export function canManageContextUsers(role: Role | TeamRole | null | undefined): PermissionCheckResult {
  return checkPermission(role, 'canManageContextUsers');
}

// Get all permissions for a role as a simple object
export function getPermissionsForRole(role: Role | TeamRole | null | undefined): Partial<RolePermissions> {
  if (!role) {
    return {};
  }

  const normalizedRole = role === 'member' ? 'editor' : role as Role;
  return ROLE_CONFIG[normalizedRole]?.permissions ?? {};
}

// Get a human-readable list of what a role can do
export function getRoleCapabilities(role: Role | TeamRole): string[] {
  const normalizedRole = role === 'member' ? 'editor' : role as Role;
  const config = ROLE_CONFIG[normalizedRole];

  if (!config) {
    return [];
  }

  const capabilities: string[] = [];
  const permissions = config.permissions;

  if (permissions.canViewContexts) capabilities.push('View contexts');
  if (permissions.canEditContexts) capabilities.push('Edit contexts');
  if (permissions.canDeleteContexts) capabilities.push('Delete contexts');
  if (permissions.canShareContexts) capabilities.push('Share contexts');
  if (permissions.canManageContextUsers) capabilities.push('Manage context users');
  if (permissions.canInviteMembers) capabilities.push('Invite team members');
  if (permissions.canRemoveMembers) capabilities.push('Remove team members');
  if (permissions.canChangeRoles) capabilities.push('Change member roles');
  if (permissions.canManageTeam) capabilities.push('Manage team settings');
  if (permissions.canManageBilling) capabilities.push('Manage billing');
  if (permissions.canManageIntegrations) capabilities.push('Manage integrations');
  if (permissions.canViewAuditLog) capabilities.push('View audit log');
  if (permissions.canTransferOwnership) capabilities.push('Transfer ownership');

  return capabilities;
}
