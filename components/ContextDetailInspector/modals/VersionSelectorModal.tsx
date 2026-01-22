// VersionSelectorModal - Select two versions to compare
import { useState, useRef, useEffect } from 'react';
import { X, GitCompare, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { VersionInfo } from '../../../types/contextInspector';

interface VersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (fromVersion: number, toVersion: number) => void;
  versions: VersionInfo[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionSelectorModal({
  isOpen,
  onClose,
  onCompare,
  versions,
}: VersionSelectorModalProps) {
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setFromVersion(null);
      setToVersion(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleVersionClick = (version: number) => {
    if (fromVersion === null) {
      setFromVersion(version);
    } else if (toVersion === null && version !== fromVersion) {
      setToVersion(version);
    } else {
      // Reset and start over
      setFromVersion(version);
      setToVersion(null);
    }
  };

  const handleCompare = () => {
    if (fromVersion !== null && toVersion !== null) {
      // Ensure fromVersion > toVersion (newer to older)
      const [newer, older] = fromVersion > toVersion
        ? [fromVersion, toVersion]
        : [toVersion, fromVersion];
      onCompare(older, newer);
      onClose();
    }
  };

  const canCompare = fromVersion !== null && toVersion !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-selector-title"
        className={cn(
          'w-full max-w-lg',
          'bg-slate-900 border border-slate-700 rounded-xl shadow-2xl',
          'overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-blue-400" />
            </div>
            <h2 id="version-selector-title" className="text-lg font-semibold text-white">
              Compare Versions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-800">
          <p className="text-sm text-gray-400">
            Select two versions to compare.{' '}
            {fromVersion !== null && toVersion === null && (
              <span className="text-blue-400">Now select the second version.</span>
            )}
            {canCompare && (
              <span className="text-emerald-400">Ready to compare!</span>
            )}
          </p>
        </div>

        {/* Version List */}
        <div className="max-h-[400px] overflow-y-auto">
          {versions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No versions available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {versions.map((version) => {
                const isSelected = version.number === fromVersion || version.number === toVersion;
                const isFrom = version.number === fromVersion;
                const isTo = version.number === toVersion;

                return (
                  <button
                    key={version.number}
                    onClick={() => handleVersionClick(version.number)}
                    className={cn(
                      'w-full px-6 py-3 flex items-center justify-between',
                      'text-left transition-colors',
                      isSelected
                        ? 'bg-blue-500/10'
                        : 'hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Selection Indicator */}
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-600'
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      {/* Version Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            Ingestion #{version.number}
                          </span>
                          {isFrom && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              From
                            </span>
                          )}
                          {isTo && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              To
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(version.timestamp)} • by {version.author}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-gray-500">
                      {version.filesChanged} files changed
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              canCompare
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500/30 text-blue-200/50 cursor-not-allowed'
            )}
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Versions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VersionSelectorModal;
