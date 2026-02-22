"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/api-client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  const requestId =
    error instanceof ApiError ? error.requestId : (error as { requestId?: string }).requestId;
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[Error boundary]", error?.name, error?.message, {
      digest: (error as { digest?: string }).digest,
      requestId,
    });
  }, [error, requestId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 mb-4 rounded-full p-4">
        <AlertTriangle className="text-destructive h-12 w-12" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">{t("errorTitle")}</h2>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">{t("errorDesc")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} variant="default">
          {t("retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/support">Report this issue</Link>
        </Button>
      </div>
      {isDev && requestId && (
        <p className="text-muted-foreground mt-6 font-mono text-xs">Request ID: {requestId}</p>
      )}
    </div>
  );
}
