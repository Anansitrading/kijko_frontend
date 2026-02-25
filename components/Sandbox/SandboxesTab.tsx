/** Sandboxes tab — lists IDE sessions, grouped by project. */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Monitor, Terminal, Trash2, ExternalLink, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { listIdeSessions, destroyIdeSession, type IdeSession } from '../../services/sandraApi';
import { CreateSandboxModal } from './CreateSandboxModal';
import { IdeShell } from './IdeShell';

export function SandboxesTab() {
  const [sessions, setSessions] = useState<IdeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSandboxId, setActiveSandboxId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await listIdeSessions();
      setSessions(data);
    } catch {
      // Will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDestroy = async (sessionId: string) => {
    await destroyIdeSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleCreated = (session: IdeSession) => {
    setSessions((prev) => [session, ...prev]);
    setShowCreateModal(false);
    setActiveSandboxId(session.id);
  };

  const filtered = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by project_id
  const grouped = filtered.reduce<Record<string, IdeSession[]>>((acc, s) => {
    const key = s.project_id || '_ungrouped';
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  // If a sandbox is active, show the IDE view
  if (activeSandboxId) {
    return (
      <IdeShell
        sessionId={activeSandboxId}
        onBack={() => setActiveSandboxId(null)}
      />
    );
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-sandboxes"
      aria-labelledby="tab-sandboxes"
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sandboxes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browser-based VS Code environments with time-travel
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={18} />
            New Sandbox
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sandboxes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading sandboxes...</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([projectId, projectSessions]) => (
              <SandboxGroup
                key={projectId}
                projectId={projectId}
                sessions={projectSessions}
                onOpen={setActiveSandboxId}
                onDestroy={handleDestroy}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSandboxModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <Monitor size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No sandboxes yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Create a sandbox to get a browser-based VS Code environment with built-in
        checkpointing and time-travel.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <Plus size={18} />
        Create your first sandbox
      </button>
    </div>
  );
}

function SandboxGroup({
  projectId,
  sessions,
  onOpen,
  onDestroy,
}: {
  projectId: string;
  sessions: IdeSession[];
  onOpen: (id: string) => void;
  onDestroy: (id: string) => void;
}) {
  return (
    <div>
      {projectId !== '_ungrouped' && (
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Project: {projectId}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <SandboxCard
            key={session.id}
            session={session}
            onOpen={() => onOpen(session.id)}
            onDestroy={() => onDestroy(session.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SandboxCard({
  session,
  onOpen,
  onDestroy,
}: {
  session: IdeSession;
  onOpen: () => void;
  onDestroy: () => void;
}) {
  const statusColor = {
    creating: 'text-yellow-500',
    running: 'text-emerald-500',
    paused: 'text-blue-500',
    stopped: 'text-muted-foreground',
    failed: 'text-red-500',
    destroyed: 'text-muted-foreground',
  }[session.status] || 'text-muted-foreground';

  return (
    <div className="group bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3" onClick={onOpen}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {session.open_in === 'terminal' ? (
              <Terminal size={20} className="text-primary" />
            ) : (
              <Monitor size={20} className="text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{session.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-xs font-medium', statusColor)}>
                {session.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {session.vm_spec}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{new Date(session.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Open in editor"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDestroy(); }}
            className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
            title="Destroy sandbox"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
