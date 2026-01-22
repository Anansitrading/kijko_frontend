import { X, FileCode, GitBranch, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ModalHeaderProps, ContextItemType } from '../../types/contextInspector';

interface ExtendedModalHeaderProps extends ModalHeaderProps {
  contextType?: ContextItemType;
}

const TYPE_ICONS: Record<ContextItemType, typeof FileCode> = {
  files: FileCode,
  repo: GitBranch,
  package: Package,
};

export function ModalHeader({ contextName, contextType = 'files', onClose }: ExtendedModalHeaderProps) {
  const Icon = TYPE_ICONS[contextType];

  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-white/10 shrink-0">
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-white truncate max-w-[600px]">
          {contextName}
        </h2>
      </div>

      {/* Right side: Close button */}
      <button
        onClick={onClose}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'text-gray-400 hover:text-white hover:bg-white/10',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        )}
        title="Close (ESC)"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
