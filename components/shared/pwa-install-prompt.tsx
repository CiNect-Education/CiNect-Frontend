"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY);
    if (stored === "true") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
      localStorage.setItem(DISMISS_KEY, "true");
    }
  }

  function handleDismiss() {
    setDismissed(true);
    typeof window !== "undefined" && localStorage.setItem(DISMISS_KEY, "true");
  }

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between gap-4 shadow-md">
      <p className="text-sm flex-1 truncate">
        Install our app for a better experience
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-8"
          onClick={handleInstall}
        >
          Install App
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
