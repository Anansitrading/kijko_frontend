// Enhanced Keyboard Shortcuts Hook
// Extends useModalKeyboard with additional shortcuts for Sprint 8

import { useEffect, useCallback } from 'react';

export interface KeyboardHandlers {
  onSearch?: () => void;
  onClose?: () => void;
  onEscape?: () => void;
  onTabSwitch?: (tabIndex: number) => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardHandlers,
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (e.key === 'Escape') {
          e.preventDefault();
          handlers.onEscape?.();
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K for search
      if (isMod && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Cmd/Ctrl + W to close
      if (isMod && e.key === 'w') {
        e.preventDefault();
        handlers.onClose?.();
        return;
      }

      // Cmd/Ctrl + 1-5 for tabs
      if (isMod && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        handlers.onTabSwitch?.(parseInt(e.key, 10) - 1);
        return;
      }

      // ESC to close/dismiss
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onEscape?.();
      }
    },
    [enabled, handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
