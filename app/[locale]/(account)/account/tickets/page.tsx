"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBookings } from "@/hooks/queries/use-bookings";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { CalendarPlus, ExternalLink, Ticket } from "lucide-react";

export default function AccountTicketsPage() {
  const t = useTranslations("account");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading, error, refetch } = useBookings({ limit: 100 });
  const bookings = ((data?.data ?? data) || []) as Array<import("@/types/domain").Booking>;

  const now = new Date();

  const { upcoming, past } = useMemo(() => {
    const upcomingList: typeof bookings = [];
    const pastList: typeof bookings = [];
    for (const b of bookings) {
      const showtimeDate = new Date(b.showtime);
      const isUpcoming =
        showtimeDate >= now &&
        (b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "HELD");
      if (isUpcoming) {
        upcomingList.push(b);
      } else {
        pastList.push(b);
      }
    }
    return { upcoming: upcomingList, past: pastList };
  }, [bookings, now]);

  const handleAddToCalendar = (booking: import("@/types/domain").Booking) => {
    if (typeof window === "undefined") return;
    const start = new Date(booking.showtime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z";

    const text = encodeURIComponent(`${booking.movieTitle} - ${booking.cinemaName}`);
    const dates = `${fmt(start)}/${fmt(end)}`;
    const details = encodeURIComponent(
      `CiNect booking ${booking.id}\nSeats: ${booking.seats
        ?.map((s) => `${s.row}${s.number}`)
        .join(", ")}`
    );
    const location = encodeURIComponent(
      `${booking.cinemaName}${booking.roomName ? " • " + booking.roomName : ""}`
    );

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareTicket = (booking: import("@/types/domain").Booking) => {
    if (typeof window === "undefined") return;
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://cinect.app";
    const url = `${origin}/tickets/${booking.id}?share=1`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {
        // ignore
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={t("tickets") ?? "My tickets"}
        description="View all your upcoming and past movie tickets."
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("tickets") ?? "Tickets" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No upcoming tickets. Once you complete a booking, it will appear here.
                </CardContent>
              </Card>
            ) : (
              upcoming.map((b) => (
                <Card key={b.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{b.movieTitle}</p>
                      <p className="text-muted-foreground text-xs">
                        {b.cinemaName}
                        {b.roomName ? ` • ${b.roomName}` : ""} •{" "}
                        {format(new Date(b.showtime), "PPpp")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seats:{" "}
                        {b.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "Updating..."}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tickets/${b.id}`}>
                          <Ticket className="mr-1 h-4 w-4" />
                          View ticket
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToCalendar(b)}
                      >
                        <CalendarPlus className="mr-1 h-4 w-4" />
                        Add to calendar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleShareTicket(b)}>
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Copy share link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {past.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No past tickets yet.
                </CardContent>
              </Card>
            ) : (
              past.map((b) => (
                <Card key={b.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{b.movieTitle}</p>
                      <p className="text-muted-foreground text-xs">
                        {b.cinemaName}
                        {b.roomName ? ` • ${b.roomName}` : ""} •{" "}
                        {format(new Date(b.showtime), "PPpp")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seats:{" "}
                        {b.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "Updating..."}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tickets/${b.id}`}>
                          <Ticket className="mr-1 h-4 w-4" />
                          View ticket
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

