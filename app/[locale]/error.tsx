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
  const requestId = error instanceof ApiError ? error.requestId : (error as { requestId?: string }).requestId;
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[Error boundary]", error?.name, error?.message, {
      digest: (error as { digest?: string }).digest,
      requestId,
    });
  }, [error, requestId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">{t("errorTitle")}</h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {t("errorDesc")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="default">
          {t("retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/support">Report this issue</Link>
        </Button>
      </div>
      {isDev && requestId && (
        <p className="mt-6 text-xs text-muted-foreground font-mono">
          Request ID: {requestId}
        </p>
      )}
    </div>
  );
}
