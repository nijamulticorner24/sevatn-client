'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a fallback that gracefully logs if used outside provider
    return {
      showToast: (t: any) => console.log('Toast:', t),
      success: (msg: string) => console.log('Success:', msg),
      error: (msg: string) => console.error('Error:', msg),
      warning: (msg: string) => console.warn('Warning:', msg),
      info: (msg: string) => console.info('Info:', msg),
    };
  }
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = String(Date.now() + Math.random());
      const newToast: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', title, message }),
    [showToast],
  );
  const error = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'error', title: title || 'Error', message, duration: 6000 }),
    [showToast],
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', title, message }),
    [showToast],
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', title, message }),
    [showToast],
  );

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-[#198754] shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-[#C2413B] shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-[#B7791F] shrink-0" />,
    info: <Info className="h-5 w-5 text-[#1D4ED8] shrink-0" />,
  };

  const borders = {
    success: 'border-[#C3E6CB] bg-[#FFFFFF] shadow-elevated',
    error: 'border-[#F5C6CB] bg-[#FFFFFF] shadow-elevated',
    warning: 'border-[#FCE0A6] bg-[#FFFFFF] shadow-elevated',
    info: 'border-[#BEE5EB] bg-[#FFFFFF] shadow-elevated',
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Portal Container */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[420px] w-full px-4 sm:px-0 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-[9px] border text-[#172033] transition-all animate-in slide-in-from-bottom-2 fade-in duration-200',
              borders[toast.type],
            )}
            role="status"
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <p className="text-[13px] font-bold text-[#172033] leading-tight mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="text-[12.5px] text-[#475467] leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[#98A2B3] hover:text-[#172033] p-1 rounded hover:bg-[#F2F4F7] transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
