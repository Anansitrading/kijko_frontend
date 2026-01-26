import { useState, useEffect } from 'react';
import { cn } from '../../../../utils/cn';
import { PageOverviewTab } from './PageOverviewTab';
import { CompressionTab } from '../../../../components/ContextDetailInspector/tabs/CompressionTab';
import { KnowledgeBaseTab } from '../../../../components/ContextDetailInspector/tabs/KnowledgeBaseTab';
import { KnowledgeGraphTab } from '../../../../components/ContextDetailInspector/tabs/KnowledgeGraphTab';
import { IngestionDetailView } from './IngestionDetailView';
import type { TabType, ContextItem } from '../../../../types/contextInspector';

interface MainContentProps {
  className?: string;
  projectName?: string;
  projectId?: string;
  activeTab: TabType;
  selectedIngestionNumber?: number | null;
  onCloseIngestionDetail?: () => void;
  onViewFullGraph?: () => void;
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
  activeTab,
  selectedIngestionNumber,
  onCloseIngestionDetail,
  onViewFullGraph,
}: MainContentProps) {
  // Project name state for editing
  const [currentProjectName, setCurrentProjectName] = useState(projectName);

  // Sync project name when prop changes
  useEffect(() => {
    setCurrentProjectName(projectName);
  }, [projectName]);

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
      case 'knowledgebase':
        return <KnowledgeBaseTab contextId={contextItem.id} />;
      case 'compression':
        return <CompressionTab contextItem={contextItem} />;
      case 'knowledgegraph':
        return <KnowledgeGraphTab contextId={contextItem.id} onViewFullGraph={onViewFullGraph} />;
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
      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </main>
  );
}

export default MainContent;
