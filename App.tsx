import { type ComponentType, type PropsWithChildren, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { HypervisaView } from "./components/Hypervisa/HypervisaView";
import { Dashboard } from "./components/Dashboard";
import { SettingsModal } from "./components/SettingsModal";
import { ProjectDetailPage } from "./pages/ContextDetailInspectorPage";
import { IntegrationDetailPage } from "./components/Dashboard/integrations/IntegrationDetailPage";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChatHistoryProvider } from "./contexts/ChatHistoryContext";
import { ProjectsProvider } from "./contexts/ProjectsContext";
import { SourceFilesProvider } from "./contexts/SourceFilesContext";
import { IngestionProvider } from "./contexts/IngestionContext";
import { ContextInspectorProvider } from "./contexts/ContextInspectorContext";
import { TeamProvider } from "./contexts/TeamContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { SupportChat } from "./components/SupportChat";
import { Project } from "./types";
import { Menu, ArrowLeft } from "lucide-react";

/** Compose multiple providers into a single wrapper to avoid deep nesting. */
function composeProviders(...providers: ComponentType<PropsWithChildren>[]) {
  return function ComposedProviders({ children }: PropsWithChildren) {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    );
  };
}

const ProjectPageProviders = composeProviders(
  SourceFilesProvider,
  IngestionProvider,
  ChatHistoryProvider,
  RealtimeProvider,
);

const WorkspaceProviders = composeProviders(
  ChatHistoryProvider,
  RealtimeProvider,
  SourceFilesProvider,
);

/** Route guard — redirects to /login if not authenticated. */
function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main workspace component (existing functionality)
function WorkspaceView() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  // Placeholder handlers for ingestion - will be connected in Sprint FP5
  const handleNewIngestion = () => {
    console.log('New Ingestion clicked - to be implemented in Sprint FP5');
  };

  const handleAddFiles = () => {
    console.log('Add Files clicked - to be implemented in Sprint FP5');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  // Show Dashboard with tabs when no project is selected
  if (!selectedProject) {
    return (
      <IngestionProvider>
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
          <Dashboard onProjectSelect={handleProjectSelect} />
        </div>
      </IngestionProvider>
    );
  }

  // Show Hypervisa view when a project is selected
  return (
    <WorkspaceProviders>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
        <Sidebar
          onOpenProjects={handleBackToProjects}
          onNewIngestion={handleNewIngestion}
          onAddFiles={handleAddFiles}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0"></div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border relative z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToProjects}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors mr-1"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-lg">K</span>
              </div>
              <span className="font-bold text-foreground truncate max-w-[150px]">
                {selectedProject.name}
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop Header with Back Button */}
          <div className="hidden md:flex items-center gap-3 p-4 border-b border-border bg-card/30 relative z-20 shrink-0">
            <button
              onClick={handleBackToProjects}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Projecten</span>
            </button>
            <div className="h-4 w-px bg-border" />
            <span className="font-semibold text-foreground">
              {selectedProject.name}
            </span>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative z-10">
            <div className="h-full w-full rounded-xl border border-border bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              <HypervisaView />
            </div>
          </div>
        </main>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </WorkspaceProviders>
  );
}

// Root App component with routing
function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <ProjectsProvider>
            <ContextInspectorProvider>
              <TeamProvider>
                <Routes>
                  {/* Login page (public) */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected routes */}
                  <Route path="/" element={
                    <RequireAuth>
                      <WorkspaceView />
                    </RequireAuth>
                  } />
                  <Route path="/integration/:integrationId" element={
                    <RequireAuth>
                      <IntegrationDetailPage />
                    </RequireAuth>
                  } />
                  <Route path="/project/:projectId" element={
                    <RequireAuth>
                      <ProjectPageProviders>
                        <ProjectDetailPage />
                      </ProjectPageProviders>
                    </RequireAuth>
                  } />
                </Routes>
                {/* Support Chat Widget - Available on all pages */}
                <SupportChat />
              </TeamProvider>
            </ContextInspectorProvider>
          </ProjectsProvider>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
