"use client";

import { useMaintenanceMode } from "@/hooks/use-maintenance-mode";

export function MaintenanceBanner() {
  const { data } = useMaintenanceMode();
  const payload = (
    data as { data?: { maintenance?: boolean; message?: string; estimatedEnd?: string } }
  )?.data;
  const maintenance = payload?.maintenance ?? false;
  const message = payload?.message;
  const estimatedEnd = payload?.estimatedEnd;

  if (!maintenance) return null;

  return (
    <div className="w-full bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      {message ?? "System is under maintenance."}
      {estimatedEnd && <span className="ml-2 opacity-90">Estimated end: {estimatedEnd}</span>}
    </div>
  );
}
