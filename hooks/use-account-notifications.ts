"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/queries/use-notifications";
import type { NotificationType } from "@/types/domain";

export type UiNotification = {
  id: string;
  type: "booking" | "promo" | "membership" | "community" | "review" | "watchlist" | "refund";
  title: string;
  message: string;
  createdAt: string;
  href?: string;
  isRead: boolean;
};

function mapNotificationType(type: NotificationType): UiNotification["type"] {
  switch (type) {
    case "BOOKING":
      return "booking";
    case "PROMOTION":
      return "promo";
    case "MEMBERSHIP":
      return "membership";
    case "COMMUNITY":
      return "community";
    case "REVIEW":
      return "review";
    case "WATCHLIST":
      return "watchlist";
    case "REFUND":
      return "refund";
    default:
      return "membership";
  }
}

type UseAccountNotificationsOptions = {
  limit?: number;
};

export function useAccountNotifications(options?: UseAccountNotificationsOptions) {
  const limit = options?.limit ?? 12;
  const { data, isLoading, error, refetch } = useNotifications({ limit, page: 1 });
  const markAll = useMarkAllNotificationsRead();

  const notifications = useMemo<UiNotification[]>(() => {
    const items = data?.data ?? [];
    return items.map((n) => ({
      id: n.id,
      type: mapNotificationType(n.type),
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      href: n.link || undefined,
      isRead: n.isRead,
    }));
  }, [data]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const markAllRead = useCallback(() => {
    markAll.mutate();
  }, [markAll]);

  const isUnread = useCallback((notification: UiNotification) => !notification.isRead, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAllRead,
    isMarkingAllRead: markAll.isPending,
    isUnread,
  };
}
