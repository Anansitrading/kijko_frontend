import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../../../utils/cn';
import { ProjectHeader } from './ProjectHeader';
import { TabNavigation } from '../../../../components/ContextDetailInspector/TabNavigation';
import { PageOverviewTab } from './PageOverviewTab';
import { CompressionTab } from '../../../../components/ContextDetailInspector/tabs/CompressionTab';
import { EnrichmentsTab } from '../../../../components/ContextDetailInspector/tabs/EnrichmentsTab';
import { ChangelogTab } from '../../../../components/ContextDetailInspector/tabs/ChangelogTab';
import type { TabType, ContextItem } from '../../../../types/contextInspector';

interface MainContentProps {
  className?: string;
  projectName?: string;
  projectId?: string;
  initialTab?: TabType;
  onTabChange?: (tab: TabType) => void;
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
}: MainContentProps) {
  // Active tab state - uses URL-based initialTab
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Project name state for editing
  const [currentProjectName, setCurrentProjectName] = useState(projectName);

  // Sync with initialTab when it changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sync project name when prop changes
  useEffect(() => {
    setCurrentProjectName(projectName);
  }, [projectName]);

  // Keyboard shortcuts for tab switching (Cmd/Ctrl + 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabMap: Record<string, TabType> = {
          '1': 'overview',
          '2': 'compression',
          '3': 'enrichments',
          '4': 'changelog',
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
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // Notify parent to update URL
    onTabChangeProp?.(tab);
  }, [onTabChangeProp]);

  const handleNameChange = useCallback((newName: string) => {
    setCurrentProjectName(newName);
    // TODO: In a real app, this would also update the backend
    console.log('Project name changed to:', newName);
  }, []);

  // Create context item for tab components
  const contextItem = createContextItem(projectId, currentProjectName);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PageOverviewTab contextItem={contextItem} />;
      case 'compression':
        return <CompressionTab contextItem={contextItem} />;
      case 'enrichments':
        return <EnrichmentsTab contextId={contextItem.id} />;
      case 'changelog':
        return <ChangelogTab contextId={contextItem.id} contextName={contextItem.name} />;
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
        isLive={true}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </main>
  );
}

export default MainContent;
