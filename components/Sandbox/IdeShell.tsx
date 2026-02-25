/** IdeShell — Sandra IDE: code-server iframe with Chronos time-travel chrome. */

import { useState, useCallback } from 'react';
import { ArrowLeft, Camera, RotateCcw, GitFork, Settings, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useIdeSession } from '../../hooks/useIdeSession';
import { ChronosScrubber } from './ChronosScrubber';
import { EventStream } from './EventStream';

interface IdeShellProps {
  sessionId: string;
  onBack: () => void;
}

export function IdeShell({ sessionId, onBack }: IdeShellProps) {
  const {
    session,
    timeline,
    events,
    loading,
    error,
    checkpoint,
    rewind,
    fork,
    isRewinding,
  } = useIdeSession(sessionId);

  const [showEvents, setShowEvents] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRewind = useCallback(async (snapshotId: string) => {
    await rewind(snapshotId);
    // Force iframe reload after rewind (code-server restarted)
    setIframeKey((k) => k + 1);
  }, [rewind]);

  const handleFork = useCallback(async (snapshotId: string, count: number) => {
    const forks = await fork(snapshotId, count);
    // TODO: open fork view with multiple iframes
    if (forks.length > 0) {
      // For now, navigate to the first fork
      window.open(`/?tab=sandboxes&sandbox=${forks[0].id}`, '_blank');
    }
  }, [fork]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading IDE session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background">
        <p className="text-destructive mb-4">{error || 'Session not found'}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to sandboxes
        </button>
      </div>
    );
  }

  const proxyUrl = `${session.proxy_base_url}/?folder=/home/daytona/workspace`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
            title="Back to sandboxes"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="font-semibold text-foreground text-sm">{session.name}</span>
          <StatusBadge status={session.status} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkpoint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
            title="Manual checkpoint"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Checkpoint</span>
          </button>
          <button
            onClick={() => setShowEvents(!showEvents)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
              showEvents ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
            title="Toggle event stream"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Main Content — code-server iframe */}
      <div className="flex-1 relative min-h-0">
        {/* Rewind overlay */}
        {isRewinding && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <RotateCcw size={32} className="text-primary animate-spin" />
              <span className="text-foreground font-medium">Rewinding...</span>
              <span className="text-sm text-muted-foreground">Restoring filesystem and restarting code-server</span>
            </div>
          </div>
        )}

        <div className="flex h-full">
          {/* code-server iframe */}
          <iframe
            key={iframeKey}
            src={proxyUrl}
            className="flex-1 border-0"
            title="VS Code"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="clipboard-read; clipboard-write"
          />

          {/* Event stream sidebar */}
          {showEvents && (
            <div className="w-80 border-l border-border bg-card overflow-y-auto">
              <EventStream events={events} />
            </div>
          )}
        </div>
      </div>

      {/* Chronos Scrubber — bottom bar */}
      <ChronosScrubber
        timeline={timeline}
        onRewind={handleRewind}
        onFork={handleFork}
        onCheckpoint={checkpoint}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    creating: 'bg-yellow-500/20 text-yellow-600',
    running: 'bg-emerald-500/20 text-emerald-600',
    paused: 'bg-blue-500/20 text-blue-600',
    stopped: 'bg-muted text-muted-foreground',
    failed: 'bg-red-500/20 text-red-600',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-medium rounded-full',
      colors[status] || 'bg-muted text-muted-foreground'
    )}>
      {status}
    </span>
  );
}
