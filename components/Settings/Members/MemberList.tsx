import React, { useState, useCallback } from 'react';
import {
  User,
  MoreVertical,
  Shield,
  ShieldCheck,
  Eye,
  Crown,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import { RoleSelect } from './RoleSelect';
import type { TeamMember, TeamRole, TEAM_ROLES } from '../../../types/settings';

interface MemberListProps {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: TeamRole;
  onRoleChange: (memberId: string, newRole: TeamRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onDeactivateMember: (memberId: string) => Promise<void>;
  onReactivateMember: (memberId: string) => Promise<void>;
}

// Helper to format relative time
function formatRelativeTime(date: Date | undefined): string {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Role icon component
function RoleIcon({ role }: { role: TeamRole }) {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3 text-amber-400" />;
    case 'admin':
      return <ShieldCheck className="w-3 h-3 text-blue-400" />;
    case 'member':
      return <Shield className="w-3 h-3 text-gray-400" />;
    case 'viewer':
      return <Eye className="w-3 h-3 text-gray-500" />;
    default:
      return null;
  }
}

// Role badge colors
function getRoleBadgeClass(role: TeamRole): string {
  switch (role) {
    case 'owner':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'admin':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'member':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'viewer':
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// Status badge colors
function getStatusBadgeClass(status: TeamMember['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400';
    case 'inactive':
      return 'bg-gray-500/20 text-gray-400';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onRemoveMember,
  onDeactivateMember,
  onReactivateMember,
}: MemberListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const canManageMember = useCallback(
    (member: TeamMember) => {
      // Can't manage yourself
      if (member.userId === currentUserId) return false;
      // Owner can manage everyone
      if (currentUserRole === 'owner') return true;
      // Admin can manage members and viewers
      if (currentUserRole === 'admin') {
        return member.role === 'member' || member.role === 'viewer';
      }
      return false;
    },
    [currentUserId, currentUserRole]
  );

  const getDisabledRoles = useCallback(
    (memberRole: TeamRole): TeamRole[] => {
      // Owner role can only be assigned by current owner
      if (currentUserRole !== 'owner') {
        return ['owner'];
      }
      return [];
    },
    [currentUserRole]
  );

  const handleRoleChange = useCallback(
    async (memberId: string, newRole: TeamRole) => {
      setLoadingAction({ id: memberId, action: 'role' });
      try {
        await onRoleChange(memberId, newRole);
      } finally {
        setLoadingAction(null);
      }
    },
    [onRoleChange]
  );

  const handleDeactivate = useCallback(
    async (memberId: string) => {
      setOpenMenuId(null);
      setLoadingAction({ id: memberId, action: 'deactivate' });
      try {
        await onDeactivateMember(memberId);
      } finally {
        setLoadingAction(null);
      }
    },
    [onDeactivateMember]
  );

  const handleReactivate = useCallback(
    async (memberId: string) => {
      setOpenMenuId(null);
      setLoadingAction({ id: memberId, action: 'reactivate' });
      try {
        await onReactivateMember(memberId);
      } finally {
        setLoadingAction(null);
      }
    },
    [onReactivateMember]
  );

  const handleRemove = useCallback(
    async (memberId: string) => {
      setOpenMenuId(null);
      setConfirmRemove(null);
      setLoadingAction({ id: memberId, action: 'remove' });
      try {
        await onRemoveMember(memberId);
      } finally {
        setLoadingAction(null);
      }
    },
    [onRemoveMember]
  );

  // Sort members: owner first, then admin, then active members, then inactive
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<TeamRole, number> = { owner: 0, admin: 1, member: 2, viewer: 3 };
    const statusOrder: Record<string, number> = { active: 0, pending: 1, inactive: 2 };

    // First by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by role
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <SettingsSection
      title="Team Members"
      description="Manage your team members and their permissions"
    >
      <div className="space-y-2">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const canManage = canManageMember(member);
          const isLoading = loadingAction?.id === member.id;
          const isMenuOpen = openMenuId === member.id;

          return (
            <div
              key={member.id}
              className={`p-4 rounded-lg border ${
                isCurrentUser
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : member.status === 'inactive'
                  ? 'bg-white/[0.02] border-white/5 opacity-60'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Member Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {getInitials(member.name)}
                        </span>
                      </div>
                    )}
                    {/* Status indicator */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1f26] ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="flex items-center gap-3">
                  {/* Last Active */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(member.lastActiveAt)}</span>
                  </div>

                  {/* Status Badge */}
                  {member.status !== 'active' && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full capitalize ${getStatusBadgeClass(
                        member.status
                      )}`}
                    >
                      {member.status}
                    </span>
                  )}

                  {/* Role Badge/Select */}
                  {canManage && !isLoading ? (
                    <RoleSelect
                      value={member.role}
                      onChange={(role) => handleRoleChange(member.id, role)}
                      disabledRoles={getDisabledRoles(member.role)}
                      size="sm"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border ${getRoleBadgeClass(
                        member.role
                      )}`}
                    >
                      <RoleIcon role={member.role} />
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  )}

                  {/* Actions Menu */}
                  {canManage && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : member.id)}
                        disabled={isLoading}
                        className={`p-1.5 rounded-md transition-colors ${
                          isMenuOpen
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && !isLoading && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 bg-[#1a1f26] border border-white/10 rounded-lg shadow-xl">
                            {member.status === 'active' ? (
                              <button
                                onClick={() => handleDeactivate(member.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                                Deactivate Member
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(member.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                              >
                                <UserCheck className="w-4 h-4" />
                                Reactivate Member
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmRemove(member.id);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove from Team
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Confirmation Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">Remove Member?</h4>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              This will remove{' '}
              <span className="text-white font-medium">
                {members.find((m) => m.id === confirmRemove)?.name}
              </span>{' '}
              from the team. They will lose access to all team resources.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className={tw.buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                className={`${tw.buttonPrimary} bg-red-500 hover:bg-red-600`}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default MemberList;
