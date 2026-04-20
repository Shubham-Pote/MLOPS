import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ── Toast Types ────────────────────────────────────────────────────────────

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ── Context Shape ──────────────────────────────────────────────────────────

interface AppContextValue {
  // Toast notifications
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: number) => void;

  // Global loading
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (m: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let _toastId = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
