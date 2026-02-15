"use client";

import { AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApiError } from "@/lib/api-client";

interface ApiErrorStateProps {
  /** The error thrown by apiClient / TanStack Query. */
  error: Error | ApiError | null;
  /** Called when the user clicks the retry button. */
  onRetry?: () => void;
  /** Override the default title. */
  title?: string;
  /** Compact variant for inline usage. */
  compact?: boolean;
  /** Additional class names. */
  className?: string;
}

export function ApiErrorState({
  error,
  onRetry,
  title,
  compact = false,
  className = "",
}: ApiErrorStateProps) {
  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : undefined;
  const requestId = isApiError ? error.requestId : undefined;
  const details = isApiError ? error.details : undefined;
  const message = isApiError ? error.toastMessage : error.message;
  const isDev = process.env.NODE_ENV === "development";

  const resolvedTitle = title ?? getDefaultTitle(status);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive ${className}`}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-destructive hover:text-destructive"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-foreground">
        {resolvedTitle}
      </h3>

      <p className="mb-4 max-w-md text-sm text-muted-foreground">{message}</p>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mb-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}

      {/* Dev-only details panel */}
      {isDev && (status !== undefined || requestId || details !== undefined) && (
        <Collapsible className="mt-2 w-full max-w-lg">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
            >
              <ChevronDown className="mr-1 h-3 w-3" />
              Debug Details (dev only)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-md border bg-muted/50 p-3 text-left font-mono text-xs">
              {status !== undefined && (
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {status}
                </p>
              )}
              {requestId && (
                <p>
                  <span className="text-muted-foreground">Request ID:</span>{" "}
                  {requestId}
                </p>
              )}
              {details != null && (
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-muted-foreground">
                  {typeof details === "string" ? details : JSON.stringify(details, null, 2)}
                </pre>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function getDefaultTitle(status?: number): string {
  if (!status) return "Something went wrong";
  switch (status) {
    case 401:
      return "Authentication Required";
    case 403:
      return "Access Denied";
    case 404:
      return "Not Found";
    case 422:
      return "Validation Error";
    case 429:
      return "Rate Limited";
    default:
      return status >= 500 ? "Server Error" : "Request Failed";
  }
}
