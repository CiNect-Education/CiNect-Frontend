"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { GlobalLoadingProvider } from "@/components/shared/global-loading";
import { RateLimitBanner } from "@/components/shared/rate-limit-banner";
import { DeferredDailyCheckin } from "@/components/shared/deferred-daily-checkin";
import { Toaster } from "@/components/ui/sonner";
import { normalizeLocalizedPath } from "@/lib/locale-path";

const LAST_NON_AUTH_ROUTE_KEY = "cinect-last-non-auth-route";

function RouteReturnToTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const isAuthRoute = /^\/(vi|en)\/(login|register|forgot-password|reset-password|callback)/.test(
      pathname
    );

    if (isAuthRoute) return;

    const query = searchParams.toString();
    const currentPath = normalizeLocalizedPath(`${pathname}${query ? `?${query}` : ""}`);

    try {
      sessionStorage.setItem(LAST_NON_AUTH_ROUTE_KEY, currentPath);
    } catch {
      // Ignore storage failures and keep the in-memory navigation flow working.
    }
  }, [pathname, searchParams]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>
          <GlobalLoadingProvider>
            <RouteReturnToTracker />
            <RateLimitBanner />
            <DeferredDailyCheckin />
            {children}
            <Toaster richColors position="top-right" />
          </GlobalLoadingProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
