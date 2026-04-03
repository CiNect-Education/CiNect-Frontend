"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBookings } from "@/hooks/queries/use-bookings";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Bell, CheckCheck, Ticket, Tag, Crown } from "lucide-react";
import type { Booking } from "@/types/domain";
import { Link } from "@/i18n/navigation";

type UiNotification = {
  id: string;
  type: "booking" | "promo" | "membership";
  title: string;
  message: string;
  createdAt: string;
  href?: string;
};

const READ_AT_KEY = "cinect.notifications.readAt";

export default function NotificationsPage() {
  const t = useTranslations("account");
  const [readAt, setReadAt] = useState<Date>(() => {
    if (typeof window === "undefined") return new Date(0);
    const raw = window.localStorage.getItem(READ_AT_KEY);
    if (!raw) return new Date(0);
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date(0) : d;
  });

  const { data, isLoading, error, refetch } = useBookings({ limit: 200 });
  const bookingsRaw = data?.data ?? data;
  const bookings = useMemo(() => ((bookingsRaw as Booking[]) || []), [bookingsRaw]);

  const notifications = useMemo<UiNotification[]>(() => {
    const list: UiNotification[] = [];
    const now = Date.now();
    const movieFallback = t("notificationMovieFallback");
    const cinemaFallback = t("notificationCinemaFallback");
    for (const b of bookings) {
      const showtimeTs = new Date(b.showtime).getTime();
      const showtimeOk = !Number.isNaN(showtimeTs);
      const isUpcoming = showtimeOk && showtimeTs > now;
      const movie = (b.movieTitle && String(b.movieTitle).trim()) || movieFallback;
      const cinema = (b.cinemaName && String(b.cinemaName).trim()) || cinemaFallback;
      list.push({
        id: `booking:${b.id}:${isUpcoming ? "upcoming" : "past"}`,
        type: "booking",
        title: isUpcoming ? "Upcoming booking" : "Thanks for watching",
        message: isUpcoming
          ? `${movie} at ${cinema} • your showtime is coming up.`
          : `${movie} • hope you enjoyed the movie!`,
        createdAt: isUpcoming ? b.showtime : b.updatedAt ?? b.createdAt,
        href: `/tickets/${b.id}`,
      });
    }

    // Lightweight “system” hints (no backend required)
    list.push({
      id: "promo:checkout",
      type: "promo",
      title: "Tip: apply promo codes",
      message: "You can enter promo codes, gift cards, and points during checkout.",
      createdAt: new Date().toISOString(),
      href: "/movies",
    });
    list.push({
      id: "membership:profile",
      type: "membership",
      title: "Membership reminder",
      message: "Set your date of birth in Profile to unlock birthday perks.",
      createdAt: new Date().toISOString(),
      href: "/account/profile",
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, t]);

  const unreadCount = useMemo(() => {
    const readAtTs = readAt.getTime();
    return notifications.filter((n) => new Date(n.createdAt).getTime() > readAtTs).length;
  }, [notifications, readAt]);

  const handleMarkAllRead = () => {
    const now = new Date();
    setReadAt(now);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_AT_KEY, now.toISOString());
    }
    toast.success("All notifications marked as read");
  };

  return (
    <div>
      <PageHeader
        title={t("notifications")}
        description={t("notificationsDesc")}
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("notifications") },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read{unreadCount > 0 ? ` (${unreadCount})` : ""}
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
        <Card className="cinect-glass border">
          <CardHeader>
            <CardTitle className="text-lg">All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You are all caught up. Notifications about your bookings, promotions, and membership updates will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = new Date(n.createdAt).getTime() > readAt.getTime();
            const Icon = n.type === "booking" ? Ticket : n.type === "promo" ? Tag : Crown;
            const badge =
              n.type === "booking" ? "Booking" : n.type === "promo" ? "Promo" : "Membership";
            return (
              <Card
                key={n.id}
                className={[
                  "cinect-glass border transition-all hover:shadow-lg",
                  isUnread ? "border-primary/30" : "",
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
                      {isUnread && (
                        <Badge className="text-[11px]" variant="default">
                          New
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
                          <Link href={n.href}>Open</Link>
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
