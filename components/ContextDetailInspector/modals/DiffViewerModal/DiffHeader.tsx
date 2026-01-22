// DiffHeader Component - Header for diff viewer modal
import { X, ChevronDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { DiffViewMode } from '../../../../types/contextInspector';

interface DiffHeaderProps {
  fromVersion: number;
  toVersion: number;
  viewMode: DiffViewMode;
  onViewModeChange: (mode: DiffViewMode) => void;
  currentFile: string;
  files: string[];
  onFileChange: (file: string) => void;
  onClose: () => void;
}

export function DiffHeader({
  fromVersion,
  toVersion,
  viewMode,
  onViewModeChange,
  currentFile,
  files,
  onFileChange,
  onClose,
}: DiffHeaderProps) {
  return (
    <div className="flex flex-col border-b border-slate-800">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">
          DIFF: Ingestion #{toVersion} → #{fromVersion}
        </h2>
        <button
          onClick={onClose}
          className={cn(
            'p-1.5 rounded-md',
            'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-150'
          )}
          aria-label="Close diff viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/30">
        {/* View Mode Toggle */}
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as DiffViewMode)}
            className={cn(
              'appearance-none bg-white/5 border border-white/10 rounded-md',
              'pl-3 pr-8 py-1.5 text-sm text-white',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'cursor-pointer hover:bg-white/10 transition-colors'
            )}
          >
            <option value="unified" className="bg-slate-900">Unified</option>
            <option value="split" className="bg-slate-900">Split</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* File Selector */}
        <div className="relative flex-1 max-w-md">
          <select
            value={currentFile}
            onChange={(e) => onFileChange(e.target.value)}
            className={cn(
              'w-full appearance-none bg-white/5 border border-white/10 rounded-md',
              'pl-3 pr-8 py-1.5 text-sm text-white font-mono',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'cursor-pointer hover:bg-white/10 transition-colors',
              'truncate'
            )}
          >
            {files.map((file, index) => (
              <option key={file} value={file} className="bg-slate-900 font-mono">
                {index + 1}. {file}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
