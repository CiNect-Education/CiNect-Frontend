"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { GlobalLoadingProvider } from "@/components/shared/global-loading";
import { RateLimitBanner } from "@/components/shared/rate-limit-banner";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          <GlobalLoadingProvider>
            <RateLimitBanner />
            {children}
            <Toaster richColors position="top-right" />
          </GlobalLoadingProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
