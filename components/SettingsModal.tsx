// SettingsModal - Main settings modal with full layout
// Setting Sprint 1, 2, 3, 4, 5, 6, 7, 8, 9, 10: Full Settings Implementation
// Note: Profile moved to MyProfileModal (task_1_5)
// Note: General removed - functionality in MyProfileModal
// Note: Integrations moved to Dashboard tab (task_1_4)

import { X } from "lucide-react";
import { SettingsLayout } from "./Settings/SettingsLayout";
import { ProfileSection } from "./Settings/Profile";
import { SecuritySection, AdvancedSecuritySection } from "./Settings/Security";
import { BillingSection } from "./Settings/Billing";
import { MembersSection } from "./Settings/Members";
import { NotificationsSection } from "./Settings/Notifications";
import { AuditLogSection } from "./Settings/AuditLog";
import type { SettingsSection } from "../types/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
}

export function SettingsModal({ isOpen, onClose, initialSection }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[80vh] bg-card border border-border shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Full Settings Layout */}
        <div className="flex-1 overflow-hidden">
          <SettingsLayout initialSection={initialSection}>
            <ProfileSection />
            <SecuritySection />
            <BillingSection />
            <MembersSection />
            <NotificationsSection />
            <AdvancedSecuritySection />
            <AuditLogSection />
          </SettingsLayout>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
