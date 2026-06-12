"use client";

import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncProvinces } from "@/hooks/queries/use-admin";
import { MapPin, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const syncProvinces = useSyncProvinces();

  return (
    <AdminPageShell title={t("settings")} description={t("descSettings")}>
      <Card className="cinect-admin-panel max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            {t("provincesSyncTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t("provincesSyncDesc")}</p>
          <Button
            onClick={() => syncProvinces.mutate(undefined)}
            disabled={syncProvinces.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncProvinces.isPending ? "animate-spin" : ""}`} />
            {syncProvinces.isPending ? t("provincesSyncing") : t("provincesSyncRun")}
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
