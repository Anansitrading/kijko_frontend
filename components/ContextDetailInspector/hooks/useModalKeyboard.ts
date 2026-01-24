import { useEffect, useCallback } from 'react';
import type { TabType } from '../../../types/contextInspector';

interface UseModalKeyboardOptions {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: TabType) => void;
}

const TAB_MAP: Record<number, TabType> = {
  1: 'overview',
  2: 'compression',
  3: 'enrichments',
  4: 'changelog',
};

/**
 * Custom hook for handling modal keyboard shortcuts
 * - ESC: Close modal
 * - Cmd/Ctrl + 1-5: Switch tabs
 */
export function useModalKeyboard({
  isOpen,
  onClose,
  onTabChange,
}: UseModalKeyboardOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC to close
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Cmd/Ctrl + 1-4 for tab switching
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta) {
        const num = parseInt(event.key, 10);
        if (num >= 1 && num <= 4) {
          event.preventDefault();
          const tab = TAB_MAP[num];
          if (tab) {
            onTabChange(tab);
          }
        }
      }
    },
    [isOpen, onClose, onTabChange]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
