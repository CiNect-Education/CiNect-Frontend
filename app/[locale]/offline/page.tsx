"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const t = useTranslations("offline");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <WifiOff className="text-muted-foreground mb-4 h-16 w-16" />
      <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mb-4">{t("description")}</p>
      <Button onClick={() => window.location.reload()}>{t("tryAgain")}</Button>
    </div>
  );
}
