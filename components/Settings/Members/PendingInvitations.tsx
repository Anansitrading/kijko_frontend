import React, { useState, useCallback } from 'react';
import {
  Mail,
  Clock,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Crown,
  ShieldCheck,
  Shield,
  Eye,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type { TeamInvitation, TeamRole } from '../../../types/settings';

interface PendingInvitationsProps {
  invitations: TeamInvitation[];
  onResend: (invitationId: string) => Promise<void>;
  onCancel: (invitationId: string) => Promise<void>;
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// Format time until expiration
function formatExpiresIn(expiresAt: Date): { text: string; isUrgent: boolean } {
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff <= 0) return { text: 'Expired', isUrgent: true };
  if (hours < 24) return { text: `${hours}h left`, isUrgent: true };
  if (days === 1) return { text: '1 day left', isUrgent: true };
  return { text: `${days} days left`, isUrgent: false };
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

export function PendingInvitations({
  invitations,
  onResend,
  onCancel,
}: PendingInvitationsProps) {
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: 'resend' | 'cancel' } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const handleResend = useCallback(
    async (invitationId: string) => {
      setLoadingAction({ id: invitationId, action: 'resend' });
      try {
        await onResend(invitationId);
        setSuccess('Invitation resent successfully');
        setTimeout(() => setSuccess(null), 3000);
      } finally {
        setLoadingAction(null);
      }
    },
    [onResend]
  );

  const handleCancel = useCallback(
    async (invitationId: string) => {
      setConfirmCancel(null);
      setLoadingAction({ id: invitationId, action: 'cancel' });
      try {
        await onCancel(invitationId);
        setSuccess('Invitation cancelled');
        setTimeout(() => setSuccess(null), 3000);
      } finally {
        setLoadingAction(null);
      }
    },
    [onCancel]
  );

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <SettingsSection
      title="Pending Invitations"
      description="Manage invitations that haven't been accepted yet"
    >
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-2">
        {pendingInvitations.map((invitation) => {
          const { text: expiresText, isUrgent } = formatExpiresIn(invitation.expiresAt);
          const isLoading = loadingAction?.id === invitation.id;
          const isResending = isLoading && loadingAction?.action === 'resend';
          const isCancelling = isLoading && loadingAction?.action === 'cancel';

          return (
            <div
              key={invitation.id}
              className="p-4 rounded-lg border bg-white/5 border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Invitation Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Email Icon */}
                  <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {invitation.email}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {/* Role Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border ${getRoleBadgeClass(
                          invitation.role
                        )}`}
                      >
                        <RoleIcon role={invitation.role} />
                        {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                      </span>

                      {/* Invited By */}
                      <span className="text-xs text-gray-500">
                        Invited by {invitation.invitedBy.name}
                      </span>

                      {/* Sent Time */}
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(invitation.createdAt)}
                      </span>
                    </div>

                    {/* Expiration */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock
                        className={`w-3 h-3 ${
                          isUrgent ? 'text-amber-400' : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isUrgent ? 'text-amber-400' : 'text-gray-500'
                        }`}
                      >
                        {expiresText}
                      </span>
                      {isUrgent && expiresText !== 'Expired' && (
                        <AlertTriangle className="w-3 h-3 text-amber-400 ml-1" />
                      )}
                    </div>

                    {/* Optional Message */}
                    {invitation.message && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        "{invitation.message}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Resend Button */}
                  <button
                    onClick={() => handleResend(invitation.id)}
                    disabled={isLoading}
                    className={`${tw.buttonSecondary} inline-flex items-center gap-1.5 h-8 px-3 text-xs`}
                    title="Resend invitation"
                  >
                    {isResending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Resend
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={() => setConfirmCancel(invitation.id)}
                    disabled={isLoading}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancel invitation"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">Cancel Invitation?</h4>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              This will cancel the invitation to{' '}
              <span className="text-white font-medium">
                {pendingInvitations.find((i) => i.id === confirmCancel)?.email}
              </span>
              . They will no longer be able to join the team using this invitation.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmCancel(null)}
                className={tw.buttonSecondary}
              >
                Keep Invitation
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                className={`${tw.buttonPrimary} bg-red-500 hover:bg-red-600`}
              >
                Cancel Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default PendingInvitations;
