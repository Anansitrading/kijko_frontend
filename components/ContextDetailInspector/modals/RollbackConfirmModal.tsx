// RollbackConfirmModal - Confirmation dialog for version rollback
import { useRef, useEffect } from 'react';
import { X, AlertTriangle, Loader2, RotateCcw, Archive, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useRollback } from '../hooks/useRollback';

interface RollbackConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contextId: string;
  targetVersion: number;
  currentVersion: number;
}

export function RollbackConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  contextId,
  targetVersion,
  currentVersion,
}: RollbackConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { preview, isLoading, error, rollback, isRollingBack } = useRollback(contextId, targetVersion);

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRollingBack) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRollingBack, onClose]);

  const handleConfirm = async () => {
    try {
      await rollback();
      onSuccess();
      onClose();
    } catch {
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rollback-modal-title"
        className={cn(
          'w-full max-w-md',
          'bg-slate-900 border border-slate-700 rounded-xl shadow-2xl',
          'overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id="rollback-modal-title" className="text-lg font-semibold text-white">
            Confirm Rollback
          </h2>
          <button
            onClick={onClose}
            disabled={isRollingBack}
            className={cn(
              'p-1 rounded-md transition-colors',
              isRollingBack
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading rollback preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Warning Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-white">
                  Are you sure you want to rollback to{' '}
                  <span className="font-semibold">Ingestion #{targetVersion}</span>?
                </p>
              </div>

              {/* Changes Summary */}
              {preview && (
                <div className="space-y-2 mb-4 bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-3">This will:</p>

                  <div className="flex items-center gap-3 text-sm">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">
                      Restore <span className="text-white font-medium">{preview.filesToRestore.toLocaleString()}</span> files to their previous state
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">
                      Remove <span className="text-white font-medium">{preview.filesToRemove.toLocaleString()}</span> recently added files
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-300">
                      Re-add <span className="text-white font-medium">{preview.filesToReAdd.toLocaleString()}</span> previously deleted files
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm mt-3 pt-3 border-t border-slate-700">
                    <Archive className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      Create backup of current state (#{currentVersion})
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                This action can be undone by rolling forward to the backup version.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-800/30">
          <button
            onClick={onClose}
            disabled={isRollingBack}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isRollingBack
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || isRollingBack || !!error}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isLoading || isRollingBack || error
                ? 'bg-amber-600/50 text-amber-200/50 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            )}
          >
            {isRollingBack ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rolling back...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Confirm Rollback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RollbackConfirmModal;
