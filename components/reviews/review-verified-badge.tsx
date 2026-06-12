"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewVerifiedBadgeProps = {
  className?: string;
};

export function ReviewVerifiedBadge({ className }: ReviewVerifiedBadgeProps) {
  const t = useTranslations("community");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#d82d8f]",
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("purchasedViaCiNect")}
    </span>
  );
}
