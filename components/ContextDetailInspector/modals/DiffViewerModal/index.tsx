// DiffViewerModal - Main modal for viewing file differences between versions
import { useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useDiff } from '../../hooks/useDiff';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { downloadDiff } from '../../../../utils/diffUtils';
import { DiffHeader } from './DiffHeader';
import { DiffFooter } from './DiffFooter';
import { UnifiedDiffView } from './UnifiedDiffView';
import { SplitDiffView } from './SplitDiffView';

interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  fromVersion: number;
  toVersion: number;
}

export function DiffViewerModal({
  isOpen,
  onClose,
  contextId,
  fromVersion,
  toVersion,
}: DiffViewerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    diff,
    isLoading,
    error,
    currentFileIndex,
    setCurrentFileIndex,
    viewMode,
    setViewMode,
  } = useDiff(contextId, fromVersion, toVersion);

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen);

  const handlePrevious = useCallback(() => {
    setCurrentFileIndex(currentFileIndex - 1);
  }, [currentFileIndex, setCurrentFileIndex]);

  const handleNext = useCallback(() => {
    setCurrentFileIndex(currentFileIndex + 1);
  }, [currentFileIndex, setCurrentFileIndex]);

  const handleFileChange = useCallback((file: string) => {
    const index = diff?.files.findIndex(f => f.path === file) ?? -1;
    if (index >= 0) {
      setCurrentFileIndex(index);
    }
  }, [diff, setCurrentFileIndex]);

  const handleDownload = useCallback(() => {
    if (diff) {
      downloadDiff(diff);
    }
  }, [diff]);

  // Handle escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && currentFileIndex > 0) {
      handlePrevious();
    } else if (e.key === 'ArrowRight' && diff && currentFileIndex < diff.files.length - 1) {
      handleNext();
    }
  }, [onClose, currentFileIndex, diff, handlePrevious, handleNext]);

  if (!isOpen) return null;

  const currentFile = diff?.files[currentFileIndex];
  const files = diff?.files.map(f => f.path) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-modal-title"
        className={cn(
          'w-full max-w-6xl h-[85vh]',
          'bg-slate-900 border border-slate-700 rounded-xl shadow-2xl',
          'overflow-hidden flex flex-col',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <DiffHeader
          fromVersion={fromVersion}
          toVersion={toVersion}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentFile={currentFile?.path ?? ''}
          files={files}
          onFileChange={handleFileChange}
          onClose={onClose}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading diff...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : currentFile ? (
            viewMode === 'unified' ? (
              <UnifiedDiffView file={currentFile} />
            ) : (
              <SplitDiffView file={currentFile} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm text-gray-400">No files to display</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {diff && (
          <DiffFooter
            currentIndex={currentFileIndex}
            totalFiles={diff.files.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onDownload={handleDownload}
          />
        )}

        {/* Summary Bar */}
        {diff && (
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900 text-xs text-gray-500">
            <span className="text-emerald-400">+{diff.summary.totalAdditions}</span>
            {' / '}
            <span className="text-red-400">-{diff.summary.totalDeletions}</span>
            {' lines across '}
            {diff.summary.filesAdded > 0 && <span className="text-emerald-400">{diff.summary.filesAdded} added</span>}
            {diff.summary.filesAdded > 0 && diff.summary.filesModified > 0 && ', '}
            {diff.summary.filesModified > 0 && <span className="text-amber-400">{diff.summary.filesModified} modified</span>}
            {(diff.summary.filesAdded > 0 || diff.summary.filesModified > 0) && diff.summary.filesRemoved > 0 && ', '}
            {diff.summary.filesRemoved > 0 && <span className="text-red-400">{diff.summary.filesRemoved} removed</span>}
            {' files'}
          </div>
        )}
      </div>
    </div>
  );
}

export default DiffViewerModal;
