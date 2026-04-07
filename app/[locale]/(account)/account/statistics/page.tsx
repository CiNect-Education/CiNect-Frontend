"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, isValid, subDays } from "date-fns";
import { enUS, vi as viDateLocale } from "date-fns/locale";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBookings } from "@/hooks/queries/use-bookings";
import { formatVnd } from "@/lib/showtime-display";
import { BarChart3, CalendarClock, CircleDollarSign, Film, MapPin, Ticket } from "lucide-react";
import type { Booking } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && "data" in v && Array.isArray((v as { data: unknown }).data)) {
    return (v as { data: T[] }).data;
  }
  return [];
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AccountStatisticsPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;

  const { data, isLoading, error, refetch } = useBookings({ limit: 500 });
  const bookings = useMemo(() => toList<Booking>(data?.data ?? data), [data]);

  const analytics = useMemo(() => {
    const paid = bookings.filter((b) => b.payment?.status === "PAID" || b.status === "COMPLETED");
    const active = bookings.filter((b) => ["PENDING", "HELD", "CONFIRMED"].includes(b.status));
    const last30 = bookings.filter((b) => {
      const d = safeDate(b.createdAt);
      return !!d && d >= subDays(new Date(), 30);
    });

    const totalSpent = paid.reduce((sum, b) => sum + (b.finalAmount ?? 0), 0);
    const avgTicketValue = paid.length > 0 ? totalSpent / paid.length : 0;

    const byStatus = bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    }, {});

    const byCinema = bookings.reduce<Record<string, number>>((acc, b) => {
      const key = b.cinemaName || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topCinema = Object.entries(byCinema).sort((a, b) => b[1] - a[1])[0];
    const latestShowtime = bookings
      .map((b) => safeDate(b.showtime))
      .filter((d): d is Date => !!d && isValid(d))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      total: bookings.length,
      active: active.length,
      paid: paid.length,
      totalSpent,
      avgTicketValue,
      last30: last30.length,
      byStatus,
      topCinema,
      latestShowtime,
    };
  }, [bookings]);

  return (
    <div>
      <PageHeader
        title={t("statistics")}
        description={t("statisticsDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("statistics") }]}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="cinect-glass border">
              <CardHeader className="pb-2">
                <CardDescription>{t("statsTotalBookings")}</CardDescription>
                <CardTitle className="text-2xl">{analytics.total}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
                <Ticket className="h-4 w-4" />
                {t("statsTotalBookingsHint")}
              </CardContent>
            </Card>

            <Card className="cinect-glass border">
              <CardHeader className="pb-2">
                <CardDescription>{t("statsActiveTickets")}</CardDescription>
                <CardTitle className="text-2xl">{analytics.active}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
                <CalendarClock className="h-4 w-4" />
                {t("statsActiveTicketsHint")}
              </CardContent>
            </Card>

            <Card className="cinect-glass border">
              <CardHeader className="pb-2">
                <CardDescription>{t("statsPaidOrders")}</CardDescription>
                <CardTitle className="text-2xl">{analytics.paid}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
                <Film className="h-4 w-4" />
                {t("statsPaidOrdersHint")}
              </CardContent>
            </Card>

            <Card className="cinect-glass border">
              <CardHeader className="pb-2">
                <CardDescription>{t("statsTotalSpent")}</CardDescription>
                <CardTitle className="text-2xl">{formatVnd(analytics.totalSpent, locale)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
                <CircleDollarSign className="h-4 w-4" />
                {t("statsTotalSpentHint")}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <Card className="cinect-glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  {t("statsByStatusTitle")}
                </CardTitle>
                <CardDescription>{t("statsByStatusDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.byStatus).length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("emptyOrders")}</p>
                ) : (
                  Object.entries(analytics.byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t(`orderStatus${status}` as "orderStatusALL")}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <div className="bg-muted h-2 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${analytics.total > 0 ? Math.max(8, (count / analytics.total) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="cinect-glass border">
              <CardHeader>
                <CardTitle>{t("statsHighlightsTitle")}</CardTitle>
                <CardDescription>{t("statsHighlightsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{t("statsAvgTicketValue")}</p>
                  <p className="mt-1 text-base font-semibold">{formatVnd(analytics.avgTicketValue, locale)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{t("statsLast30DaysOrders")}</p>
                  <p className="mt-1 text-base font-semibold">{analytics.last30}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{t("statsTopCinema")}</p>
                  <p className="mt-1 text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {analytics.topCinema?.[0] ?? "—"}
                  </p>
                  {analytics.topCinema ? (
                    <Badge variant="outline" className="mt-2">
                      {analytics.topCinema[1]} {t("statsBookingsUnit")}
                    </Badge>
                  ) : null}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{t("statsLatestShowtime")}</p>
                  <p className="mt-1 text-base font-semibold">
                    {analytics.latestShowtime
                      ? format(analytics.latestShowtime, "PPpp", { locale: dateFnsLocale })
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

