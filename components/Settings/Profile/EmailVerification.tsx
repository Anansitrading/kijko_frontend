import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { tw } from '../../../styles/settings';
import SettingsRow from '../SettingsRow';

export function EmailVerification() {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  const email = getSetting('profile.email', '') as string;
  const isVerified = getSetting('profile.emailVerified', false) as boolean;

  const [localEmail, setLocalEmail] = useState(email);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Sync local email with stored email
  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setLocalEmail(newEmail);
    setError(null);
  };

  const handleEmailBlur = () => {
    if (localEmail === email) return;

    if (!validateEmail(localEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Show confirmation modal before saving
    setPendingEmail(localEmail);
    setShowConfirmModal(true);
  };

  const handleConfirmEmailChange = () => {
    if (pendingEmail) {
      save('profile.email', pendingEmail, true);
      save('profile.emailVerified', false, true); // Reset verification
    }
    setShowConfirmModal(false);
    setPendingEmail(null);
  };

  const handleCancelEmailChange = () => {
    setLocalEmail(email); // Revert to original
    setShowConfirmModal(false);
    setPendingEmail(null);
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      // TODO: Implement actual email verification with Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <SettingsRow
        label="Email Address"
        description="Your email is used for account notifications and login"
      >
        <div className="w-72">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={localEmail}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={`${error ? tw.inputError : tw.input} pl-10 pr-10`}
              placeholder="you@example.com"
            />

            {/* Verification Badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2" title={isVerified ? 'Verified' : 'Not verified'}>
              {isVerified ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="mt-1 text-xs text-red-400">{error}</p>
          )}

          {/* Verification Status */}
          <div className="mt-2 flex items-center justify-between">
            {isVerified ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Email verified
              </span>
            ) : (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Email not verified
              </span>
            )}

            {!isVerified && email && (
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Resend verification
                  </>
                )}
              </button>
            )}
          </div>

          {/* Resend Success Message */}
          {resendSuccess && (
            <p className="mt-2 text-xs text-green-400">
              Verification email sent! Check your inbox.
            </p>
          )}
        </div>
      </SettingsRow>

      {/* Email Change Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Confirm Email Change
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Changing your email to <span className="text-white font-medium">{pendingEmail}</span> will require re-verification. You'll receive a verification link at the new address.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelEmailChange}
                className={tw.buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmailChange}
                className={tw.buttonPrimary}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailVerification;
