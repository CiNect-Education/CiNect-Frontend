"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function CommunityHeader() {
  const t = useTranslations("community");
  const tNav = useTranslations("nav");
  const { isAuthenticated } = useAuth();

  return (
    <header className="community-header mb-8 border-b border-border/40 pb-6">
      <PageHeader
        title={t("title")}
        actions={
          isAuthenticated ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/account/orders">{t("reviewYourMovies")}</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">{tNav("login")}</Link>
            </Button>
          )
        }
      />
    </header>
  );
}
