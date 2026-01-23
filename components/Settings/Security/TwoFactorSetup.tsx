import React, { useState, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Keyboard,
  Loader2,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type {
  TwoFactorStatus,
  TwoFactorSetupStep,
  TwoFactorSetupData,
  BackupCode,
} from '../../../types/settings';
import {
  generate2FASetupData,
  verifyTOTPCode,
  isValidTOTPFormat,
  generateBackupCodes,
  downloadBackupCodes,
} from '../../../lib/2fa';

interface TwoFactorSetupProps {
  initialStatus?: TwoFactorStatus;
}

export function TwoFactorSetup({ initialStatus }: TwoFactorSetupProps) {
  const [status, setStatus] = useState<TwoFactorStatus>(
    initialStatus || { isEnabled: false }
  );
  const [step, setStep] = useState<TwoFactorSetupStep>('initial');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const handleStartSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, email would come from user context
      const data = await generate2FASetupData('user@example.com');
      setSetupData(data);
      setStep('qr-scan');
    } catch (err) {
      setError('Failed to initialize 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!setupData || !isValidTOTPFormat(verificationCode)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyTOTPCode(setupData.secret, verificationCode);

      if (isValid) {
        const codes = generateBackupCodes(10);
        setBackupCodes(codes);
        setStep('backup-codes');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setupData, verificationCode]);

  const handleComplete = useCallback(() => {
    setStatus({
      isEnabled: true,
      enabledAt: new Date(),
      backupCodesRemaining: backupCodes.filter(c => !c.isUsed).length,
    });
    setStep('initial');
    setSetupData(null);
    setVerificationCode('');
  }, [backupCodes]);

  const handleDisable = useCallback(async () => {
    if (!disablePassword || !isValidTOTPFormat(disableCode)) {
      setError('Please enter your password and a valid 2FA code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setStatus({ isEnabled: false });
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
    } catch (err) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [disablePassword, disableCode]);

  const handleCopyKey = useCallback(async () => {
    if (setupData) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }, [setupData]);

  const handleDownloadCodes = useCallback(() => {
    downloadBackupCodes(backupCodes, 'user@example.com');
  }, [backupCodes]);

  const handleCancel = useCallback(() => {
    setStep('initial');
    setSetupData(null);
    setVerificationCode('');
    setError(null);
  }, []);

  // Render status badge
  const renderStatusBadge = () => (
    <div className="flex items-center gap-3 mb-6">
      {status.isEnabled ? (
        <>
          <div className="p-2 rounded-full bg-green-500/20">
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-400">2FA Enabled</p>
            <p className="text-xs text-gray-500">
              {status.backupCodesRemaining} backup codes remaining
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="p-2 rounded-full bg-amber-500/20">
            <ShieldOff className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-400">2FA Disabled</p>
            <p className="text-xs text-gray-500">
              Enable for additional security
            </p>
          </div>
        </>
      )}
    </div>
  );

  // Render initial state (enable/disable buttons)
  const renderInitialState = () => (
    <>
      {renderStatusBadge()}

      {status.isEnabled ? (
        <div className="space-y-4">
          <button
            onClick={() => setShowDisableModal(true)}
            className={`${tw.buttonSecondary} text-red-400 border-red-500/30 hover:bg-red-500/10`}
          >
            Disable 2FA
          </button>

          <button
            onClick={() => {
              const codes = generateBackupCodes(10);
              setBackupCodes(codes);
              setStep('backup-codes');
            }}
            className={tw.buttonSecondary}
          >
            View Backup Codes
          </button>
        </div>
      ) : (
        <button
          onClick={handleStartSetup}
          disabled={isLoading}
          className={`${tw.buttonPrimary} inline-flex items-center gap-2`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          Enable Two-Factor Authentication
        </button>
      )}
    </>
  );

  // Render QR code step
  const renderQRCodeStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-blue-400" />
        <h4 className="text-sm font-medium text-white">Scan QR Code</h4>
      </div>

      <p className="text-sm text-gray-400">
        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
      </p>

      {/* QR Code Display */}
      <div className="flex justify-center p-4 bg-white rounded-lg w-fit mx-auto">
        {setupData && (
          <img
            src={setupData.qrCodeUrl}
            alt="2FA QR Code"
            className="w-48 h-48"
          />
        )}
      </div>

      {/* Manual Entry Option */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={() => setShowManualKey(!showManualKey)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <Keyboard className="w-4 h-4" />
          {showManualKey ? 'Hide' : 'Show'} manual entry key
        </button>

        {showManualKey && setupData && (
          <div className="mt-3 p-3 bg-white/5 rounded-md">
            <p className="text-xs text-gray-400 mb-2">Enter this key manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-white">
                {setupData.manualEntryKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="p-1.5 hover:bg-white/10 rounded"
              >
                {copiedKey ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Input */}
      <div className="border-t border-white/10 pt-4">
        <label className="block text-sm font-medium text-white mb-2">
          Enter verification code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={e => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setVerificationCode(value);
          }}
          placeholder="000000"
          className={`${tw.input} text-center text-2xl tracking-widest font-mono max-w-xs`}
          autoComplete="one-time-code"
        />
        <p className="text-xs text-gray-500 mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          className={tw.buttonSecondary}
        >
          Cancel
        </button>
        <button
          onClick={handleVerify}
          disabled={!isValidTOTPFormat(verificationCode) || isLoading}
          className={`${tw.buttonPrimary} inline-flex items-center gap-2 ${
            !isValidTOTPFormat(verificationCode) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Verify & Continue
        </button>
      </div>
    </div>
  );

  // Render backup codes step
  const renderBackupCodesStep = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <h4 className="text-sm font-medium text-amber-400 mb-2">
          Save your backup codes
        </h4>
        <p className="text-sm text-gray-400">
          Store these codes in a safe place. Each code can only be used once.
          If you lose access to your authenticator app, you can use one of these codes to sign in.
        </p>
      </div>

      {/* Backup Codes Grid */}
      <div className="grid grid-cols-2 gap-2 max-w-md">
        {backupCodes.map((code, index) => (
          <div
            key={index}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded font-mono text-sm text-white"
          >
            {code.code}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadCodes}
          className={tw.buttonSecondary}
        >
          Download Codes
        </button>
        <button
          onClick={handleComplete}
          className={tw.buttonPrimary}
        >
          I've Saved My Codes
        </button>
      </div>
    </div>
  );

  // Render disable modal
  const renderDisableModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Disable 2FA</h3>
          <button
            onClick={() => {
              setShowDisableModal(false);
              setError(null);
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          To disable two-factor authentication, please enter your password and a verification code.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showDisablePassword ? 'text' : 'password'}
                value={disablePassword}
                onChange={e => setDisablePassword(e.target.value)}
                className={`${tw.input} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowDisablePassword(!showDisablePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showDisablePassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              2FA Code
            </label>
            <input
              type="text"
              value={disableCode}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setDisableCode(value);
              }}
              placeholder="000000"
              className={`${tw.input} text-center tracking-widest font-mono`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowDisableModal(false);
                setError(null);
              }}
              className={tw.buttonSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleDisable}
              disabled={!disablePassword || !isValidTOTPFormat(disableCode) || isLoading}
              className={`${tw.buttonPrimary} inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 ${
                !disablePassword || !isValidTOTPFormat(disableCode)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Disable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SettingsSection
      title="Two-Factor Authentication"
      description="Add an extra layer of security to your account"
    >
      {step === 'initial' && renderInitialState()}
      {step === 'qr-scan' && renderQRCodeStep()}
      {step === 'backup-codes' && renderBackupCodesStep()}
      {showDisableModal && renderDisableModal()}
    </SettingsSection>
  );
}

export default TwoFactorSetup;
