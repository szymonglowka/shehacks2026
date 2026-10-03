import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string) => {
    const id = nextId;
    nextId += 1;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-6">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className="otula-toast rounded-[14px] bg-ink px-5 py-3 text-[13px] font-semibold text-cream shadow-modal"
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
