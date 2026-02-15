"use client";

import { useCallback, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  /** Callback when pull-to-refresh is triggered */
  onRefresh: () => void | Promise<void>;
  /** Threshold in pixels before refresh triggers */
  threshold?: number;
  /** Max pull distance in pixels */
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing || window.scrollY > 0) return;
      const y = e.touches[0].clientY;
      const diff = y - startY.current;
      if (diff > 0) {
        const damped = Math.min(diff * 0.5, maxPull);
        setPullDistance(damped);
      }
    },
    [isRefreshing, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    progress: Math.min(pullDistance / threshold, 1),
  };
}
