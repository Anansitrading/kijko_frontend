import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, UserPlus, Mail, AlertCircle, Loader2, Info } from 'lucide-react';
import { tw } from '../../../styles/settings';
import { RoleSelect } from './RoleSelect';
import type { TeamRole, InviteMemberData } from '../../../types/settings';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteMemberData) => Promise<void>;
  availableSeats: number;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parse emails from comma/newline separated string
function parseEmails(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

// Validate email format
function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function InviteModal({ isOpen, onClose, onInvite, availableSeats }: InviteModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailInput('');
      setRole('member');
      setMessage('');
      setErrors([]);
    }
  }, [isOpen]);

  const parsedEmails = parseEmails(emailInput);
  const validEmails = parsedEmails.filter(validateEmail);
  const invalidEmails = parsedEmails.filter((email) => !validateEmail(email));
  const exceededSeats = validEmails.length > availableSeats;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors([]);

      // Validate
      if (parsedEmails.length === 0) {
        setErrors(['Please enter at least one email address']);
        return;
      }

      if (invalidEmails.length > 0) {
        setErrors([`Invalid email format: ${invalidEmails.join(', ')}`]);
        return;
      }

      if (exceededSeats) {
        setErrors([
          `You only have ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available. Please remove ${
            validEmails.length - availableSeats
          } email${validEmails.length - availableSeats === 1 ? '' : 's'}.`,
        ]);
        return;
      }

      setIsLoading(true);
      try {
        await onInvite({
          emails: validEmails,
          role,
          message: message.trim() || undefined,
        });
        onClose();
      } catch (error) {
        setErrors(['Failed to send invitations. Please try again.']);
      } finally {
        setIsLoading(false);
      }
    },
    [parsedEmails, invalidEmails, exceededSeats, validEmails, availableSeats, role, message, onInvite, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-[#1a1f26] border border-white/10 rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Invite Team Members</h3>
              <p className="text-sm text-gray-500">
                {availableSeats > 0
                  ? `${availableSeats} seat${availableSeats === 1 ? '' : 's'} available`
                  : 'No seats available'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* No seats warning */}
          {availableSeats === 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">No seats available</p>
                <p className="text-xs text-amber-400/80 mt-1">
                  Upgrade your plan to add more team members.
                </p>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-400">
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Addresses
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <textarea
                ref={inputRef}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email addresses (comma or newline separated)"
                className={`${tw.input} pl-10 min-h-[100px] resize-none`}
                disabled={availableSeats === 0 || isLoading}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Separate multiple emails with commas or new lines
              </p>
              {parsedEmails.length > 0 && (
                <p
                  className={`text-xs ${
                    exceededSeats || invalidEmails.length > 0
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}
                >
                  {validEmails.length} valid email{validEmails.length !== 1 ? 's' : ''}
                  {invalidEmails.length > 0 && `, ${invalidEmails.length} invalid`}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Role</label>
            <div className="flex items-center gap-3">
              <RoleSelect
                value={role}
                onChange={setRole}
                disabled={availableSeats === 0 || isLoading}
                disabledRoles={['owner']}
              />
              <p className="text-xs text-gray-500 flex-1">
                Invited members will have this role by default
              </p>
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Personal Message{' '}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation email..."
              className={`${tw.input} min-h-[80px] resize-none`}
              maxLength={500}
              disabled={availableSeats === 0 || isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length}/500
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Invitations expire after 7 days. You can resend or cancel pending invitations from
              the members page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={tw.buttonSecondary}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                availableSeats === 0 ||
                validEmails.length === 0 ||
                exceededSeats ||
                isLoading
              }
              className={`${tw.buttonPrimary} inline-flex items-center gap-2`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading
                ? 'Sending...'
                : `Send Invitation${validEmails.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteModal;
