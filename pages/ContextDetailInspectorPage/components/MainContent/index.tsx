import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../../../utils/cn';
import { ProjectHeader } from './ProjectHeader';
import { TabNavigation } from '../../../../components/ContextDetailInspector/TabNavigation';
import { PageOverviewTab } from './PageOverviewTab';
import { CompressionTab } from '../../../../components/ContextDetailInspector/tabs/CompressionTab';
import { EnrichmentsTab } from '../../../../components/ContextDetailInspector/tabs/EnrichmentsTab';
import { IngestionDetailView } from './IngestionDetailView';
import { ShareModal } from '../../../../components/ContextDetailInspector/modals/ShareModal';
import type { TabType, ContextItem } from '../../../../types/contextInspector';

interface MainContentProps {
  className?: string;
  projectName?: string;
  projectId?: string;
  initialTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  selectedIngestionNumber?: number | null;
  onCloseIngestionDetail?: () => void;
}

// Create a mock context item from project data
// In a real app, this would come from a context or prop
function createContextItem(projectId: string, projectName: string): ContextItem {
  return {
    id: projectId,
    name: projectName,
    type: 'repo',
    size: 0,
    fileCount: 0,
    lastUpdated: new Date(),
    status: 'cached',
  };
}

export function MainContent({
  className,
  projectName = 'Project',
  projectId = 'default',
  initialTab = 'overview',
  onTabChange: onTabChangeProp,
  selectedIngestionNumber,
  onCloseIngestionDetail,
}: MainContentProps) {
  // Active tab state - uses URL-based initialTab
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Project name state for editing
  const [currentProjectName, setCurrentProjectName] = useState(projectName);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync with initialTab when it changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sync project name when prop changes
  useEffect(() => {
    setCurrentProjectName(projectName);
  }, [projectName]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // Notify parent to update URL
    onTabChangeProp?.(tab);
  }, [onTabChangeProp]);

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

  const handleNameChange = useCallback((newName: string) => {
    setCurrentProjectName(newName);
    // TODO: In a real app, this would also update the backend
    console.log('Project name changed to:', newName);
  }, []);

  // Create context item for tab components
  const contextItem = createContextItem(projectId, currentProjectName);

  // Render the active tab content or ingestion detail view
  const renderContent = () => {
    // If an ingestion is selected, show the detail view
    if (selectedIngestionNumber != null) {
      return (
        <IngestionDetailView
          ingestionNumber={selectedIngestionNumber}
          contextId={contextItem.id}
          onClose={onCloseIngestionDetail || (() => {})}
        />
      );
    }

    // Otherwise, show the active tab content
    switch (activeTab) {
      case 'overview':
        return <PageOverviewTab contextItem={contextItem} />;
      case 'compression':
        return <CompressionTab contextItem={contextItem} />;
      case 'enrichments':
        return <EnrichmentsTab contextId={contextItem.id} />;
      default:
        return <PageOverviewTab contextItem={contextItem} />;
    }
  };

  return (
    <main
      className={cn(
        'h-full bg-[#0a0e1a] flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Project Header with editable name, status, and close button */}
      <ProjectHeader
        projectName={currentProjectName}
        onNameChange={handleNameChange}
        onShare={() => setIsShareModalOpen(true)}
        isLive={true}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projectId}
        projectName={currentProjectName}
      />
    </main>
  );
}

export default MainContent;
