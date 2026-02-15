import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { notificationSchema } from "@/lib/schemas/common";
import type { Notification } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useNotifications(params?: QueryParams) {
  return useApiQuery<Notification[]>(
    ["notifications", JSON.stringify(params)],
    "/notifications",
    params,
    { schema: z.array(notificationSchema) }
  );
}

export function useMarkNotificationRead() {
  return useApiMutation<void, { id: string }>(
    "patch",
    (vars) => `/notifications/${vars.id}/read`,
    { invalidateKeys: [["notifications"]] }
  );
}

export function useMarkAllNotificationsRead() {
  return useApiMutation<void>("patch", "/notifications/read-all", {
    successMessage: "All notifications marked as read",
    invalidateKeys: [["notifications"]],
  });
}
