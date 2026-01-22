import {
  FileCode,
  Package,
  FolderGit2,
  Files,
  Clock,
  HardDrive,
  Bot,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ContextItem, AISummary } from '../../../../types/contextInspector';

interface SummaryPanelProps {
  contextItem: ContextItem;
  summary: AISummary | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getContextIcon(type: string) {
  switch (type) {
    case 'package':
      return Package;
    case 'repo':
      return FolderGit2;
    default:
      return Files;
  }
}

export function SummaryPanel({
  contextItem,
  summary,
  isLoading,
  onRegenerate,
}: SummaryPanelProps) {
  const ContextIcon = getContextIcon(contextItem.type);

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h4 className="text-sm font-medium text-white uppercase tracking-wider">
          Context Summary
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Context name with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <ContextIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h5 className="text-white font-semibold">{contextItem.name}</h5>
            <p className="text-xs text-gray-400 capitalize">{contextItem.type}</p>
          </div>
        </div>

        {/* Metadata cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FileCode className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Type</span>
            </div>
            <p className="text-white font-semibold text-sm capitalize">
              {contextItem.type}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Size</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {formatBytes(contextItem.size)}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Files className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Files</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {contextItem.fileCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Updated</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {formatRelativeTime(contextItem.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-4" />

        {/* AI Summary Section */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-700 rounded" />
              <div className="h-4 bg-gray-700 rounded w-32" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-5/6" />
              <div className="h-3 bg-gray-700 rounded w-4/6" />
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-gray-700 rounded w-24" />
              <div className="h-3 bg-gray-700 rounded w-48" />
              <div className="h-3 bg-gray-700 rounded w-44" />
              <div className="h-3 bg-gray-700 rounded w-40" />
            </div>
          </div>
        ) : summary ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">
                AI-Generated Summary
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {summary.description}
            </p>

            {summary.keyComponents.length > 0 && (
              <>
                <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Key Components
                </h6>
                <ul className="space-y-1.5">
                  {summary.keyComponents.map((component, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{component}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">No summary available</p>
          </div>
        )}
      </div>

      {/* Regenerate button */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2',
            'bg-white/5 border border-white/10 rounded-lg',
            'text-sm text-gray-300 font-medium',
            'hover:bg-white/10 hover:text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate Summary
        </button>
      </div>
    </div>
  );
}
