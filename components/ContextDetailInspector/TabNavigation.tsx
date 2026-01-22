import { cn } from '../../utils/cn';
import type { TabNavigationProps, TabType } from '../../types/contextInspector';
import { tabConfig } from '../../styles/contextInspector';

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex items-center gap-1 px-6 h-12 border-b border-white/10 shrink-0">
      {tabConfig.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as TabType)}
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
          {/* Active indicator */}
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
  );
}
