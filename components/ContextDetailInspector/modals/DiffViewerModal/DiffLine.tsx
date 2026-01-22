// DiffLine Component - Renders a single line in the diff view
import { cn } from '../../../../utils/cn';
import type { DiffLine as DiffLineType } from '../../../../types/contextInspector';

interface DiffLineProps {
  line: DiffLineType;
  showLineNumbers?: boolean;
}

export function DiffLine({ line, showLineNumbers = true }: DiffLineProps) {
  const { type, content, oldLineNumber, newLineNumber } = line;

  const lineClasses = cn(
    'flex font-mono text-xs leading-6 min-h-[24px]',
    type === 'addition' && 'bg-emerald-500/10',
    type === 'deletion' && 'bg-red-500/10',
    type === 'context' && 'bg-transparent'
  );

  const prefixClasses = cn(
    'w-5 flex-shrink-0 text-center select-none',
    type === 'addition' && 'text-emerald-400',
    type === 'deletion' && 'text-red-400',
    type === 'context' && 'text-gray-600'
  );

  const lineNumberClasses = cn(
    'w-12 flex-shrink-0 text-right pr-3 select-none tabular-nums',
    'text-gray-600 border-r border-white/5'
  );

  const contentClasses = cn(
    'flex-1 pl-3 whitespace-pre overflow-x-auto',
    type === 'addition' && 'text-emerald-300',
    type === 'deletion' && 'text-red-300',
    type === 'context' && 'text-gray-300'
  );

  const prefix = type === 'addition' ? '+' : type === 'deletion' ? '-' : ' ';

  return (
    <div className={lineClasses}>
      {showLineNumbers && (
        <>
          <span className={lineNumberClasses}>
            {oldLineNumber || ''}
          </span>
          <span className={lineNumberClasses}>
            {newLineNumber || ''}
          </span>
        </>
      )}
      <span className={prefixClasses}>{prefix}</span>
      <span className={contentClasses}>{content || ' '}</span>
    </div>
  );
}
