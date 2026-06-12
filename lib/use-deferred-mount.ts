"use client";

import { useEffect, useState } from "react";

/**
 * Defers non-critical UI/data until after first paint (idle or short timeout).
 */
export function useDeferredMount(timeoutMs = 1500) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: timeoutMs });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  return ready;
}
