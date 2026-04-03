"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export function RateLimitBanner() {
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    type ApiRateLimitEvent = CustomEvent<{ retryAfter?: number }>;
    const handleRateLimit = (event: Event) => {
      const seconds = (event as ApiRateLimitEvent).detail?.retryAfter || 30;
      setRetryAfter(seconds);
      setCountdown(seconds);
    };

    window.addEventListener("api:429", handleRateLimit);
    return () => window.removeEventListener("api:429", handleRateLimit);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (retryAfter !== null) setRetryAfter(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, retryAfter]);

  if (retryAfter === null) return null;

  return (
    <div className="cinect-glass fixed top-0 right-0 left-0 z-[90] flex items-center justify-center gap-2 border-b px-4 py-2 text-center text-sm font-medium">
      <AlertTriangle className="text-primary h-4 w-4" />
      <span>Too many requests. Please wait {countdown > 0 ? `${countdown}s` : "..."}</span>
    </div>
  );
}
