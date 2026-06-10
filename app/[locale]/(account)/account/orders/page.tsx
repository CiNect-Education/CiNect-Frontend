"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { RemoteImage } from "@/components/shared/remote-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiErrorState } from "@/components/system/api-error-state";
import { BookingRefundDialog } from "@/components/account/booking-refund-dialog";
import { useBookings, useBookingRefunds } from "@/hooks/queries/use-bookings";
import { Link } from "@/i18n/navigation";
import { format, isValid } from "date-fns";
import { enUS, vi as viDateLocale } from "date-fns/locale";
import {
  CalendarPlus,
  ExternalLink,
  Filter,
  Search,
  Ticket,
  Undo2,
} from "lucide-react";
import type { Booking, BookingStatus } from "@/types/domain";
import { formatVnd } from "@/lib/showtime-display";
import { parseStoredRefundReason } from "@/lib/refund-reasons";

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
  const locale = useLocale();
  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [tab, setTab] = useState<"upcoming" | "past" | "refunds">("upcoming");
  const [sortBy, setSortBy] = useState<"showtime-desc" | "showtime-asc" | "amount-desc">(
    "showtime-desc"
  );
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  const statusOptions = [
    "ALL",
    "PENDING",
    "HELD",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ] as const;

  const sortOptions = [
    { value: "showtime-desc", label: t("ticketSortShowtimeDesc") },
    { value: "showtime-asc", label: t("ticketSortShowtimeAsc") },
    { value: "amount-desc", label: t("ticketSortAmountDesc") },
  ] as const;

  const { data, isLoading, error, refetch } = useBookings({ limit: 200 });
  const {
    data: refundsData,
    isLoading: refundsLoading,
    error: refundsError,
    refetch: refetchRefunds,
  } = useBookingRefunds({ limit: 50 });
  const refunds = useMemo(() => toList<import("@/lib/schemas/booking-refund").BookingRefund>(refundsData?.data ?? refundsData), [refundsData]);
  const bookings = useMemo(() => toList<Booking>(data?.data ?? data), [data]);

  const canRequestRefund = (booking: Booking, isUpcoming: boolean) =>
    isUpcoming &&
    booking.status === "CONFIRMED" &&
    booking.payment?.status === "PAID";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status !== "ALL" && booking.status !== status) return false;
      if (!q) return true;
      const id = booking.id?.toLowerCase?.() ?? "";
      const movie = booking.movieTitle?.toLowerCase?.() ?? "";
      const cinema = booking.cinemaName?.toLowerCase?.() ?? "";
      return (
        id.includes(q) ||
        movie.includes(q) ||
        cinema.includes(q)
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

    const sorter = (a: Booking, b: Booking) => {
      if (sortBy === "amount-desc") return (b.finalAmount ?? 0) - (a.finalAmount ?? 0);
      if (sortBy === "showtime-asc") return new Date(a.showtime).getTime() - new Date(b.showtime).getTime();
      return new Date(b.showtime).getTime() - new Date(a.showtime).getTime();
    };

    return {
      upcoming: upcomingList.sort(sorter),
      past: pastList.sort(sorter),
    };
  }, [filtered, now, sortBy]);

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

  const statusTone: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    CONFIRMED: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    PENDING: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    HELD: "bg-orange-500/15 text-orange-300 border-orange-400/30",
    CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  };

  const posterFallback = "https://placehold.co/240x360/0f172a/e2e8f0?text=No+Poster";

  const renderTicketCard = (booking: Booking, isUpcoming: boolean) => (
    <Card
      key={booking.id}
      className="cinect-glass group overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <CardContent className="p-0">
        <div className="from-primary/10 via-primary/5 to-transparent h-1 w-full bg-gradient-to-r" />
        <div className="grid gap-4 p-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:items-center">
          <div className="relative h-28 w-[84px] overflow-hidden rounded-md border bg-muted">
            <RemoteImage
              src={booking.moviePosterUrl || posterFallback}
              alt={booking.movieTitle || "Movie poster"}
              fill
              sizes="84px"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold">{booking.movieTitle || "Movie"}</p>
              <Badge
                variant="outline"
                className={`text-[10px] tracking-wide uppercase ${statusTone[booking.status] ?? ""}`}
              >
                {t(`orderStatus${booking.status}` as "orderStatusCONFIRMED")}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {booking.format ?? "2D"}
              </Badge>
            </div>

            <p className="text-muted-foreground line-clamp-2 text-xs">
              {booking.cinemaName || "Cinema"}
              {booking.roomName ? ` • ${booking.roomName}` : ""} • {formatShowtimeLabel(booking.showtime)}
            </p>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>Seats: {booking.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "—"}</span>
              <span>
                {safeDate(booking.createdAt)
                  ? format(safeDate(booking.createdAt) as Date, "PPp", { locale: dateFnsLocale })
                  : "—"}
              </span>
            </div>
          </div>

          <div className="grid min-w-[190px] gap-2">
            <Button size="sm" variant={isUpcoming ? "default" : "outline"} asChild className="justify-start">
              <Link href={`/tickets/${booking.id}`}>
                <Ticket className="mr-1 h-4 w-4" />
                {t("viewTicket")}
              </Link>
            </Button>
            {isUpcoming && (
              <Button
                size="sm"
                variant="outline"
                className="justify-start"
                onClick={() => handleAddToCalendar(booking)}
              >
                <CalendarPlus className="mr-1 h-4 w-4" />
                Add to calendar
              </Button>
            )}
            {canRequestRefund(booking, isUpcoming) && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-300 justify-start border-amber-400/30 hover:bg-amber-500/10"
                onClick={() => setRefundTarget(booking)}
              >
                <Undo2 className="mr-1 h-4 w-4" />
                {t("requestRefund")}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="justify-start" onClick={() => handleShareTicket(booking)}>
              <ExternalLink className="mr-1 h-4 w-4" />
              Copy link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t("ticketSearchPlaceholder")}
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus | "ALL")}>
                <SelectTrigger className="h-9 w-full sm:w-[148px]" aria-label={t("ticketFilterStatus")}>
                  <Filter className="text-muted-foreground mr-1.5 h-3.5 w-3.5 shrink-0" />
                  <SelectValue placeholder={t("ticketFilterStatus")} />
                </SelectTrigger>
                <SelectContent align="end">
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`orderStatus${s}` as "orderStatusALL")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="h-9 w-full sm:w-[168px]" aria-label={t("ticketSortBy")}>
                  <SelectValue placeholder={t("ticketSortBy")} />
                </SelectTrigger>
                <SelectContent align="end">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <TabsTrigger value="refunds">{t("refundHistoryTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <Card className="cinect-glass border">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t("noUpcomingTickets")}
                </CardContent>
              </Card>
            ) : (
              upcoming.map((booking) => renderTicketCard(booking, true))
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
              past.map((booking) => renderTicketCard(booking, false))
            )}
          </TabsContent>

          <TabsContent value="refunds" className="space-y-3">
            {refundsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : refundsError ? (
              <ApiErrorState error={refundsError} onRetry={refetchRefunds} />
            ) : refunds.length === 0 ? (
              <Card className="cinect-glass border">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t("refundHistoryEmpty")}
                </CardContent>
              </Card>
            ) : (
              refunds.map((refund) => {
                const parsedReason = parseStoredRefundReason(refund.reason);
                const reasonText = parsedReason.code
                  ? t(`refundCancelReason${parsedReason.code}` as "refundCancelReasonSCHEDULE_CONFLICT")
                  : null;

                return (
                <Card key={refund.id} className="cinect-glass border">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{refund.movieTitle ?? t("refundUnknownMovie")}</p>
                      <p className="text-muted-foreground text-xs">
                        {refund.cinemaName ?? "—"}
                        {refund.showtime && isValid(new Date(refund.showtime))
                          ? ` • ${format(new Date(refund.showtime), "PPp", { locale: dateFnsLocale })}`
                          : ""}
                      </p>
                      {reasonText ? (
                        <p className="text-muted-foreground text-xs">
                          {t("refundReasonSelectedLabel")}: {reasonText}
                          {parsedReason.detail ? ` — ${parsedReason.detail}` : ""}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(refund.createdAt), "PPp", { locale: dateFnsLocale })}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-emerald-300">{formatVnd(refund.amount, locale)}</p>
                      <p className="text-muted-foreground text-xs">
                        {refund.refundMethod === "STORE_CREDIT"
                          ? t("refundMethodStoreCredit")
                          : t("refundMethodOriginal")}
                      </p>
                      {refund.storeCreditCode ? (
                        <p className="text-amber-300 mt-1 font-mono text-xs">{refund.storeCreditCode}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}

      {refundTarget ? (
        <BookingRefundDialog
          booking={refundTarget}
          open={!!refundTarget}
          onOpenChange={(open) => !open && setRefundTarget(null)}
          onSuccess={() => {
            void refetch();
            void refetchRefunds();
          }}
        />
      ) : null}
    </div>
  );
}
