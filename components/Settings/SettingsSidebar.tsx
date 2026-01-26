import React from 'react';
import {
  User,
  Shield,
  CreditCard,
  Users,
  Bell,
  Lock,
  FileText,
} from 'lucide-react';
import type { SettingsSidebarProps, SettingsSection } from '../../types/settings';
import { navigationItems, tw } from '../../styles/settings';

// Icon mapping
// Note: Puzzle icon removed - integrations moved to Dashboard tab (task_1_4)
// Note: User icon removed - profile moved to user dropdown modal (task_1_5)
// Note: Settings icon removed - general settings moved to My Profile modal
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Shield,
  CreditCard,
  Users,
  Bell,
  Lock,
  FileText,
};

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <aside className={tw.sidebar}>
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = activeSection === item.id;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onSectionChange(item.id as SettingsSection)}
              disabled={isDisabled}
              className={
                isDisabled
                  ? tw.navItemDisabled
                  : isActive
                  ? tw.navItemActive
                  : tw.navItem
              }
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className={tw.navBadge}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Settings are auto-saved
        </p>
      </div>
    </aside>
  );
}

export default SettingsSidebar;
