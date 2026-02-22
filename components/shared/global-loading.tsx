"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface GlobalLoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  showLoading: () => {},
  hideLoading: () => {},
});

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext);
}

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
    setMessage(undefined);
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {loading && (
        <div className="bg-background/80 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            {message && <p className="text-muted-foreground text-sm">{message}</p>}
          </div>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  );
}
