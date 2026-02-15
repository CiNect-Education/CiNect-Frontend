"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ShieldX, Home } from "lucide-react";

export default function ForbiddenPage() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <ShieldX className="h-20 w-20 text-destructive mb-6" />
      <h1 className="text-4xl font-bold mb-2">403</h1>
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">
        Access Denied
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        You do not have permission to access this page. Please contact an administrator if you believe this is an error.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
