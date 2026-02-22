"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { setAccessToken, setRefreshToken } from "@/lib/auth-storage";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
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

      // Full page reload so AuthProvider re-initializes with the new token
      window.location.href = "/";
    } else {
      // No tokens — redirect to login with error
      window.location.href = "/login";
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">Signing you in...</p>
    </div>
  );
}
