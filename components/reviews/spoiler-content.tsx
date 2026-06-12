"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpoilerContentProps = {
  hasSpoiler?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function SpoilerContent({ hasSpoiler, children, className }: SpoilerContentProps) {
  const t = useTranslations("community");
  const [revealed, setRevealed] = useState(!hasSpoiler);

  if (!hasSpoiler || revealed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
        <Button type="button" size="sm" variant="secondary" onClick={() => setRevealed(true)}>
          {t("revealSpoiler")}
        </Button>
      </div>
    </div>
  );
}
