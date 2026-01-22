import { useState } from 'react';
import { Shield, Eye, Edit, Crown, Clock, UserPlus, Loader2, Users } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { TabProps, UserAccess, UserRole } from '../../../../types/contextInspector';
import { useUsers } from './hooks/useUsers';
import { useActivity } from './hooks/useActivity';
import { UserSearch } from './components/UserSearch';
import { PermissionDropdown } from './components/PermissionDropdown';
import { UserSettingsMenu } from './components/UserSettingsMenu';
import { InviteUserModal } from './components/InviteUserModal';
import { ActivityEventComponent } from './components/ActivityEvent';
import { ActivityFilter } from './components/ActivityFilter';
import { PermissionInfo } from './components/PermissionInfo';

const ROLE_CONFIG: Record<UserRole, { icon: typeof Crown; color: string; bgColor: string }> = {
  owner: { icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  admin: { icon: Shield, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  editor: { icon: Edit, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  viewer: { icon: Eye, color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
};

function formatLastActive(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface UserCardProps {
  user: UserAccess;
  isCurrentUser: boolean;
  onRoleChange: (role: UserRole) => void;
  onRemove: () => void;
  onResendInvite: () => void;
  disabled?: boolean;
}

function UserCard({ user, isCurrentUser, onRoleChange, onRemove, onResendInvite, disabled }: UserCardProps) {
  const isOnline = Date.now() - user.lastActive.getTime() < 10 * 60 * 1000;

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {getInitials(user.name)}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f1419]" />
          )}
        </div>
        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{user.name}</p>
            {isCurrentUser && (
              <span className="text-xs text-gray-500">(You)</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Last Active */}
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Clock className="w-3 h-3" />
          <span>{formatLastActive(user.lastActive)}</span>
        </div>
        {/* Permission Dropdown */}
        <PermissionDropdown
          currentRole={user.role}
          onRoleChange={onRoleChange}
          disabled={disabled}
          isCurrentUser={isCurrentUser}
        />
        {/* Settings Menu */}
        <UserSettingsMenu
          onRemoveAccess={onRemove}
          onResendInvite={onResendInvite}
          disabled={disabled}
          isOwner={isCurrentUser}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-white/5 rounded-lg w-full" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function UsersTab({ contextItem }: TabProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const {
    filteredUsers,
    isLoading: usersLoading,
    searchQuery,
    setSearchQuery,
    updateUserRole,
    removeUser,
    inviteUser,
    resendInvite,
    isUpdating,
  } = useUsers(contextItem.id);

  const {
    filteredActivities,
    isLoading: activityLoading,
    typeFilter,
    setTypeFilter,
    timeRange,
    setTimeRange,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useActivity(contextItem.id);

  const usersByRole = {
    owner: filteredUsers.filter((u) => u.role === 'owner'),
    admin: filteredUsers.filter((u) => u.role === 'admin'),
    editor: filteredUsers.filter((u) => u.role === 'editor'),
    viewer: filteredUsers.filter((u) => u.role === 'viewer'),
  };

  // Current user is the first owner (for demo purposes)
  const currentUserId = filteredUsers.find((u) => u.role === 'owner')?.id;

  if (usersLoading) {
    return (
      <div className="flex flex-col h-full p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto">
      {/* Search & Invite Header */}
      <div className="flex items-center gap-4">
        <UserSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search users..."
          className="flex-1"
        />
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite User</span>
        </button>
      </div>

      {/* Summary Stats */}
      <section>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Access Summary
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.owner][]).map(([role, config]) => {
            const Icon = config.icon;
            const count = usersByRole[role].length;
            return (
              <div key={role} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className={cn('inline-flex p-2 rounded-lg mb-2', config.bgColor)}>
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500 capitalize">{role}s</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* User List */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Current Users ({filteredUsers.length})
          </h3>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery ? 'No users match your search' : 'No users yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                onRoleChange={(role) => updateUserRole(user.id, role)}
                onRemove={() => removeUser(user.id)}
                onResendInvite={() => resendInvite(user.id)}
                disabled={isUpdating}
              />
            ))}
          </div>
        )}
      </section>

      {/* Activity Log */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Activity Log
          </h3>
          <ActivityFilter
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
        {activityLoading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
            <p className="text-gray-400">No activity for the selected filters</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredActivities.map((event) => (
                <ActivityEventComponent key={event.id} event={event} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full mt-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </button>
            )}
          </>
        )}
      </section>

      {/* Permission Info */}
      <PermissionInfo />

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteUser}
      />
    </div>
  );
}

// Re-export hooks for external use
export { useUsers } from './hooks/useUsers';
export { useActivity } from './hooks/useActivity';
