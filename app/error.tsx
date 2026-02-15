"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  const requestId = (error as { requestId?: string }).requestId;
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[Global error boundary]", error?.name, error?.message, {
      digest: (error as { digest?: string }).digest,
      requestId,
    });
  }, [error, requestId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        We encountered an issue. Please try again.
      </p>
      <div className="flex flex-col gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <a
          href="/support"
          className="text-sm text-primary hover:underline"
        >
          Report this issue
        </a>
      </div>
      {isDev && requestId && (
        <p className="mt-6 text-xs text-muted-foreground font-mono">
          Request ID: {requestId}
        </p>
      )}
    </div>
  );
}
