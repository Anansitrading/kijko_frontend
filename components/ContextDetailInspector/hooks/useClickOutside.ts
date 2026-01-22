import { useEffect, useCallback, RefObject } from 'react';

interface UseClickOutsideOptions {
  ref: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClickOutside: () => void;
}

/**
 * Custom hook for detecting clicks outside a referenced element
 * Used to close modal when clicking on the backdrop
 */
export function useClickOutside({
  ref,
  isOpen,
  onClickOutside,
}: UseClickOutsideOptions) {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isOpen) return;

      // Check if click target is outside the referenced element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    },
    [isOpen, ref, onClickOutside]
  );

  useEffect(() => {
    // Use mousedown for better UX (immediate response)
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [handleClick]);
}
