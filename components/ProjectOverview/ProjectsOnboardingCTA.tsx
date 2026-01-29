import {
  Plus,
  Code2,
  ArrowRight,
  Database,
  Laptop,
} from 'lucide-react';

interface ProjectsOnboardingCTAProps {
  onCreateProject: () => void;
}

export function ProjectsOnboardingCTA({ onCreateProject }: ProjectsOnboardingCTAProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 relative overflow-auto">
      {/* Hero Section */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-3">
          One sign-up to rule them all
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          One CLI or MCP connection gives you access to all your context, integrations and skills in any IDE.
          Never reconfigure when switching tools — everything follows you.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="flex flex-col items-center w-full max-w-4xl">
        {/* Ingest your codebase */}
        <div className="w-96 p-5 bg-card border border-border rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Ingest your codebase
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Give your agent full oversight of your codebase and documentation. Build an episodic memory system with a knowledge graph that learns and evolves.
              </p>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="w-0.5 h-6 bg-border" />

        {/* Branch label */}
        <div className="text-xs text-muted-foreground mb-4">Choose how you want to work</div>

        {/* Two Options Row */}
        <div className="flex gap-6 w-full justify-center">
          {/* Option 1: Work in your own IDE */}
          <div className="w-64 p-5 bg-card border-2 border-green-500/40 rounded-xl hover:border-green-500/70 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0">
                <Laptop size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Work anywhere
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  One connection to VS Code, Cursor, IntelliJ, or Windsurf — your full setup moves with you.
                </p>
                <span className="text-xs text-green-400 font-semibold">
                  Switch IDEs, keep everything
                </span>
              </div>
            </div>
          </div>

          {/* Option 2: Kijko Editor */}
          <div className="w-64 p-5 bg-card border-2 border-orange-500/40 rounded-xl hover:border-orange-500/70 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                <Code2 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  AI-Powered Editor
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Work directly in Kijko's intelligent editor with full context awareness.
                </p>
                <span className="text-xs text-orange-400 font-semibold">
                  Stay in Kijko
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8" />

        {/* CTA Button */}
        <button
          onClick={onCreateProject}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <Plus size={20} />
          Create your first project
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Visual Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
