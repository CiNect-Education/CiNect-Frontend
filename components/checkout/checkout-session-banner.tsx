"use client";

import { useTranslations } from "next-intl";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { AlertTriangle } from "lucide-react";

interface CheckoutSessionBannerProps {
  expiresAt: string;
  onExpire: () => void;
}

export function CheckoutSessionBanner({ expiresAt, onExpire }: CheckoutSessionBannerProps) {
  const t = useTranslations("checkout");

  return (
    <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-amber-500/25 bg-amber-500/8 px-4 py-3 backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <p className="font-medium text-amber-950 dark:text-amber-50">{t("sessionBanner")}</p>
        </div>
        <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} variant="banner" />
      </div>
    </div>
  );
}
