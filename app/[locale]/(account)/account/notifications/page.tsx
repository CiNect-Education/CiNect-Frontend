"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useAccountNotifications } from "@/hooks/use-account-notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Bell, CheckCheck, Ticket, Tag, Crown, Users, MessageSquare, Heart, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function NotificationsPage() {
  const t = useTranslations("account");
  const { notifications, unreadCount, isLoading, error, refetch, markAllRead, isUnread, isMarkingAllRead } =
    useAccountNotifications({ limit: 50 });

  const handleMarkAllRead = () => {
    markAllRead();
    toast.success(t("markAllReadToast"));
  };

  return (
    <div>
      <PageHeader
        title={t("notifications")}
        description={t("notificationsDesc")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isMarkingAllRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {t("markAllRead")}
            {unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <Card className="cinect-account-panel">
          <CardHeader>
            <CardTitle className="text-lg">{t("notificationsAllTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Bell}
              title={t("notificationsEmptyTitle")}
              description={t("notificationsEmptyDesc")}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const unread = isUnread(n);
            const Icon =
              n.type === "booking"
                ? Ticket
                : n.type === "promo"
                  ? Tag
                  : n.type === "community"
                    ? Users
                    : n.type === "review"
                      ? MessageSquare
                      : n.type === "watchlist"
                        ? Heart
                        : n.type === "refund"
                          ? RotateCcw
                          : Crown;
            const badge =
              n.type === "booking"
                ? t("badgeBooking")
                : n.type === "promo"
                  ? t("badgePromo")
                  : n.type === "community"
                    ? t("badgeCommunity")
                    : n.type === "review"
                      ? t("badgeReview")
                      : n.type === "watchlist"
                        ? t("badgeWatchlist")
                        : n.type === "refund"
                          ? t("badgeRefund")
                          : t("badgeMembership");

            return (
              <Card
                key={n.id}
                className={[
                  "cinect-account-row",
                  unread ? "cinect-account-row--active" : "",
                ].join(" ")}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="bg-muted mt-0.5 rounded-md p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <Badge variant="outline" className="text-[11px]">
                        {badge}
                      </Badge>
                      {unread && (
                        <Badge className="text-[11px]" variant="default">
                          {t("notifNewBadge")}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{n.message}</p>
                    {n.href && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={n.href}>{t("notifOpen")}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
