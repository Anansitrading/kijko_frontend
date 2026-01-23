import { useState } from 'react';
import { Users, UserPlus, Crown, ShieldCheck, Shield, Eye, Loader2, Lock } from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import { MemberList } from './MemberList';
import { PendingInvitations } from './PendingInvitations';
import { InviteModal } from './InviteModal';
import { useTeam, TeamProvider } from '../../../contexts/TeamContext';
import { useSettings } from '../../../contexts/SettingsContext';
import type { TeamStats } from '../../../types/settings';

// Team Overview Stats Component
function TeamOverview({
  stats,
  onInviteClick,
  canInvite,
}: {
  stats: TeamStats;
  onInviteClick: () => void;
  canInvite: boolean;
}) {
  const seatUsagePercent = ((stats.totalMembers + stats.pendingInvites) / stats.maxSeats) * 100;
  const isAtCapacity = stats.availableSeats === 0;

  return (
    <SettingsSection
      title="Team Overview"
      description="Manage your team members, roles, and permissions"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Total Members */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Members</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
        </div>

        {/* Active Members */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeMembers}</p>
        </div>

        {/* Pending Invites */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingInvites}</p>
        </div>

        {/* Available Seats */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Seats Left</span>
          </div>
          <p className={`text-2xl font-bold ${isAtCapacity ? 'text-red-400' : 'text-white'}`}>
            {stats.availableSeats}
          </p>
        </div>
      </div>

      {/* Seat Usage Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Seat Usage</span>
          <span className="text-sm text-white">
            {stats.totalMembers + stats.pendingInvites} / {stats.maxSeats}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtCapacity
                ? 'bg-red-500'
                : seatUsagePercent > 80
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(seatUsagePercent, 100)}%` }}
          />
        </div>
        {isAtCapacity && (
          <p className="text-xs text-red-400 mt-2">
            You've reached your seat limit. Upgrade your plan to add more members.
          </p>
        )}
      </div>

      {/* Role Legend */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
        <h4 className="text-sm font-medium text-white mb-3">Role Permissions</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">Owner</p>
              <p className="text-xs text-gray-500">Full access including billing</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">Admin</p>
              <p className="text-xs text-gray-500">All except billing & transfer</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">Member</p>
              <p className="text-xs text-gray-500">Read/write contexts</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">Viewer</p>
              <p className="text-xs text-gray-500">View contexts only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Button */}
      {canInvite && (
        <button
          onClick={onInviteClick}
          disabled={isAtCapacity}
          className={`${tw.buttonPrimary} inline-flex items-center gap-2 w-full justify-center sm:w-auto`}
        >
          <UserPlus className="w-4 h-4" />
          Invite Team Members
        </button>
      )}
    </SettingsSection>
  );
}

// Plan Gate Component
function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-amber-500/20 mb-4">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Teams Feature</h3>
      <p className="text-gray-400 text-center max-w-md mb-6">
        Team member management is available on Teams and Enterprise plans. Upgrade your plan to
        collaborate with your team.
      </p>
      <button className={tw.buttonPrimary}>Upgrade to Teams</button>
    </div>
  );
}

// Main Members Section Content (wrapped with context)
function MembersSectionContent() {
  const {
    state,
    inviteMembers,
    resendInvitation,
    cancelInvitation,
    changeRole,
    removeMember,
    deactivateMember,
    reactivateMember,
    canInvite,
  } = useTeam();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Check if user has access (Teams/Enterprise plan)
  // For demo purposes, we'll assume they have access if they have a team
  const hasAccess = state.team !== null;

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return <PlanGate />;
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {state.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}

      {/* Team Overview */}
      <TeamOverview
        stats={state.stats}
        onInviteClick={() => setIsInviteModalOpen(true)}
        canInvite={canInvite()}
      />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Pending Invitations */}
      <PendingInvitations
        invitations={state.invitations}
        onResend={resendInvitation}
        onCancel={cancelInvitation}
      />

      {/* Member List */}
      <MemberList
        members={state.members}
        currentUserId="user-1" // In real app, get from auth context
        currentUserRole={state.currentUserRole || 'member'}
        onRoleChange={changeRole}
        onRemoveMember={removeMember}
        onDeactivateMember={deactivateMember}
        onReactivateMember={reactivateMember}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteMembers}
        availableSeats={state.stats.availableSeats}
      />
    </div>
  );
}

// Exported MembersSection wrapped with TeamProvider
export function MembersSection() {
  const { state } = useSettings();

  // Only render when members section is active
  if (state.activeSection !== 'members') {
    return null;
  }

  return (
    <TeamProvider>
      <MembersSectionContent />
    </TeamProvider>
  );
}

export default MembersSection;
