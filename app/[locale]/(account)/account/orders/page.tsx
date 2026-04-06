"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBookings } from "@/hooks/queries/use-bookings";
import { Link } from "@/i18n/navigation";
import { format, isValid } from "date-fns";
import { CalendarPlus, ExternalLink, Search, Ticket } from "lucide-react";
import type { Booking, BookingStatus } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && "data" in v && Array.isArray((v as { data: unknown }).data))
    return (v as { data: T[] }).data;
  return [];
}

function formatShowtimeLabel(iso: string) {
  const d = new Date(iso);
  return isValid(d) ? format(d, "PPpp") : "—";
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function OrdersPage() {
  const t = useTranslations("account");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading, error, refetch } = useBookings({ limit: 200 });
  const bookings = useMemo(() => toList<Booking>(data?.data ?? data), [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status !== "ALL" && booking.status !== status) return false;
      if (!q) return true;
      return (
        booking.id.toLowerCase().includes(q) ||
        booking.movieTitle.toLowerCase().includes(q) ||
        booking.cinemaName.toLowerCase().includes(q)
      );
    });
  }, [bookings, query, status]);

  const now = new Date();
  const { upcoming, past } = useMemo(() => {
    const upcomingList: Booking[] = [];
    const pastList: Booking[] = [];

    for (const booking of filtered) {
      const showtimeDate = new Date(booking.showtime);
      const isUpcoming =
        isValid(showtimeDate) &&
        showtimeDate >= now &&
        (booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "HELD");

      if (isUpcoming) {
        upcomingList.push(booking);
      } else {
        pastList.push(booking);
      }
    }

    return {
      upcoming: upcomingList.sort(
        (a, b) => new Date(a.showtime).getTime() - new Date(b.showtime).getTime()
      ),
      past: pastList.sort((a, b) => new Date(b.showtime).getTime() - new Date(a.showtime).getTime()),
    };
  }, [filtered, now]);

  const handleAddToCalendar = (booking: Booking) => {
    if (typeof window === "undefined") return;

    const start = new Date(booking.showtime);
    if (!isValid(start)) return;

    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z";

    const text = encodeURIComponent(`${booking.movieTitle} - ${booking.cinemaName}`);
    const dates = `${fmt(start)}/${fmt(end)}`;
    const details = encodeURIComponent(
      `CiNect booking ${booking.id}\nSeats: ${booking.seats?.map((s) => `${s.row}${s.number}`).join(", ")}`
    );
    const location = encodeURIComponent(
      `${booking.cinemaName}${booking.roomName ? " • " + booking.roomName : ""}`
    );

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareTicket = (booking: Booking) => {
    if (typeof window === "undefined") return;

    const origin = window.location.origin || "https://cinect.app";
    const url = `${origin}/tickets/${booking.id}?share=1`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div>
      <PageHeader
        title={t("tickets")}
        description={t("ticketsPageDesc")}
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("tickets") },
        ]}
      />

      <Card className="cinect-glass mb-6 border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t("ticketSearchPlaceholder")}
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  "ALL",
                  "PENDING",
                  "HELD",
                  "CONFIRMED",
                  "COMPLETED",
                  "CANCELLED",
                ] as const
              ).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={status === s ? "default" : "outline"}
                  onClick={() => setStatus(s)}
                >
                  {t(`orderStatus${s}` as "orderStatusALL")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList className="cinect-glass border">
            <TabsTrigger value="upcoming">{t("upcomingTickets")}</TabsTrigger>
            <TabsTrigger value="past">{t("pastTickets")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <Card className="cinect-glass border">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t("noUpcomingTickets")}
                </CardContent>
              </Card>
            ) : (
              upcoming.map((booking) => (
                <Card
                  key={booking.id}
                  className="cinect-glass overflow-hidden border transition-all hover:shadow-lg"
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{booking.movieTitle}</p>
                      <p className="text-muted-foreground text-xs">
                        {booking.cinemaName}
                        {booking.roomName ? ` • ${booking.roomName}` : ""} • {formatShowtimeLabel(booking.showtime)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seats: {booking.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "—"}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tickets/${booking.id}`}>
                          <Ticket className="mr-1 h-4 w-4" />
                          {t("viewTicket")}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToCalendar(booking)}
                      >
                        <CalendarPlus className="mr-1 h-4 w-4" />
                        Add to calendar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleShareTicket(booking)}>
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Copy link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {past.length === 0 ? (
              <Card className="cinect-glass border">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t("noPastTickets")}
                </CardContent>
              </Card>
            ) : (
              past.map((booking) => (
                <Card
                  key={booking.id}
                  className="cinect-glass overflow-hidden border transition-all hover:shadow-lg"
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{booking.movieTitle}</p>
                      <p className="text-muted-foreground text-xs">
                        {booking.cinemaName}
                        {booking.roomName ? ` • ${booking.roomName}` : ""} • {formatShowtimeLabel(booking.showtime)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Seats: {booking.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "—"}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tickets/${booking.id}`}>
                          <Ticket className="mr-1 h-4 w-4" />
                          {t("viewTicket")}
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
