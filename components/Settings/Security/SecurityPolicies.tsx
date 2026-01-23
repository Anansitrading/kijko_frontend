// Setting Sprint 9: Advanced Security - Security Policies
import React, { useState, useCallback } from 'react';
import {
  Lock,
  Clock,
  Shield,
  Users,
  ChevronDown,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import type {
  SecurityPolicies as SecurityPoliciesType,
  PasswordPolicy,
  SessionPolicy,
  AuthenticationPolicy,
  Require2FA,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_SESSION_POLICY,
  DEFAULT_AUTH_POLICY,
} from '../../../types/settings';

interface SecurityPoliciesProps {
  isEnterprise?: boolean;
}

// Default policies
const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: false,
  expiryDays: 0,
  preventReuse: 0,
};

const defaultSessionPolicy: SessionPolicy = {
  sessionTimeoutMinutes: 480,
  idleTimeoutMinutes: 30,
  maxConcurrentSessions: 0,
  rememberDeviceDays: 30,
};

const defaultAuthPolicy: AuthenticationPolicy = {
  require2fa: 'none',
  ssoEnforcement: false,
  allowPasswordAuth: true,
  allowMagicLinkAuth: true,
};

export function SecurityPolicies({ isEnterprise = false }: SecurityPoliciesProps) {
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(defaultPasswordPolicy);
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>(defaultSessionPolicy);
  const [authPolicy, setAuthPolicy] = useState<AuthenticationPolicy>(defaultAuthPolicy);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePasswordPolicyChange = useCallback((updates: Partial<PasswordPolicy>) => {
    setPasswordPolicy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSessionPolicyChange = useCallback((updates: Partial<SessionPolicy>) => {
    setSessionPolicy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleAuthPolicyChange = useCallback((updates: Partial<AuthenticationPolicy>) => {
    setAuthPolicy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save policies:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const ToggleSwitch = ({ enabled, onChange, disabled = false }: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${
          enabled ? 'translate-x-5 bg-primary-foreground' : 'bg-foreground'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Save Status */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">Security policies saved successfully</p>
        </div>
      )}

      {/* Enterprise Notice */}
      {!isEnterprise && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-400">Enterprise Feature</p>
            <p className="text-xs text-gray-400 mt-1">
              Advanced security policies are available on Enterprise plans.
              Upgrade to configure password, session, and authentication policies.
            </p>
          </div>
        </div>
      )}

      {/* Password Policy */}
      <SettingsSection
        title="Password Policy"
        description="Configure password requirements for your team"
      >
        <div className="space-y-4">
          {/* Minimum Length */}
          <SettingsRow
            label="Minimum Password Length"
            description={`Require passwords to be at least ${passwordPolicy.minLength} characters`}
          >
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="8"
                max="32"
                value={passwordPolicy.minLength}
                onChange={(e) => handlePasswordPolicyChange({ minLength: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className="w-24 accent-primary disabled:opacity-50"
              />
              <span className="text-sm text-foreground w-8">{passwordPolicy.minLength}</span>
            </div>
          </SettingsRow>

          {/* Character Requirements */}
          <SettingsRow
            label="Require Uppercase Letter"
            description="Must contain at least one uppercase letter (A-Z)"
          >
            <ToggleSwitch
              enabled={passwordPolicy.requireUppercase}
              onChange={(enabled) => handlePasswordPolicyChange({ requireUppercase: enabled })}
              disabled={!isEnterprise}
            />
          </SettingsRow>

          <SettingsRow
            label="Require Lowercase Letter"
            description="Must contain at least one lowercase letter (a-z)"
          >
            <ToggleSwitch
              enabled={passwordPolicy.requireLowercase}
              onChange={(enabled) => handlePasswordPolicyChange({ requireLowercase: enabled })}
              disabled={!isEnterprise}
            />
          </SettingsRow>

          <SettingsRow
            label="Require Number"
            description="Must contain at least one number (0-9)"
          >
            <ToggleSwitch
              enabled={passwordPolicy.requireNumber}
              onChange={(enabled) => handlePasswordPolicyChange({ requireNumber: enabled })}
              disabled={!isEnterprise}
            />
          </SettingsRow>

          <SettingsRow
            label="Require Symbol"
            description="Must contain at least one special character (!@#$%^&*)"
          >
            <ToggleSwitch
              enabled={passwordPolicy.requireSymbol}
              onChange={(enabled) => handlePasswordPolicyChange({ requireSymbol: enabled })}
              disabled={!isEnterprise}
            />
          </SettingsRow>

          {/* Password Expiry */}
          <SettingsRow
            label="Password Expiry"
            description="Force users to change passwords after a certain period"
          >
            <div className="relative">
              <select
                value={passwordPolicy.expiryDays || 0}
                onChange={(e) => handlePasswordPolicyChange({ expiryDays: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="0">Never</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Prevent Password Reuse */}
          <SettingsRow
            label="Prevent Password Reuse"
            description="Remember previous passwords to prevent reuse"
          >
            <div className="relative">
              <select
                value={passwordPolicy.preventReuse}
                onChange={(e) => handlePasswordPolicyChange({ preventReuse: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="0">Disabled</option>
                <option value="3">Last 3 passwords</option>
                <option value="6">Last 6 passwords</option>
                <option value="12">Last 12 passwords</option>
                <option value="24">Last 24 passwords</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>

      <div className="border-t border-white/10" />

      {/* Session Policy */}
      <SettingsSection
        title="Session Policy"
        description="Control session duration and concurrent access"
      >
        <div className="space-y-4">
          {/* Session Timeout */}
          <SettingsRow
            label="Session Timeout"
            description="Maximum duration of a login session"
          >
            <div className="relative">
              <select
                value={sessionPolicy.sessionTimeoutMinutes}
                onChange={(e) => handleSessionPolicyChange({ sessionTimeoutMinutes: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="480">8 hours</option>
                <option value="720">12 hours</option>
                <option value="1440">24 hours</option>
                <option value="10080">7 days</option>
                <option value="43200">30 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Idle Timeout */}
          <SettingsRow
            label="Idle Timeout"
            description="Log out users after period of inactivity"
          >
            <div className="relative">
              <select
                value={sessionPolicy.idleTimeoutMinutes}
                onChange={(e) => handleSessionPolicyChange({ idleTimeoutMinutes: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="0">Disabled</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Max Concurrent Sessions */}
          <SettingsRow
            label="Max Concurrent Sessions"
            description="Limit the number of devices a user can be logged in on"
          >
            <div className="relative">
              <select
                value={sessionPolicy.maxConcurrentSessions}
                onChange={(e) => handleSessionPolicyChange({ maxConcurrentSessions: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="0">Unlimited</option>
                <option value="1">1 device</option>
                <option value="2">2 devices</option>
                <option value="3">3 devices</option>
                <option value="5">5 devices</option>
                <option value="10">10 devices</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {/* Remember Device */}
          <SettingsRow
            label="Remember Device Duration"
            description="How long to remember trusted devices"
          >
            <div className="relative">
              <select
                value={sessionPolicy.rememberDeviceDays}
                onChange={(e) => handleSessionPolicyChange({ rememberDeviceDays: parseInt(e.target.value) })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="0">Disabled</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>

      <div className="border-t border-white/10" />

      {/* Authentication Policy */}
      <SettingsSection
        title="Authentication Policy"
        description="Configure authentication requirements for your team"
      >
        <div className="space-y-4">
          {/* Require 2FA */}
          <SettingsRow
            label="Require Two-Factor Authentication"
            description="Enforce 2FA for users"
          >
            <div className="relative">
              <select
                value={authPolicy.require2fa}
                onChange={(e) => handleAuthPolicyChange({ require2fa: e.target.value as Require2FA })}
                disabled={!isEnterprise}
                className={`${tw.dropdown} w-40 text-sm h-9 disabled:opacity-50`}
              >
                <option value="none">No requirement</option>
                <option value="admins">Admins only</option>
                <option value="all">All members</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {/* SSO Enforcement */}
          <SettingsRow
            label="Enforce SSO"
            description="Require users to log in via SSO (disables other methods)"
          >
            <ToggleSwitch
              enabled={authPolicy.ssoEnforcement}
              onChange={(enabled) => handleAuthPolicyChange({ ssoEnforcement: enabled })}
              disabled={!isEnterprise}
            />
          </SettingsRow>

          {/* Allow Password Auth */}
          <SettingsRow
            label="Allow Password Authentication"
            description="Enable traditional email/password login"
          >
            <ToggleSwitch
              enabled={authPolicy.allowPasswordAuth}
              onChange={(enabled) => handleAuthPolicyChange({ allowPasswordAuth: enabled })}
              disabled={!isEnterprise || authPolicy.ssoEnforcement}
            />
          </SettingsRow>

          {/* Allow Magic Link */}
          <SettingsRow
            label="Allow Magic Link Authentication"
            description="Enable passwordless login via email"
          >
            <ToggleSwitch
              enabled={authPolicy.allowMagicLinkAuth}
              onChange={(enabled) => handleAuthPolicyChange({ allowMagicLinkAuth: enabled })}
              disabled={!isEnterprise || authPolicy.ssoEnforcement}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Save Button */}
      {isEnterprise && hasChanges && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`${tw.buttonPrimary} inline-flex items-center gap-2`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Policies
          </button>
        </div>
      )}
    </div>
  );
}

export default SecurityPolicies;
