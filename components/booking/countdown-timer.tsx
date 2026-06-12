"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
  variant?: "default" | "banner";
}

export function CountdownTimer({ expiresAt, onExpire, variant = "default" }: CountdownTimerProps) {
  const t = useTranslations("booking");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const onExpireRef = useRef(onExpire);
  const expiredOnceRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredOnceRef.current = false;

    const calculateTimeLeft = (): number | null => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      if (!Number.isFinite(expiry)) return null;
      const diff = expiry - now;
      return Math.max(0, Math.floor(diff / 1000));
    };

    const initial = calculateTimeLeft();
    setTimeLeft(initial ?? 0);
    if (initial === null) return;
    if (initial === 0) {
      if (!expiredOnceRef.current) {
        expiredOnceRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left ?? 0);
      if (left === null) return;
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
  const isWarning = timeLeft > 0 && timeLeft < 120;
  const isCritical = timeLeft > 0 && timeLeft < 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
          isCritical
            ? "border-destructive/50 bg-destructive/10 text-destructive"
            : isWarning
              ? "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100"
              : "border-border/30 bg-muted/20"
        )}
        role="timer"
        aria-live="polite"
        aria-label={`${t("timeLeftLabel")} ${display}`}
      >
        <Clock className="h-4 w-4" aria-hidden />
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {t("timeLeftLabel")}
        </span>
        <span>{display}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        isCritical ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border/30 bg-muted/15"
      )}
      role="timer"
      aria-live="polite"
      aria-label={`${t("timeLeftLabel")} ${display}`}
    >
      <Clock className="h-4 w-4" aria-hidden />
      <span>
        {t("timeLeftLabel")}: {display}
      </span>
    </div>
  );
}
