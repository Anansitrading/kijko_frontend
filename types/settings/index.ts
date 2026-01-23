// Settings Types - Unified Export
// Re-exports all settings-related types from organized modules

// Base settings types
export * from './base';

// Security types (Sprint 4 + Sprint 9)
export * from './security';

// Notifications types (Sprint 5)
export * from './notifications';

// Integrations types (Sprint 6)
export * from './integrations';

// Billing types (Sprint 7)
export * from './billing';

// Team types (Sprint 8)
export * from './team';

// Audit log types (Sprint 10)
export * from './audit';

// Re-export role types for backwards compatibility
export {
  type Role,
  type UserRole,
  type TeamRole,
  type RolePermissions,
  ROLE_CONFIG,
  ROLE_HIERARCHY,
  TEAM_ROLES,
  hasPermission,
  hasHigherOrEqualRole,
  getRoleLabel,
  getRoleColor,
  getRolesWithPermission,
  teamRoleToRole,
  roleToTeamRole,
} from '../roles';
