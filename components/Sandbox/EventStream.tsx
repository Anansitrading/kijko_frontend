/** EventStream — live event log sidebar for the IDE shell. */

import { useRef, useEffect } from 'react';
import { FileText, GitCommit, TestTube, Terminal, Save, Trash2, Download } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ChronosEvent } from '../../services/sandraApi';

interface EventStreamProps {
  events: ChronosEvent[];
}

const EVENT_ICONS: Record<string, typeof FileText> = {
  file_saved: Save,
  file_created: FileText,
  file_deleted: Trash2,
  git_commit: GitCommit,
  test_run: TestTube,
  terminal_command: Terminal,
  extension_installed: Download,
};

const EVENT_COLORS: Record<string, string> = {
  file_saved: 'text-emerald-500',
  file_created: 'text-blue-500',
  file_deleted: 'text-red-500',
  git_commit: 'text-violet-500',
  test_run: 'text-amber-500',
  terminal_command: 'text-muted-foreground',
  extension_installed: 'text-cyan-500',
};

export function EventStream({ events }: EventStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Event Stream
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            No events yet
          </div>
        ) : (
          <div className="py-1">
            {events.map((event, i) => (
              <EventRow key={event.id || i} event={event} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ChronosEvent }) {
  const Icon = EVENT_ICONS[event.type] || FileText;
  const color = EVENT_COLORS[event.type] || 'text-muted-foreground';
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const description = formatEventDescription(event);

  return (
    <div className="flex items-start gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors">
      <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums shrink-0 w-10">
        {time}
      </span>
      <Icon size={13} className={cn('shrink-0 mt-0.5', color)} />
      <span className="text-xs text-foreground leading-relaxed">{description}</span>
    </div>
  );
}

function formatEventDescription(event: ChronosEvent): string {
  const data = event.data || {};
  switch (event.type) {
    case 'file_saved':
      return `File saved: ${data.path || 'unknown'}`;
    case 'file_created':
      return `File created: ${data.path || 'unknown'}`;
    case 'file_deleted':
      return `File deleted: ${data.path || 'unknown'}`;
    case 'git_commit':
      return `Git commit: "${data.message || 'no message'}"`;
    case 'test_run':
      return `Tests ${data.passed ? 'passed' : 'failed'} (${data.count || 0})`;
    case 'terminal_command':
      return `$ ${data.command || '...'}`;
    case 'extension_installed':
      return `Extension installed: ${data.name || 'unknown'}`;
    default:
      return event.type;
  }
}
