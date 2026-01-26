import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LeftSidebar } from './components/LeftSidebar';
import { MainContent } from './components/MainContent';
import { RightSidebar } from './components/RightSidebar';
import { IngestionModal } from './components/IngestionModal';
import { useProjectData } from '../../hooks/useProjectData';
import { useIngestion, formatFileSizeFromBytes } from '../../contexts/IngestionContext';
import { getPendingFileForIngestion } from '../../utils/fileTransferStore';
import { PanelErrorBoundary } from '../../components/ErrorBoundary';
import { NotificationBell } from '../../components/Notifications/NotificationBell';
import { NotificationPanel } from '../../components/Notifications/NotificationPanel';
import { UserAvatar } from '../../components/Dashboard/UserAvatar';
import { UserDropdown } from '../../components/Dashboard/UserDropdown';
import { SettingsModal } from '../../components/SettingsModal';
import { ShareModal } from '../../components/ContextDetailInspector/modals/ShareModal';
import { useNotifications } from '../../hooks/useNotifications';
import { useProjects } from '../../contexts/ProjectsContext';
import { cn } from '../../utils/cn';
import { tabConfig } from '../../styles/contextInspector';
import { Loader2, AlertCircle, Share2, ArrowLeft, Wrench, ChevronDown, Check } from 'lucide-react';
import type { TabType } from '../../types/contextInspector';
import type { Notification, SettingsSection } from '../../types/settings';

// Valid tab values
const VALID_TABS: TabType[] = ['overview', 'compression', 'enrichments'];

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading, error } = useProjectData(projectId);
  const { openIngestionModal, openIngestionModalEmpty } = useIngestion();

  // Selected ingestion for master-detail pattern
  const [selectedIngestionNumber, setSelectedIngestionNumber] = useState<number | null>(null);

  // Tab state - controlled from here, synced with URL
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview'
  );

  // Sync activeTab with URL changes (browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null;
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection | undefined>();

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Project switcher dropdown
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);
  const projectSwitcherRef = useRef<HTMLDivElement>(null);
  const { projects } = useProjects();

  // Left sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isResizingRef = useRef(false);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(ev.clientX, 180), 500);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Notifications
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

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    togglePanel(false);
  }, [markAsRead, togglePanel]);

  const handleLogout = useCallback(() => {
    console.log('Logout clicked');
  }, []);

  // Tab change handler - updates both state and URL
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedIngestionNumber(null);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // Keyboard shortcuts for tab switching (Cmd/Ctrl + 1-3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabMap: Record<string, TabType> = {
          '1': 'overview',
          '2': 'compression',
          '3': 'enrichments',
        };
        const tab = tabMap[e.key];
        if (tab) {
          e.preventDefault();
          handleTabChange(tab);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  // Close project switcher on outside click
  useEffect(() => {
    if (!isProjectSwitcherOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (projectSwitcherRef.current && !projectSwitcherRef.current.contains(e.target as Node)) {
        setIsProjectSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectSwitcherOpen]);

  // Check for openIngestion param and trigger modal
  const openIngestionParam = searchParams.get('openIngestion');
  const fileConsumedRef = useRef(false);

  useEffect(() => {
    if (!openIngestionParam || !project) return;

    if (openIngestionParam === 'true') {
      openIngestionModalEmpty();
    } else if (openIngestionParam === 'file' && !fileConsumedRef.current) {
      const pending = getPendingFileForIngestion();
      if (pending) {
        fileConsumedRef.current = true;
        openIngestionModal({
          id: `file-${Date.now()}`,
          name: pending.file.name,
          size: formatFileSizeFromBytes(pending.file.size),
          sizeBytes: pending.file.size,
        });
      } else {
        openIngestionModalEmpty();
      }
    }

    searchParams.delete('openIngestion');
    setSearchParams(searchParams, { replace: true });
  }, [openIngestionParam, project, openIngestionModal, openIngestionModalEmpty, searchParams, setSearchParams]);

  // Handler for selecting an ingestion from the right sidebar
  const handleSelectIngestion = useCallback((ingestionNumber: number | null) => {
    setSelectedIngestionNumber(ingestionNumber);
  }, []);

  // Handler for closing ingestion detail view
  const handleCloseIngestionDetail = useCallback(() => {
    setSelectedIngestionNumber(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading project...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="h-screen w-full bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-md px-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Project Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || `The project with ID "${projectId}" could not be found.`}
          </p>
          <a
            href="/"
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Projects
          </a>
        </div>
      </div>
    );
  }

  // Main layout
  return (
    <>
      <div className="h-screen w-full bg-[#0a0e1a] flex flex-col overflow-hidden">
        {/* Unified Top Bar (Row 1 - h-12) spanning full width */}
        <header className="h-12 shrink-0 flex items-center border-b border-[#1e293b] bg-[#0d1220]">
          {/* Left section - Back + Project name (same width as left sidebar) */}
          <div className="shrink-0 h-full flex items-center gap-2 px-3 border-r border-[#1e293b]" style={{ width: sidebarWidth }}>
            <button
              onClick={() => navigate('/')}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
              aria-label="Back to project dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Project switcher dropdown */}
            <div ref={projectSwitcherRef} className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsProjectSwitcherOpen(!isProjectSwitcherOpen)}
                className={cn(
                  'flex items-center gap-2 w-full px-1.5 py-1 rounded-lg transition-colors duration-150',
                  'hover:bg-white/10',
                  isProjectSwitcherOpen && 'bg-white/10'
                )}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-white truncate">
                  {project.name}
                </span>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-150',
                  isProjectSwitcherOpen && 'rotate-180'
                )} />
              </button>

              {isProjectSwitcherOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#141b2d] border border-[#1e293b] rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (p.id !== project.id) {
                          navigate(`/project/${p.id}`);
                        }
                        setIsProjectSwitcherOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors duration-100',
                        p.id === project.id
                          ? 'bg-blue-500/10 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ backgroundColor: `${p.icon.backgroundColor}30` }}
                      >
                        {p.icon.type === 'emoji' ? (
                          <span>{p.icon.value}</span>
                        ) : (
                          <span className="text-[10px] font-bold" style={{ color: p.icon.backgroundColor }}>
                            {p.icon.value}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-gray-500">{p.sourceCount} sources</div>
                      </div>
                      {p.id === project.id && (
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center + Right section - Tabs + Share + Live + Bell + Avatar */}
          <div className="flex-1 flex items-center justify-between px-6 h-full">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 h-full">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={cn(
                    'relative px-4 h-full text-sm font-medium transition-colors duration-150',
                    'focus:outline-none',
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                  title={`${tab.label} (\u2318${tab.shortcut})`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500',
                        'animate-[fadeIn_150ms_ease-out]'
                      )}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right actions: Share + Live + Bell + Avatar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className={cn(
                  'flex items-center gap-2 px-3 h-8 rounded-lg',
                  'text-gray-300 hover:text-white',
                  'bg-white/5 hover:bg-white/10 border border-white/10',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                )}
                title="Share project"
                aria-label="Share project"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-sm font-medium text-green-400">Live</span>
              </div>

              {/* Notification Bell with Panel */}
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
                <UserAvatar
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-8 h-8 text-xs"
                />
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

        {/* Three columns below the top bar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Source Files */}
          <PanelErrorBoundary panelName="Source Files">
            <LeftSidebar className="flex-shrink-0" style={{ width: sidebarWidth }} projectName={project.name} projectId={project.id} />
          </PanelErrorBoundary>

          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
          />

          {/* Main Content */}
          <PanelErrorBoundary panelName="Main Content">
            <MainContent
              className="flex-1 min-w-0"
              projectName={project.name}
              projectId={project.id}
              activeTab={activeTab}
              selectedIngestionNumber={selectedIngestionNumber}
              onCloseIngestionDetail={handleCloseIngestionDetail}
            />
          </PanelErrorBoundary>

          {/* Right Sidebar - Chat History & Ingestion History */}
          <PanelErrorBoundary panelName="History Panel">
            <RightSidebar
              className="flex-shrink-0"
              projectId={project.id}
              selectedIngestionNumber={selectedIngestionNumber}
              onSelectIngestion={handleSelectIngestion}
            />
          </PanelErrorBoundary>
        </div>
      </div>

      {/* Ingestion Modal */}
      <IngestionModal projectName={project.name} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSection={settingsInitialSection}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </>
  );
}

export default ProjectDetailPage;
