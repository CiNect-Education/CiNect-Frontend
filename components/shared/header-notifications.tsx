"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bell, ChevronRight, Crown, Tag, Ticket, Users, MessageSquare, Heart, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi as viDateLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";
import {
  useAccountNotifications,
  type UiNotification,
} from "@/hooks/use-account-notifications";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

function notificationIcon(type: UiNotification["type"]) {
  switch (type) {
    case "booking":
      return Ticket;
    case "promo":
      return Tag;
    case "community":
      return Users;
    case "review":
      return MessageSquare;
    case "watchlist":
      return Heart;
    case "refund":
      return RotateCcw;
    default:
      return Crown;
  }
}

function notificationIconClass(type: UiNotification["type"]) {
  switch (type) {
    case "booking":
      return "cinect-header-notif-icon--booking";
    case "promo":
      return "cinect-header-notif-icon--promo";
    case "community":
    case "review":
    case "watchlist":
    case "refund":
      return "cinect-header-notif-icon--promo";
    default:
      return "cinect-header-notif-icon--membership";
  }
}

export function HeaderNotifications({ className }: Props) {
  const tNav = useTranslations("nav");
  const tAccount = useTranslations("account");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, isLoading, isUnread } = useAccountNotifications();

  if (!isAuthenticated) return null;

  const preview = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full text-foreground hover:bg-muted/60 hover:text-accent dark:text-white dark:hover:bg-white/10 dark:hover:text-[#f3ea28]",
            className
          )}
          aria-label={tNav("notifications")}
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f3ea28] px-1 text-[10px] font-bold text-[#1e1b4b]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="cinect-header-notif-panel w-[min(100vw-1.5rem,22.5rem)] border p-0 shadow-none"
      >
        <div className="cinect-header-notif-header">
          <h3 className="cinect-header-notif-title">{tNav("notifications")}</h3>
          {unreadCount > 0 ? (
            <span className="cinect-header-notif-count">
              {tAccount("headerNotifUnread", { count: unreadCount })}
            </span>
          ) : null}
        </div>

        <div className="max-h-[min(60vh,22rem)] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-0 px-3 py-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="mb-2 h-[4.5rem] w-full rounded-md bg-white/10" />
              ))}
            </div>
          ) : preview.length === 0 ? (
            <p className="cinect-header-notif-empty">{tAccount("notificationsEmptyTitle")}</p>
          ) : (
            <ul className="cinect-header-notif-list">
              {preview.map((item) => {
                const Icon = notificationIcon(item.type);
                const unread = isUnread(item);

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href ?? "/account/notifications"}
                      className={cn("cinect-header-notif-item", unread && "is-unread")}
                    >
                      <div
                        className={cn(
                          "cinect-header-notif-icon",
                          notificationIconClass(item.type)
                        )}
                      >
                        <Icon aria-hidden />
                        {unread ? <span className="cinect-header-notif-dot" aria-hidden /> : null}
                      </div>

                      <div className="cinect-header-notif-body">
                        <div className="cinect-header-notif-row">
                          <p className="cinect-header-notif-item-title">{item.title}</p>
                          <time
                            className="cinect-header-notif-time"
                            dateTime={item.createdAt}
                          >
                            {formatDistanceToNow(new Date(item.createdAt), {
                              addSuffix: true,
                              locale: dateFnsLocale,
                            })}
                          </time>
                        </div>
                        <p className="cinect-header-notif-message">{item.message}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="cinect-header-notif-footer">
          <Link href="/account/notifications" className="cinect-header-notif-view-all">
            {tCommon("viewAll")}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
