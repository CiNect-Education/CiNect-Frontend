"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export function RateLimitBanner() {
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    function handleRateLimit(event: CustomEvent<{ retryAfter?: number }>) {
      const seconds = event.detail?.retryAfter || 30;
      setRetryAfter(seconds);
      setCountdown(seconds);
    }

    window.addEventListener("api:429" as any, handleRateLimit);
    return () => window.removeEventListener("api:429" as any, handleRateLimit);
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
    <div className="fixed top-0 right-0 left-0 z-[90] flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-950">
      <AlertTriangle className="h-4 w-4" />
      <span>Too many requests. Please wait {countdown > 0 ? `${countdown}s` : "..."}</span>
    </div>
  );
}
