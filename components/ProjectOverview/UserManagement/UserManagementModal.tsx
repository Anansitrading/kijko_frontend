// User Management Modal
// Modal popup for managing project users, triggered from project context menu

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Users,
  UserPlus,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { UserManagementModalProps } from './shared';
import { useProjectUsers, useProjectActivity } from './hooks';
import { UserSearch, UserCard } from './UserList';
import { ActivityFilter, ActivityEventComponent, LoadingSkeleton } from './ActivityLog';
import { InviteUserModal } from './InviteUserModal';

// ============================================
// Main Component
// ============================================

type ModalTab = 'users' | 'activity';

export function UserManagementModal({
  isOpen,
  onClose,
  project,
}: UserManagementModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('users');

  const {
    filteredUsers,
    isLoading: usersLoading,
    searchQuery,
    setSearchQuery,
    updateUserRole,
    removeUser,
    inviteUser,
    isUpdating,
  } = useProjectUsers(project.id);

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
  } = useProjectActivity(project.id);

  // Current user is the first owner (for demo purposes)
  const currentUserId = filteredUsers.find((u) => u.role === 'owner')?.id;

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isInviteModalOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isInviteModalOpen]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isInviteModalOpen) {
        onClose();
      }
    },
    [onClose, isInviteModalOpen]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] bg-[#0f1419] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-management-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2
                id="user-management-title"
                className="text-lg font-semibold text-white"
              >
                Manage Users
              </h2>
              <p className="text-sm text-gray-500">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'users'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'activity'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <Clock className="w-4 h-4" />
            Activity Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'users' && (
            <>
              {usersLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <UserSearch value={searchQuery} onChange={setSearchQuery} />

                  {/* User List */}
                  {filteredUsers.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {searchQuery
                          ? 'No users match your search'
                          : 'No users yet'}
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
                          onResendInvite={() => {
                            /* TODO: Implement resend */
                          }}
                          disabled={isUpdating}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {activityLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex justify-end">
                    <ActivityFilter
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                    />
                  </div>

                  {/* Activity List */}
                  {filteredActivities.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                      <p className="text-gray-400">
                        No activity for the selected filters
                      </p>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteUser}
      />
    </div>
  );
}

export default UserManagementModal;
