import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LeftSidebar } from './components/LeftSidebar';
import { MainContent } from './components/MainContent';
import { RightSidebar } from './components/RightSidebar';
import { ChatHistoryPanel } from './components/ChatHistoryPanel';
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
import { KnowledgeGraphFloatingWindow } from '../../components/ContextDetailInspector/modals/KnowledgeGraphFloatingWindow';
import { useNotifications } from '../../hooks/useNotifications';
import type { WorktreeWithBranches } from '../../types';
import { useChatHistory } from '../../contexts/ChatHistoryContext';
import { LayoutProvider, useLayout } from '../../contexts/LayoutContext';
import { HeaderLayoutControls } from '../../components/HeaderLayoutControls';
import { cn } from '../../utils/cn';
import { tabConfig } from '../../styles/contextInspector';
import { Loader2, AlertCircle, ArrowLeft, ChevronDown, Check, GitBranch, FolderOpen } from 'lucide-react';
import type { TabType } from '../../types/contextInspector';
import type { Notification, SettingsSection } from '../../types/settings';

// Valid tab values
const VALID_TABS: TabType[] = ['overview', 'knowledgebase', 'knowledgegraph'];

// Color palette per worktree (cycles if more worktrees than colors)
const WORKTREE_COLORS = [
  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
];

// Mock worktree data
const MOCK_WORKTREES: WorktreeWithBranches[] = [
  {
    id: 'ws-1',
    name: 'main',
    path: '/main',
    isActive: true,
    currentBranch: 'develop',
    branches: [
      { name: 'main', isDefault: true, isCurrent: false, lastCommit: '3h ago' },
      { name: 'develop', isDefault: false, isCurrent: true, lastCommit: '25m ago' },
      { name: 'feature/auth', isDefault: false, isCurrent: false, lastCommit: '2d ago' },
    ],
  },
  {
    id: 'ws-2',
    name: 'feature/new-ui',
    path: '/feature-new-ui',
    isActive: false,
    currentBranch: 'feature/new-ui',
    branches: [
      { name: 'main', isDefault: true, isCurrent: false, lastCommit: '3h ago' },
      { name: 'feature/new-ui', isDefault: false, isCurrent: true, lastCommit: '1h ago' },
      { name: 'hotfix/css', isDefault: false, isCurrent: false, lastCommit: '5h ago' },
    ],
  },
  {
    id: 'ws-3',
    name: 'bugfix/api-timeout',
    path: '/bugfix-api-timeout',
    isActive: false,
    currentBranch: 'bugfix/api-timeout',
    branches: [
      { name: 'main', isDefault: true, isCurrent: false, lastCommit: '3h ago' },
      { name: 'bugfix/api-timeout', isDefault: false, isCurrent: true, lastCommit: '45m ago' },
    ],
  },
];

function ProjectDetailPageContent() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading, error } = useProjectData(projectId);
  const { openIngestionModal, openIngestionModalEmpty } = useIngestion();
  const { createNewChat, addMessage } = useChatHistory();

  // Layout context
  const { state: layoutState, toggleLeftSidebar } = useLayout();

  // Selected ingestion for master-detail pattern
  const [selectedIngestionNumbers, setSelectedIngestionNumbers] = useState<number[]>([]);

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

  // Knowledge Graph floating window state
  const [isKGFloatingOpen, setIsKGFloatingOpen] = useState(false);
  const handleKGFloatingClose = useCallback(() => setIsKGFloatingOpen(false), []);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection | undefined>();

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Worktree/branch selector
  const [isWorktreeSwitcherOpen, setIsWorktreeSwitcherOpen] = useState(false);
  const worktreeSwitcherRef = useRef<HTMLDivElement>(null);
  const [selectedWorktree, setSelectedWorktree] = useState<WorktreeWithBranches>(MOCK_WORKTREES[0]);
  const [selectedBranch, setSelectedBranch] = useState(MOCK_WORKTREES[0].currentBranch);
  const [hoveredWorktree, setHoveredWorktree] = useState<WorktreeWithBranches | null>(null);

  // Left sidebar resizing (delta-based for panel reorder support)
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const leftResizeStartRef = useRef({ x: 0, width: 240 });

  const handleLeftResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    leftResizeStartRef.current = { x: e.clientX, width: sidebarWidth };
    const isOnLeft = layoutState.panelOrder.indexOf('left') < layoutState.panelOrder.indexOf('center');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      const rawDelta = ev.clientX - leftResizeStartRef.current.x;
      const delta = isOnLeft ? rawDelta : -rawDelta;
      const newWidth = Math.min(Math.max(leftResizeStartRef.current.width + delta, 180), 500);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth, layoutState.panelOrder]);

  // Right sidebar resizing (delta-based)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(280);
  const rightResizeStartRef = useRef({ x: 0, width: 280 });

  const handleRightResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    rightResizeStartRef.current = { x: e.clientX, width: rightSidebarWidth };
    const isOnRight = layoutState.panelOrder.indexOf('right') > layoutState.panelOrder.indexOf('center');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      // Dragging toward center = wider sidebar
      const rawDelta = rightResizeStartRef.current.x - ev.clientX;
      const delta = isOnRight ? rawDelta : -rawDelta;
      const newWidth = Math.min(Math.max(rightResizeStartRef.current.width + delta, 180), 500);
      setRightSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [rightSidebarWidth, layoutState.panelOrder]);

  // Chat History panel resizing (always far-right, independent of panelOrder)
  const [chatHistoryWidth, setChatHistoryWidth] = useState(280);
  const chatHistoryResizeStartRef = useRef({ x: 0, width: 280 });

  const handleChatHistoryResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    chatHistoryResizeStartRef.current = { x: e.clientX, width: chatHistoryWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      const delta = chatHistoryResizeStartRef.current.x - ev.clientX;
      const newWidth = Math.min(Math.max(chatHistoryResizeStartRef.current.width + delta, 180), 500);
      setChatHistoryWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [chatHistoryWidth]);

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
    setSelectedIngestionNumbers([]);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // Keyboard shortcuts for tab switching (Cmd/Ctrl + 1-3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabMap: Record<string, TabType> = {
          '1': 'overview',
          '2': 'knowledgebase',
          '3': 'knowledgegraph',
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

  // Close worktree switcher on outside click
  useEffect(() => {
    if (!isWorktreeSwitcherOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (worktreeSwitcherRef.current && !worktreeSwitcherRef.current.contains(e.target as Node)) {
        setIsWorktreeSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWorktreeSwitcherOpen]);

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

  // Handler for selecting ingestions from the right sidebar
  const handleSelectIngestion = useCallback((ingestionNumbers: number[]) => {
    setSelectedIngestionNumbers(ingestionNumbers);
  }, []);

  // Handler for opening Knowledge Graph full view + activating a KG chat session
  const handleViewFullGraph = useCallback(() => {
    // Open the KG popup window
    setIsKGFloatingOpen(true);

    // Create a dedicated chat session for discussing the Knowledge Graph
    createNewChat(false, 'Knowledge Graph');

    // Add an initial assistant message with KG context
    // Use setTimeout to ensure the chat session is created before adding the message
    setTimeout(() => {
      addMessage({
        role: 'model',
        content:
          'I\'m your Knowledge Graph assistant. I can help you understand the entities, relationships, and structure of your project\'s knowledge graph.\n\n' +
          'You can ask me things like:\n' +
          '- "What are the most connected entities?"\n' +
          '- "Explain the relationship between module X and class Y"\n' +
          '- "Which clusters have the most dependencies?"\n' +
          '- "Suggest ways to reduce coupling in the graph"',
      });
    }, 50);

    // Switch to Overview tab so the chat panel is visible
    handleTabChange('overview');
  }, [createNewChat, addMessage, handleTabChange]);

  // Panel position indices for resize handle gap placement
  const leftIdx = layoutState.panelOrder.indexOf('left');
  const centerIdx = layoutState.panelOrder.indexOf('center');
  const rightIdx = layoutState.panelOrder.indexOf('right');

  // Each sidebar's resize handle goes in the gap facing center
  // Gap 0 = between position 0 and 1, Gap 1 = between position 1 and 2
  const leftHandleGap = leftIdx < centerIdx ? leftIdx : leftIdx - 1;
  const rightHandleGap = rightIdx < centerIdx ? rightIdx : rightIdx - 1;

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
          {/* Left section - Back + Project name */}
          <div className="shrink-0 h-full flex items-center gap-2 px-3">
            <button
              onClick={() => navigate('/')}
              className="flex-shrink-0 p-2 rounded-lg bg-white/[0.07] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.13] hover:border-white/[0.15] transition-all duration-150"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Project name + Worktree/Branch selector dropdown */}
            <div ref={worktreeSwitcherRef} className="relative min-w-0">
              <button
                onClick={() => setIsWorktreeSwitcherOpen(!isWorktreeSwitcherOpen)}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors duration-150',
                  'hover:bg-white/10',
                  isWorktreeSwitcherOpen && 'bg-white/10'
                )}
              >
                <span className="text-sm font-medium text-gray-300 truncate max-w-[140px]">
                  {project.name}
                </span>
                <ChevronDown className={cn(
                  'w-3 h-3 text-gray-500 flex-shrink-0 transition-transform duration-150',
                  isWorktreeSwitcherOpen && 'rotate-180'
                )} />
              </button>

              {isWorktreeSwitcherOpen && (
                <div
                  className="absolute top-full left-0 mt-1 z-50"
                  onMouseLeave={() => setHoveredWorktree(null)}
                >
                  {/* Worktrees panel */}
                  <div className="w-56 bg-[#141b2d] border border-[#1e293b] rounded-lg shadow-xl py-1">
                    <div className="px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Worktrees</span>
                    </div>
                    {MOCK_WORKTREES.map((ws, wsIndex) => {
                      const color = WORKTREE_COLORS[wsIndex % WORKTREE_COLORS.length];
                      return (
                      <div key={ws.id} className="relative">
                        <button
                          onMouseEnter={() => setHoveredWorktree(ws)}
                          onClick={() => {
                            setSelectedWorktree(ws);
                            setSelectedBranch(ws.currentBranch);
                          }}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-100',
                            ws.id === selectedWorktree.id
                              ? `${color.bg} text-white`
                              : hoveredWorktree?.id === ws.id
                                ? 'bg-white/5 text-white'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <FolderOpen className={cn(
                            'w-4 h-4 flex-shrink-0',
                            ws.id === selectedWorktree.id ? color.text : 'text-gray-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{ws.name}</div>
                            <div className="text-[11px] text-gray-500">{ws.path}</div>
                          </div>
                          {ws.id === selectedWorktree.id && (
                            <Check className={cn('w-4 h-4 flex-shrink-0', color.text)} />
                          )}
                          <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0 -rotate-90" />
                        </button>

                        {/* Branches flyout — anchored to this worktree row */}
                        {hoveredWorktree?.id === ws.id && (
                          <div
                            className="absolute left-full top-0 ml-1 w-60 bg-[#141b2d] border border-[#1e293b] rounded-lg shadow-xl py-1 max-h-96 overflow-y-auto"
                            onMouseEnter={() => setHoveredWorktree(ws)}
                          >
                            <div className="px-3 py-1.5">
                              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', color.text)}>
                                Branches — {ws.name}
                              </span>
                            </div>
                            {ws.branches.map((branch) => (
                              <button
                                key={branch.name}
                                onClick={() => {
                                  setSelectedWorktree(ws);
                                  setSelectedBranch(branch.name);
                                  setIsWorktreeSwitcherOpen(false);
                                  setHoveredWorktree(null);
                                }}
                                className={cn(
                                  'flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-100',
                                  branch.name === selectedBranch && ws.id === selectedWorktree.id
                                    ? `${color.bg} text-white`
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                )}
                              >
                                <GitBranch className={cn(
                                  'w-4 h-4 flex-shrink-0',
                                  branch.name === selectedBranch && ws.id === selectedWorktree.id ? color.text : 'text-gray-500'
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {branch.name}
                                    {branch.isDefault && (
                                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">default</span>
                                    )}
                                  </div>
                                  {branch.lastCommit && (
                                    <div className="text-[11px] text-gray-500">{branch.lastCommit}</div>
                                  )}
                                </div>
                                {branch.name === selectedBranch && ws.id === selectedWorktree.id && (
                                  <Check className={cn('w-4 h-4 flex-shrink-0', color.text)} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center + Right section - Tabs + Layout Controls + Share + Live + Bell + Avatar */}
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

            {/* Right actions: Layout Controls + Share + Bell + Avatar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Layout Toggle Controls */}
              <HeaderLayoutControls projectId={project.id} onShare={() => setIsShareModalOpen(true)} />

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

        {/* Three columns below the top bar - rendered in panelOrder for correct DOM order */}
        <div className="flex-1 flex overflow-hidden">
          {/* Position 0 */}
          {layoutState.panelOrder[0] === 'left' && (
            <PanelErrorBoundary key="left-panel" panelName="Source Files">
              {layoutState.leftSidebarCollapsed ? (
                <aside
                  className="flex-shrink-0 h-full bg-[#0d1220] border-r border-[#1e293b] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ width: 48 }}
                  onClick={toggleLeftSidebar}
                  title="Show Explorer"
                >
                  <span
                    className="text-[11px] font-medium text-gray-500 select-none"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Explorer
                  </span>
                </aside>
              ) : (
                <LeftSidebar
                  className="flex-shrink-0"
                  style={{ width: sidebarWidth }}
                  projectName={project.name}
                />
              )}
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[0] === 'center' && (
            <PanelErrorBoundary key="center-panel" panelName="Main Content">
              <MainContent
                className="flex-1 min-w-0"
                projectName={project.name}
                projectId={project.id}
                activeTab={activeTab}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onViewFullGraph={handleViewFullGraph}
              />
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[0] === 'right' && !layoutState.rightSidebarCollapsed && (
            <PanelErrorBoundary key="right-panel" panelName="Right Panel">
              <RightSidebar
                className="flex-shrink-0"
                projectId={project.id}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onSelectIngestion={handleSelectIngestion}
                expandedWidth={rightSidebarWidth}
              />
            </PanelErrorBoundary>
          )}

          {/* Gap 0 resize handle */}
          {leftHandleGap === 0 && !layoutState.leftSidebarCollapsed && (
            <div
              key="left-handle"
              onMouseDown={handleLeftResizeMouseDown}
              className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
            />
          )}
          {rightHandleGap === 0 && !layoutState.rightSidebarCollapsed && (
            <div
              key="right-handle"
              onMouseDown={handleRightResizeMouseDown}
              className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
            />
          )}

          {/* Position 1 */}
          {layoutState.panelOrder[1] === 'left' && (
            <PanelErrorBoundary key="left-panel" panelName="Source Files">
              {layoutState.leftSidebarCollapsed ? (
                <aside
                  className="flex-shrink-0 h-full bg-[#0d1220] border-r border-[#1e293b] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ width: 48 }}
                  onClick={toggleLeftSidebar}
                  title="Show Explorer"
                >
                  <span
                    className="text-[11px] font-medium text-gray-500 select-none"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Explorer
                  </span>
                </aside>
              ) : (
                <LeftSidebar
                  className="flex-shrink-0"
                  style={{ width: sidebarWidth }}
                  projectName={project.name}
                />
              )}
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[1] === 'center' && (
            <PanelErrorBoundary key="center-panel" panelName="Main Content">
              <MainContent
                className="flex-1 min-w-0"
                projectName={project.name}
                projectId={project.id}
                activeTab={activeTab}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onViewFullGraph={handleViewFullGraph}
              />
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[1] === 'right' && !layoutState.rightSidebarCollapsed && (
            <PanelErrorBoundary key="right-panel" panelName="Right Panel">
              <RightSidebar
                className="flex-shrink-0"
                projectId={project.id}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onSelectIngestion={handleSelectIngestion}
                expandedWidth={rightSidebarWidth}
              />
            </PanelErrorBoundary>
          )}

          {/* Gap 1 resize handle */}
          {leftHandleGap === 1 && !layoutState.leftSidebarCollapsed && (
            <div
              key="left-handle"
              onMouseDown={handleLeftResizeMouseDown}
              className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
            />
          )}
          {rightHandleGap === 1 && !layoutState.rightSidebarCollapsed && (
            <div
              key="right-handle"
              onMouseDown={handleRightResizeMouseDown}
              className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
            />
          )}

          {/* Position 2 */}
          {layoutState.panelOrder[2] === 'left' && (
            <PanelErrorBoundary key="left-panel" panelName="Source Files">
              {layoutState.leftSidebarCollapsed ? (
                <aside
                  className="flex-shrink-0 h-full bg-[#0d1220] border-r border-[#1e293b] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ width: 48 }}
                  onClick={toggleLeftSidebar}
                  title="Show Explorer"
                >
                  <span
                    className="text-[11px] font-medium text-gray-500 select-none"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Explorer
                  </span>
                </aside>
              ) : (
                <LeftSidebar
                  className="flex-shrink-0"
                  style={{ width: sidebarWidth }}
                  projectName={project.name}
                />
              )}
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[2] === 'center' && (
            <PanelErrorBoundary key="center-panel" panelName="Main Content">
              <MainContent
                className="flex-1 min-w-0"
                projectName={project.name}
                projectId={project.id}
                activeTab={activeTab}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onViewFullGraph={handleViewFullGraph}
              />
            </PanelErrorBoundary>
          )}
          {layoutState.panelOrder[2] === 'right' && !layoutState.rightSidebarCollapsed && (
            <PanelErrorBoundary key="right-panel" panelName="Right Panel">
              <RightSidebar
                className="flex-shrink-0"
                projectId={project.id}
                selectedIngestionNumbers={selectedIngestionNumbers}
                onSelectIngestion={handleSelectIngestion}
                expandedWidth={rightSidebarWidth}
              />
            </PanelErrorBoundary>
          )}

          {/* Chat History - always on the far right, independent of panelOrder */}
          {layoutState.rightSidebarTab === 'chats' && (
            <>
              <div
                onMouseDown={handleChatHistoryResizeMouseDown}
                className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e293b] hover:bg-blue-500/50 active:bg-blue-500 transition-colors"
              />
              <ChatHistoryPanel
                className="flex-shrink-0"
                expandedWidth={chatHistoryWidth}
              />
            </>
          )}
        </div>
      </div>

      {/* Ingestion Modal */}
      <IngestionModal projectName={project.name} projectId={project.id} />

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

      {/* Knowledge Graph Floating Window */}
      <KnowledgeGraphFloatingWindow
        isOpen={isKGFloatingOpen}
        onClose={handleKGFloatingClose}
        contextId={project.id}
      />
    </>
  );
}

export function ProjectDetailPage() {
  return (
    <LayoutProvider>
      <ProjectDetailPageContent />
    </LayoutProvider>
  );
}

export default ProjectDetailPage;
