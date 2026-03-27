"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const onExpireRef = useRef(onExpire);
  const expiredOnceRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredOnceRef.current = false;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      if (!Number.isFinite(expiry)) return 0;
      const diff = expiry - now;
      return Math.max(0, Math.floor(diff / 1000));
    };

    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (initial === 0) {
      // Avoid tight loops if expiresAt is invalid/expired.
      if (!expiredOnceRef.current) {
        expiredOnceRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(interval);
        if (!expiredOnceRef.current) {
          expiredOnceRef.current = true;
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        isWarning ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border"
      )}
    >
      <Clock className="h-4 w-4" />
      <span>
        Time left: {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
