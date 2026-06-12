import { useApiQuery } from "@/hooks/use-api-query";

export function useMaintenanceMode(enabled = true) {
  return useApiQuery<{ maintenance: boolean; message?: string; estimatedEnd?: string }>(
    ["maintenance"],
    "/status",
    undefined,
    { enabled, retry: false, staleTime: 5 * 60 * 1000 },
  );
}
