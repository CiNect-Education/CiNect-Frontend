import { useApiQuery } from "@/hooks/use-api-query";

export function useMaintenanceMode() {
  return useApiQuery<{ maintenance: boolean; message?: string; estimatedEnd?: string }>(
    ["maintenance"],
    "/status",
    undefined,
    { retry: false, staleTime: 60000 }
  );
}
