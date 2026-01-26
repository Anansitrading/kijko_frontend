import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { DashboardTabs } from './DashboardTabs';
import { ProjectsTab } from './ProjectsTab';
import { IntegrationsTab } from './IntegrationsTab';
import { SkillsTab } from './SkillsTab';
import { UserAvatar } from './UserAvatar';
import { UserDropdown } from './UserDropdown';
import { SettingsModal } from '../SettingsModal';
import { NotificationBell } from '../Notifications/NotificationBell';
import { NotificationPanel } from '../Notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import type { Project } from '../../types';
import type { Notification, SettingsSection } from '../../types/settings';

interface DashboardProps {
  onProjectSelect: (project: Project) => void;
}

export function Dashboard({ onProjectSelect }: DashboardProps) {
  const { activeTab, setActiveTab } = useTabNavigation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection | undefined>();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const {
    notifications,
    groupedNotifications,
    unreadCount,
    isPanelOpen,
    togglePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatNotificationTime,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    togglePanel(false);
  };

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log('Logout clicked');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl overflow-visible relative z-50">
        {/* Top Bar - Logo, Tabs, and Actions */}
        <div className="flex items-center justify-between px-6 py-4 overflow-visible">
          {/* Logo and Tabs */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/public/favicon.png"
                alt="Kijko logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-bold text-xl text-foreground tracking-tight hidden sm:inline">
                KIJKO
              </span>
            </div>

            {/* Main Navigation Tabs */}
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with Dropdown */}
            <div className="relative z-50">
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => togglePanel(!isPanelOpen)}
              />
              <NotificationPanel
                isOpen={isPanelOpen}
                notifications={notifications}
                groupedNotifications={groupedNotifications}
                unreadCount={unreadCount}
                onClose={() => togglePanel(false)}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onNotificationClick={handleNotificationClick}
                onSettingsClick={() => {
                  togglePanel(false);
                  setSettingsInitialSection('notifications');
                  setIsSettingsOpen(true);
                }}
                formatTime={formatNotificationTime}
              />
            </div>

            {/* User Avatar with Dropdown */}
            <div className="relative z-50">
              <UserAvatar onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} />
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                onOpenProfile={() => {
                  setSettingsInitialSection('profile');
                  setIsSettingsOpen(true);
                }}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'projects' && (
          <ProjectsTab onProjectSelect={onProjectSelect} />
        )}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'skills' && <SkillsTab />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsInitialSection(undefined);
        }}
        initialSection={settingsInitialSection}
      />

      {/* Settings Button - Bottom Left */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-all shadow-lg group z-10"
      >
        <Settings
          size={16}
          className="transition-transform duration-500 group-hover:rotate-90"
        />
        <span>Settings</span>
      </button>
    </div>
  );
}

export { DashboardTabs } from './DashboardTabs';
export { ProjectsTab } from './ProjectsTab';
export { IntegrationsTab } from './IntegrationsTab';
export { SkillsTab } from './SkillsTab';
export { UserAvatar } from './UserAvatar';
export { UserDropdown } from './UserDropdown';
