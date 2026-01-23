import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'warning' | 'info' | 'success';

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface UseToastReturn {
  toast: ToastState | null;
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 3500) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ visible: true, message, type });

    // Auto-dismiss after duration
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast, hideToast };
}
