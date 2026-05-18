"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { setAccessToken, setRefreshToken } from "@/lib/auth-storage";
import { Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-discovery";
import { normalizeLocalizedPath, toLocalizedHref } from "@/lib/locale-path";
import type { UserRole } from "@/types/domain";

function resolvePostLoginPath(role: UserRole | undefined, returnTo: string): string {
  const isAdmin = role === "ADMIN" || role === "STAFF";
  if (!isAdmin) return returnTo;
  return returnTo.startsWith("/admin") ? returnTo : "/admin";
}

export default function OAuthCallbackPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const returnTo = normalizeLocalizedPath(searchParams.get("returnTo"));

    if (token && refreshToken) {
      setAccessToken(token);
      setRefreshToken(refreshToken);

      // Resolve target by role so admin/staff go directly to /admin.
      fetch(`${getApiBaseUrl()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) return undefined;
          const body = (await res.json()) as { data?: { role?: UserRole } };
          return body?.data?.role;
        })
        .then((role) => {
          window.location.href = toLocalizedHref(locale, resolvePostLoginPath(role, returnTo));
        })
        .catch(() => {
          window.location.href = toLocalizedHref(locale, resolvePostLoginPath(undefined, returnTo));
        });
    } else {
      // No tokens — redirect to login with error
      window.location.href = toLocalizedHref(locale, "/login");
    }
  }, [locale, searchParams]);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">{t("signingIn")}</p>
    </div>
  );
}
