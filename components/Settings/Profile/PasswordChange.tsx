import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';

interface PasswordStrength {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

function getPasswordStrength(password: string): PasswordStrength {
  const score = passwordRequirements.filter(req => req.test(password)).length;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
  const canSubmit = currentPassword && allRequirementsMet && passwordsMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implement actual password change with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    show: boolean,
    toggleShow: () => void
  ) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${tw.input} pr-10`}
          autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <SettingsSection
      title="Change Password"
      description="Update your password to keep your account secure"
    >
      <form onSubmit={handleSubmit} className="max-w-md">
        {renderPasswordInput(
          'current-password',
          'Current Password',
          currentPassword,
          setCurrentPassword,
          showCurrentPassword,
          () => setShowCurrentPassword(!showCurrentPassword)
        )}

        {renderPasswordInput(
          'new-password',
          'New Password',
          newPassword,
          setNewPassword,
          showNewPassword,
          () => setShowNewPassword(!showNewPassword)
        )}

        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <span className={`text-xs ${
                strength.label === 'Weak' ? 'text-red-400' :
                strength.label === 'Fair' ? 'text-amber-400' :
                strength.label === 'Good' ? 'text-blue-400' :
                'text-green-400'
              }`}>
                {strength.label}
              </span>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-1">
              {passwordRequirements.map(req => {
                const met = req.test(newPassword);
                return (
                  <div key={req.id} className="flex items-center gap-2 text-xs">
                    {met ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <X className="w-3 h-3 text-gray-500" />
                    )}
                    <span className={met ? 'text-green-400' : 'text-gray-500'}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {renderPasswordInput(
          'confirm-password',
          'Confirm New Password',
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword)
        )}

        {/* Match indicator */}
        {confirmPassword && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            {passwordsMatch ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Passwords match</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Passwords do not match</span>
              </>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
            <p className="text-sm text-green-400">Password changed successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`${tw.buttonPrimary} inline-flex items-center gap-2 ${
            !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Password changes are not auto-saved for security reasons.
        </p>
      </form>
    </SettingsSection>
  );
}

export default PasswordChange;
