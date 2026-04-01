"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useBookings } from "@/hooks/queries/use-bookings";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { Ticket, Search, ArrowRight } from "lucide-react";
import type { Booking, BookingStatus } from "@/types/domain";

export default function OrdersPage() {
  const t = useTranslations("account");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");

  const { data, isLoading, error, refetch } = useBookings({ limit: 200 });
  const bookings = ((data?.data ?? data) || []) as Booking[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (status !== "ALL" && b.status !== status) return false;
        if (!q) return true;
        return (
          b.id.toLowerCase().includes(q) ||
          b.movieTitle.toLowerCase().includes(q) ||
          b.cinemaName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, query, status]);

  return (
    <div>
      <PageHeader
        title={t("orders")}
        description={t("ordersDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("orders") }]}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by order ID, movie, cinema..."
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
                  {s === "ALL" ? "All" : s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Ticket}
              title="No orders found"
              description="Try changing filters, or complete a booking to see it here."
              actionLabel="Browse movies"
            />
            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link href="/movies">Browse movies</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{b.movieTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    {b.cinemaName}
                    {b.roomName ? ` • ${b.roomName}` : ""} •{" "}
                    {format(new Date(b.showtime), "PPpp")}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono">#{b.id}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Badge variant="outline" className="text-xs">
                      {b.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(b.finalAmount ?? 0).toLocaleString()}đ
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/tickets/${b.id}`}>View ticket</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/account/orders/${b.id}`}>
                      Details <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
