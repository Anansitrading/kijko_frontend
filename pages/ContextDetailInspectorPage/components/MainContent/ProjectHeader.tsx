import { Share2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { tabConfig } from '../../../../styles/contextInspector';
import type { TabType } from '../../../../types/contextInspector';

interface ProjectHeaderProps {
  projectName: string;
  onNameChange?: (newName: string) => void;
  onShare?: () => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  className?: string;
  rightActions?: React.ReactNode;
}

export function ProjectHeader({
  onShare,
  activeTab = 'overview',
  onTabChange,
  className,
  rightActions,
}: ProjectHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 border-b border-[#1e293b] shrink-0 h-12',
        className
      )}
    >
      {/* Left side: Tab Navigation */}
      <div className="flex items-center gap-1 h-full">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id as TabType)}
            className={cn(
              'relative px-4 h-full text-sm font-medium transition-colors duration-150',
              'focus:outline-none',
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            )}
            title={`${tab.label} (⌘${tab.shortcut})`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500',
                  'animate-[fadeIn_150ms_ease-out]'
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Right side: Share button + Status indicator + User actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {onShare && (
          <button
            onClick={onShare}
            className={cn(
              'flex items-center gap-2 px-3 h-8 rounded-lg',
              'text-gray-300 hover:text-white',
              'bg-white/5 hover:bg-white/10 border border-white/10',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            )}
            title="Share project"
            aria-label="Share project"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {rightActions}
      </div>
    </header>
  );
}
