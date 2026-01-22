// SplitDiffView Component - Displays diff in side-by-side format
import { cn } from '../../../../utils/cn';
import { getFileStatusColor } from '../../../../utils/diffUtils';
import type { DiffFile, DiffLine } from '../../../../types/contextInspector';

interface SplitDiffViewProps {
  file: DiffFile;
}

interface SplitLine {
  left: DiffLine | null;
  right: DiffLine | null;
}

// Convert unified diff to split view lines
function toSplitLines(file: DiffFile): SplitLine[] {
  const result: SplitLine[] = [];

  for (const hunk of file.hunks) {
    const deletions: DiffLine[] = [];
    const additions: DiffLine[] = [];

    for (const line of hunk.lines) {
      if (line.type === 'deletion') {
        deletions.push(line);
      } else if (line.type === 'addition') {
        additions.push(line);
      } else {
        // Flush any pending deletions/additions
        while (deletions.length > 0 || additions.length > 0) {
          result.push({
            left: deletions.shift() || null,
            right: additions.shift() || null,
          });
        }
        // Add context line to both sides
        result.push({ left: line, right: line });
      }
    }

    // Flush remaining
    while (deletions.length > 0 || additions.length > 0) {
      result.push({
        left: deletions.shift() || null,
        right: additions.shift() || null,
      });
    }
  }

  return result;
}

function SplitLineCell({ line, side }: { line: DiffLine | null; side: 'left' | 'right' }) {
  if (!line) {
    return (
      <div className="flex font-mono text-xs leading-6 min-h-[24px] bg-slate-900/50">
        <span className="w-10 text-right pr-2 text-gray-700 select-none border-r border-white/5">
          &nbsp;
        </span>
        <span className="flex-1 pl-2 text-gray-700">&nbsp;</span>
      </div>
    );
  }

  const isOld = side === 'left';
  const lineNumber = isOld ? line.oldLineNumber : line.newLineNumber;
  const isDeletion = line.type === 'deletion';
  const isAddition = line.type === 'addition';

  const rowClasses = cn(
    'flex font-mono text-xs leading-6 min-h-[24px]',
    isDeletion && 'bg-red-500/10',
    isAddition && 'bg-emerald-500/10'
  );

  const lineNumClasses = cn(
    'w-10 text-right pr-2 select-none border-r border-white/5 tabular-nums',
    'text-gray-600'
  );

  const contentClasses = cn(
    'flex-1 pl-2 whitespace-pre overflow-x-auto',
    isDeletion && 'text-red-300',
    isAddition && 'text-emerald-300',
    !isDeletion && !isAddition && 'text-gray-300'
  );

  return (
    <div className={rowClasses}>
      <span className={lineNumClasses}>{lineNumber || ''}</span>
      <span className={contentClasses}>{line.content || ' '}</span>
    </div>
  );
}

export function SplitDiffView({ file }: SplitDiffViewProps) {
  const splitLines = toSplitLines(file);

  return (
    <div className="flex flex-col h-full">
      {/* File Header */}
      <div className={cn(
        'px-4 py-2 border-b border-white/10 bg-slate-800/50',
        'flex items-center justify-between'
      )}>
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm', getFileStatusColor(file.status))}>
            {file.status === 'added' ? '+' : file.status === 'removed' ? '-' : '~'}
          </span>
          <span className="font-mono text-sm text-white">{file.path}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {file.linesAdded > 0 && (
            <span className="text-emerald-400">+{file.linesAdded}</span>
          )}
          {file.linesRemoved > 0 && (
            <span className="text-red-400">-{file.linesRemoved}</span>
          )}
        </div>
      </div>

      {/* Split Headers */}
      <div className="flex border-b border-white/10 bg-slate-900">
        <div className="flex-1 px-3 py-1 text-xs text-gray-500 border-r border-white/10">
          Old (v{file.status === 'added' ? 'none' : 'prev'})
        </div>
        <div className="flex-1 px-3 py-1 text-xs text-gray-500">
          New (v{file.status === 'removed' ? 'none' : 'curr'})
        </div>
      </div>

      {/* Split Content */}
      <div className="flex-1 overflow-auto bg-slate-950">
        {splitLines.map((splitLine, index) => (
          <div key={index} className="flex">
            <div className="flex-1 border-r border-white/10">
              <SplitLineCell line={splitLine.left} side="left" />
            </div>
            <div className="flex-1">
              <SplitLineCell line={splitLine.right} side="right" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
