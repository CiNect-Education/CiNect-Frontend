"use client";

import { useTranslations } from "next-intl";
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode";

export function MaintenanceBanner() {
  const t = useTranslations("common");
  const { data } = useMaintenanceMode();
  const payload = (
    data as { data?: { maintenance?: boolean; message?: string; estimatedEnd?: string } }
  )?.data;
  const maintenance = payload?.maintenance ?? false;
  const message = payload?.message;
  const estimatedEnd = payload?.estimatedEnd;

  if (!maintenance) return null;

  return (
    <div className="cinect-glass w-full border-b px-4 py-2 text-center text-sm font-medium">
      {message ?? t("maintenanceDefault")}
      {estimatedEnd && (
        <span className="ml-2 opacity-90">{t("estimatedEnd", { time: estimatedEnd })}</span>
      )}
    </div>
  );
}
