import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LeftSidebar } from './components/LeftSidebar';
import { MainContent } from './components/MainContent';
import { RightSidebar } from './components/RightSidebar';
import { IngestionModal } from './components/IngestionModal';
import { useProjectData } from '../../hooks/useProjectData';
import { useIngestion, formatFileSizeFromBytes } from '../../contexts/IngestionContext';
import { getPendingFileForIngestion } from '../../utils/fileTransferStore';
import { PanelErrorBoundary } from '../../components/ErrorBoundary';
import { Loader2, AlertCircle } from 'lucide-react';
import type { TabType } from '../../types/contextInspector';

// Valid tab values (changelog moved to master-detail pattern in RightSidebar)
const VALID_TABS: TabType[] = ['overview', 'compression', 'enrichments'];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading, error } = useProjectData(projectId);
  const { openIngestionModal, openIngestionModalEmpty } = useIngestion();

  // Selected ingestion for master-detail pattern
  const [selectedIngestionNumber, setSelectedIngestionNumber] = useState<number | null>(null);

  // Get tab from URL or default to 'overview'
  const tabParam = searchParams.get('tab') as TabType | null;
  const initialTab: TabType = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  // Check for openIngestion param and trigger modal
  const openIngestionParam = searchParams.get('openIngestion');

  // Ref to prevent React Strict Mode double-execution from consuming the
  // one-time file store on the first run and then falling back to the empty
  // modal on the second run (which would override the selected file).
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
        // File data lost (e.g. page refresh), fall back to empty modal
        openIngestionModalEmpty();
      }
    }

    searchParams.delete('openIngestion');
    setSearchParams(searchParams, { replace: true });
  }, [openIngestionParam, project, openIngestionModal, openIngestionModalEmpty, searchParams, setSearchParams]);

  // Handler to update tab in URL - also clears selected ingestion
  const handleTabChange = useCallback((tab: TabType) => {
    setSelectedIngestionNumber(null); // Clear ingestion detail view when switching tabs
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

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
      <div className="h-screen w-full bg-[#0a0e1a] flex overflow-hidden">
        {/* Left Sidebar - Source Files */}
        <PanelErrorBoundary panelName="Source Files">
          <LeftSidebar className="w-[240px] flex-shrink-0" projectName={project.name} projectId={project.id} />
        </PanelErrorBoundary>

        {/* Main Content - Tabs and Chat */}
        <PanelErrorBoundary panelName="Main Content">
          <MainContent
            className="flex-1 min-w-0"
            projectName={project.name}
            projectId={project.id}
            initialTab={initialTab}
            onTabChange={handleTabChange}
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

      {/* Ingestion Modal */}
      <IngestionModal projectName={project.name} />
    </>
  );
}

export default ProjectDetailPage;
