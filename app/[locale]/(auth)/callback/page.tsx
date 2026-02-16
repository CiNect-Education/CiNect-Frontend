"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { setAccessToken, setRefreshToken } from "@/lib/auth-storage";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token && refreshToken) {
      setAccessToken(token);
      setRefreshToken(refreshToken);

      // Small delay to ensure storage is set before navigation
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } else {
      // No tokens — redirect to login with error
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  );
}
