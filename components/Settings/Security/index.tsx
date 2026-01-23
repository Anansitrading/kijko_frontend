// Settings Security Module - Main Entry Point
// Setting Sprint 4: Security and Data
// Setting Sprint 9: Advanced Security

export { TwoFactorSetup, default as TwoFactorSetupDefault } from './TwoFactorSetup';
export { BackupCodes } from './BackupCodes';
export { SessionsList } from './SessionsList';
export { ApiKeyManager } from './ApiKeyManager';
export { ApiKeyCreate } from './ApiKeyCreate';
export { DataExport } from './DataExport';

// Sprint 9: Advanced Security
export { LoginHistory } from './LoginHistory';
export { SecurityPolicies } from './SecurityPolicies';
export { IPWhitelist } from './IPWhitelist';
export { ComplianceDashboard } from './ComplianceDashboard';
export { SecurityScore } from './SecurityScore';

// SecuritySection - Main section component that combines all security features
import { useSettings } from '../../../contexts/SettingsContext';
import { TwoFactorSetup } from './TwoFactorSetup';
import { SessionsList } from './SessionsList';
import { ApiKeyManager } from './ApiKeyManager';
import { DataExport } from './DataExport';
import { LoginHistory } from './LoginHistory';
import { SecurityPolicies } from './SecurityPolicies';
import { IPWhitelist } from './IPWhitelist';
import { ComplianceDashboard } from './ComplianceDashboard';
import { SecurityScore } from './SecurityScore';

export function SecuritySection() {
  const { state } = useSettings();

  // Only render when security section is active
  if (state.activeSection !== 'security') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Two-Factor Authentication */}
      <TwoFactorSetup />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Active Sessions */}
      <SessionsList />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* API Keys */}
      <ApiKeyManager />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Data Export */}
      <DataExport />
    </div>
  );
}

// AdvancedSecuritySection - Sprint 9: Advanced Security features
interface AdvancedSecuritySectionProps {
  isEnterprise?: boolean;
  onNavigate?: (section: string) => void;
}

export function AdvancedSecuritySection({ isEnterprise = false, onNavigate }: AdvancedSecuritySectionProps) {
  const { state } = useSettings();

  // Only render when advanced-security section is active
  if (state.activeSection !== 'advanced-security') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Security Score */}
      <SecurityScore onNavigate={onNavigate} />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Login History */}
      <LoginHistory />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Security Policies */}
      <SecurityPolicies isEnterprise={isEnterprise} />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* IP Whitelist */}
      <IPWhitelist isEnterprise={isEnterprise} />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Compliance Dashboard */}
      <ComplianceDashboard isEnterprise={isEnterprise} />
    </div>
  );
}

export default SecuritySection;
