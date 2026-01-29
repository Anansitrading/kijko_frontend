
interface ProjectsOnboardingCTAProps {
  onCreateProject: () => void;
}

export function ProjectsOnboardingCTA({ onCreateProject }: ProjectsOnboardingCTAProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 relative overflow-auto">
      {/* Hero Section */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white via-emerald-400 to-amber-400 bg-clip-text text-transparent">
          One sign-up to rule them all
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Kijko</span> gives you access to <span className="text-foreground font-medium">all</span> your <span className="text-foreground font-medium">context</span>, <span className="text-foreground font-medium">integrations</span> and <span className="text-foreground font-medium">skills</span> in any IDE.
          Never reconfigure when switching tools, everything <span className="text-foreground font-medium">follows</span> you or just use our AI-Powered Editor.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="flex flex-col items-center w-full max-w-4xl">
        {/* Top Container: All features in one box */}
        <div className="w-full p-6 bg-card border border-border rounded-xl">
          <div className="flex gap-6 items-start">
            {/* Hypervisa - Takes more space */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Hypervisa
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Give your agent full oversight of your codebase and documentation with a <span className="text-foreground font-medium">Hypervisa ingestion</span>. Build an <span className="text-foreground font-medium">episodic memory</span> system with a knowledge graph that learns and evolves and <span className="text-foreground font-medium">save tokens</span>.
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-border shrink-0" />

            {/* Integrations */}
            <div className="w-44">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Integrations
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Discover, Create and Connect to your favorite tools and services in our Integration library.
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-border shrink-0" />

            {/* Skills */}
            <div className="w-44">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Skills
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Search, create and install your favorite skills quickly in our skills library.
              </p>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="w-0.5 h-6 bg-border" />

        {/* Branch label */}
        <div className="text-xs text-muted-foreground mb-2">Choose how you want to work</div>

        {/* Branching Lines SVG */}
        <svg width="560" height="40" className="shrink-0" viewBox="0 0 560 40">
          {/* Left branch (green) */}
          <path
            d="M 280 0 L 280 10 Q 280 20 270 20 L 150 20 Q 140 20 140 30 L 140 40"
            fill="none"
            stroke="rgb(34 197 94 / 0.5)"
            strokeWidth="2"
          />
          {/* Right branch (orange) */}
          <path
            d="M 280 0 L 280 10 Q 280 20 290 20 L 410 20 Q 420 20 420 30 L 420 40"
            fill="none"
            stroke="rgb(249 115 22 / 0.5)"
            strokeWidth="2"
          />
        </svg>

        {/* Two Options Row */}
        <div className="flex gap-6 w-full justify-center items-stretch">
          {/* Option 1: Work in your own IDE */}
          <div className="w-64 p-5 bg-card border-2 border-green-500/40 rounded-xl hover:border-green-500/70 transition-colors flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Work anywhere
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
              One connection to any Integrated Development Environment your Kijko setup moves with you.
            </p>
            <span className="text-xs text-green-400 font-semibold mt-2">
              Use your favorite IDE
            </span>
          </div>

          {/* Option 2: Kijko Editor */}
          <div className="w-64 p-5 bg-card border-2 border-orange-500/40 rounded-xl hover:border-orange-500/70 transition-colors flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              AI-Powered Editor
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
              Work directly in Kijko with full context, integration and skill awareness.
            </p>
            <span className="text-xs text-orange-400 font-semibold mt-2">
              Use Kijko's AI-Powered Editor
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8" />

        {/* CTA Button with shimmer animation */}
        <button
          onClick={onCreateProject}
          className="relative px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all overflow-hidden"
        >
          <span className="relative z-10">Create your first project</span>
          {/* Shimmer effect */}
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
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
