import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LeftSidebar } from './components/LeftSidebar';
import { MainContent } from './components/MainContent';
import { RightSidebar } from './components/RightSidebar';
import { IngestionModal } from './components/IngestionModal';
import { useProjectData } from '../../hooks/useProjectData';
import { useIngestion } from '../../contexts/IngestionContext';
import { PanelErrorBoundary } from '../../components/ErrorBoundary';
import { Loader2, AlertCircle } from 'lucide-react';
import type { TabType } from '../../types/contextInspector';

// Valid tab values
const VALID_TABS: TabType[] = ['overview', 'compression', 'enrichments', 'changelog'];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading, error } = useProjectData(projectId);
  const { openIngestionModalEmpty } = useIngestion();

  // Get tab from URL or default to 'overview'
  const tabParam = searchParams.get('tab') as TabType | null;
  const initialTab: TabType = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  // Check for openIngestion param and trigger modal
  const shouldOpenIngestion = searchParams.get('openIngestion') === 'true';

  useEffect(() => {
    if (shouldOpenIngestion && project) {
      openIngestionModalEmpty();
      // Remove the param from URL after opening
      searchParams.delete('openIngestion');
      setSearchParams(searchParams, { replace: true });
    }
  }, [shouldOpenIngestion, project, openIngestionModalEmpty, searchParams, setSearchParams]);

  // Handler to update tab in URL
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab }, { replace: true });
  };

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
      <div className="h-screen w-full bg-[#0a0e1a] flex overflow-hidden">
        {/* Left Sidebar - Source Files */}
        <PanelErrorBoundary panelName="Source Files">
          <LeftSidebar className="w-[240px] flex-shrink-0" projectName={project.name} />
        </PanelErrorBoundary>

        {/* Main Content - Tabs and Chat */}
        <PanelErrorBoundary panelName="Main Content">
          <MainContent
            className="flex-1 min-w-0"
            projectName={project.name}
            projectId={project.id}
            initialTab={initialTab}
            onTabChange={handleTabChange}
          />
        </PanelErrorBoundary>

        {/* Right Sidebar - Chat History & Ingestion History */}
        <PanelErrorBoundary panelName="History Panel">
          <RightSidebar className="flex-shrink-0" projectId={project.id} />
        </PanelErrorBoundary>
      </div>

      {/* Ingestion Modal */}
      <IngestionModal projectName={project.name} />
    </>
  );
}

export default ProjectDetailPage;
