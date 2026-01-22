import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { PanopticonView } from "./components/Panopticon/PanopticonView";
import { AgentsView } from "./components/Agents/AgentsView";
import { HypervisaView } from "./components/Hypervisa/HypervisaView";
import { SettingsModal } from "./components/SettingsModal";
import { ContextDetailInspector } from "./components/ContextDetailInspector";
import { ContextInspectorProvider } from "./contexts/ContextInspectorContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { WorkspaceMode } from "./types";
import { Menu } from "lucide-react";

function App() {
  const [mode, setMode] = useState<WorkspaceMode>("agents");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleModeChange = (newMode: WorkspaceMode) => {
    setMode(newMode);
    setIsMobileMenuOpen(false);
  };

  return (
    <ContextInspectorProvider>
      <RealtimeProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
          <Sidebar
            currentMode={mode}
            onModeChange={handleModeChange}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0"></div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 relative z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="font-bold text-white text-lg">K</span>
                </div>
                <span className="font-bold text-slate-100">KIJKO</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative z-10">
              <div className="h-full w-full rounded-xl border border-slate-700 bg-slate-800/30 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                {mode === "agents" && <AgentsView />}

                {mode === "hyperglyph" && <HypervisaView />}

                {mode === "panopticon" && <PanopticonView />}
              </div>
            </div>
          </main>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          {/* Context Detail Inspector Modal */}
          <ContextDetailInspector />
        </div>
      </RealtimeProvider>
    </ContextInspectorProvider>
  );
}

export default App;
