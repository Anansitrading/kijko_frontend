// UnifiedDiffView Component - Displays diff in unified format
import { cn } from '../../../../utils/cn';
import { DiffLine } from './DiffLine';
import { getFileStatusColor } from '../../../../utils/diffUtils';
import type { DiffFile } from '../../../../types/contextInspector';

interface UnifiedDiffViewProps {
  file: DiffFile;
}

export function UnifiedDiffView({ file }: UnifiedDiffViewProps) {
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

      {/* Diff Content */}
      <div className="flex-1 overflow-auto bg-slate-950">
        {file.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex}>
            {/* Hunk Header */}
            <div className="px-4 py-1 bg-blue-500/10 text-blue-400 text-xs font-mono">
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            {/* Hunk Lines */}
            {hunk.lines.map((line, lineIndex) => (
              <DiffLine key={`${hunkIndex}-${lineIndex}`} line={line} showLineNumbers />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
