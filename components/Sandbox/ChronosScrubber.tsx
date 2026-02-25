/** ChronosScrubber — timeline bar with checkpoint dots, rewind/fork controls. */

import { useState, useCallback } from 'react';
import { Camera, RotateCcw, GitFork } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ChronosSnapshot } from '../../services/sandraApi';

interface ChronosScrubberProps {
  timeline: ChronosSnapshot[];
  onRewind: (snapshotId: string) => void;
  onFork: (snapshotId: string, count: number) => void;
  onCheckpoint: () => void;
}

export function ChronosScrubber({ timeline, onRewind, onFork, onCheckpoint }: ChronosScrubberProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selected = selectedId || (timeline.length > 0 ? timeline[timeline.length - 1].id : null);

  const handleDotClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Timeline bar */}
      <div className="px-4 py-3">
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            No checkpoints yet — click Checkpoint to create one
          </div>
        ) : (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {timeline.map((snap, i) => {
              const isSelected = snap.id === selected;
              const isHovered = snap.id === hoveredId;
              const isLast = i === timeline.length - 1;

              return (
                <div key={snap.id} className="flex items-center">
                  {/* Dot */}
                  <button
                    onClick={() => handleDotClick(snap.id)}
                    onMouseEnter={() => setHoveredId(snap.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="relative group"
                    title={`${snap.name || `Checkpoint ${i + 1}`}\n${new Date(snap.created_at).toLocaleTimeString()}`}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full transition-all',
                        isSelected
                          ? 'bg-primary ring-2 ring-primary/30 scale-125'
                          : isLast
                            ? 'bg-primary/60'
                            : 'bg-muted-foreground/40 hover:bg-primary/60'
                      )}
                    />
                    {/* Tooltip */}
                    {(isHovered || isSelected) && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs text-foreground whitespace-nowrap shadow-lg z-10">
                        {snap.name || `Checkpoint ${i + 1}`}
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(snap.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="w-6 h-0.5 bg-border" />
                  )}
                </div>
              );
            })}

            {/* Current position indicator */}
            <div className="ml-2 w-0 h-0 border-l-4 border-l-primary border-y-4 border-y-transparent" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={onCheckpoint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors"
        >
          <Camera size={13} />
          Checkpoint
        </button>

        <button
          onClick={() => selected && onRewind(selected)}
          disabled={!selected}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            selected
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
          )}
        >
          <RotateCcw size={13} />
          Rewind
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {[1, 3, 5].map((count) => (
          <button
            key={count}
            onClick={() => selected && onFork(selected, count)}
            disabled={!selected}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              selected
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            )}
          >
            <GitFork size={13} />
            Fork x{count}
          </button>
        ))}

        {/* Checkpoint count */}
        <div className="ml-auto text-xs text-muted-foreground">
          {timeline.length} checkpoint{timeline.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
