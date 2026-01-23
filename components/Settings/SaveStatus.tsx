import React from 'react';
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { SaveStatusProps } from '../../types/settings';
import { tw } from '../../styles/settings';

export function SaveStatus({ status, error, onRetry }: SaveStatusProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div
      className={`${tw.saveStatus} ${
        status === 'saving'
          ? tw.saveStatusSaving
          : status === 'saved'
          ? tw.saveStatusSaved
          : tw.saveStatusError
      }`}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="w-4 h-4" />
          <span>Saved</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>{error || 'Error saving'}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 flex items-center gap-1 text-red-400 hover:text-red-300 underline"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default SaveStatus;
