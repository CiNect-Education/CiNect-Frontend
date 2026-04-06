"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Ban, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { Booking } from "@/types/domain";
import {
  useAdminBookings,
  useAdminCancelBooking,
  useAdminRefundBooking,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";
import { ApiErrorState } from "@/components/system/api-error-state";

const ALL_STATUS_VALUE = "__ALL_STATUS__";

type RawBooking = Partial<Booking> & {
  showtime?: {
    startTime?: string;
    movie?: { title?: string; posterUrl?: string };
    cinema?: { name?: string };
    room?: { name?: string };
  };
  user?: { id?: string };
};

function normalizeBooking(raw: RawBooking): Booking {
  const showtimeStart = raw.showtime?.startTime;
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? raw.user?.id ?? ""),
    showtimeId: String(raw.showtimeId ?? raw.showtime?.startTime ?? ""),
    seats: (raw.seats ?? []) as Booking["seats"],
    snacks: (raw.snacks ?? []) as Booking["snacks"],
    totalAmount: Number(raw.totalAmount ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    finalAmount: Number(raw.finalAmount ?? raw.totalAmount ?? 0),
    status: (raw.status ?? "PENDING") as Booking["status"],
    payment: raw.payment,
    promotionCode: raw.promotionCode,
    pointsUsed: raw.pointsUsed,
    giftCardCode: raw.giftCardCode,
    movieTitle: String(raw.movieTitle ?? raw.showtime?.movie?.title ?? ""),
    moviePosterUrl: raw.moviePosterUrl ?? raw.showtime?.movie?.posterUrl,
    cinemaName: String(raw.cinemaName ?? raw.showtime?.cinema?.name ?? ""),
    roomName: String(raw.roomName ?? raw.showtime?.room?.name ?? ""),
    showtime: String(raw.showtime ?? showtimeStart ?? ""),
    format: (raw.format ?? "2D") as Booking["format"],
    qrCode: raw.qrCode,
    expiresAt: raw.expiresAt,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? ""),
  };
}

export default function AdminBookingsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  const params = useMemo(
    () => ({
      status: statusFilter || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      search: search || undefined,
      limit: 500,
    }),
    [statusFilter, dateFrom, dateTo, search]
  );

  const {
    data: bookingsRes,
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useAdminBookings(params);
  const bookings = unwrapList<RawBooking>(bookingsRes?.data ?? bookingsRes).map(normalizeBooking);
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const text = `${b.id} ${b.movieTitle} ${b.cinemaName} ${b.userId}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (new Date(b.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        if (new Date(b.createdAt) > to) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, search, dateFrom, dateTo]);
  const cancelMutation = useAdminCancelBooking();
  const refundMutation = useAdminRefundBooking();

  async function handleCancel() {
    if (!cancelTarget) return;
    await cancelMutation.mutateAsync({ id: cancelTarget.id });
    setCancelTarget(null);
  }

  async function handleRefund() {
    if (!refundTarget) return;
    await refundMutation.mutateAsync({ id: refundTarget.id });
    setRefundTarget(null);
  }

  const columns: ColumnDef<Booking>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("colBookingId"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{String(row.original.id).slice(0, 8)}...</span>
        ),
      },
      {
        accessorKey: "movieTitle",
        header: t("colMovie"),
      },
      {
        accessorKey: "cinemaName",
        header: t("cinema"),
      },
      {
        id: "user",
        header: t("colUser"),
        cell: ({ row }) => row.original.userId?.slice(0, 8) ?? "—",
      },
      {
        accessorKey: "finalAmount",
        header: t("colAmount"),
        cell: ({ row }) => (row.original.finalAmount?.toLocaleString() ?? "0") + " ₫",
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: ({ row }) => {
          const s = row.original.status;
          const variant =
            s === "CANCELLED"
              ? "destructive"
              : s === "CONFIRMED"
                ? "default"
                : s === "COMPLETED"
                  ? "secondary"
                  : "outline";
          const label =
            s === "PENDING"
              ? t("bookingStatusPENDING")
              : s === "HELD"
                ? t("bookingStatusHELD")
                : s === "CONFIRMED"
                  ? t("bookingStatusCONFIRMED")
                  : s === "COMPLETED"
                    ? t("bookingStatusCOMPLETED")
                    : s === "CANCELLED"
                      ? t("bookingStatusCANCELLED")
                      : s;
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("colDate"),
        cell: ({ row }) =>
          row.original.createdAt ? format(new Date(row.original.createdAt), "MMM d, HH:mm") : "—",
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => {
          const b = row.original;
          const canCancel = b.status !== "CANCELLED" && b.status !== "COMPLETED";
          const canRefund = b.status === "CONFIRMED" || b.status === "COMPLETED";
          return (
            <div className="flex gap-1">
              {canCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCancelTarget(b)}
                  aria-label={t("ariaCancelBooking")}
                >
                  <Ban className="text-destructive h-4 w-4" />
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRefundTarget(b)}
                  aria-label={t("ariaRefundBooking")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t]
  );

  return (
    <AdminPageShell
      title={t("bookings")}
      description={t("descBookings")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("bookings") }]}
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {t("exportCsv")}
        </Button>
      }
    >
      <div className="cinect-glass mb-6 flex flex-wrap gap-3 rounded-lg border p-4">
        <div className="relative min-w-[200px] flex-1">
          <Input
            placeholder={t("searchBookings")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter || ALL_STATUS_VALUE}
          onValueChange={(v) => setStatusFilter(v === ALL_STATUS_VALUE ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder={t("dateFrom")}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          placeholder={t("dateTo")}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>

      {bookingsError && !bookingsLoading ? (
        <ApiErrorState error={bookingsError} onRetry={() => void refetchBookings()} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredBookings}
          searchKey="movieTitle"
          searchPlaceholder={t("searchBookingsMovie")}
          className="cinect-glass rounded-lg border p-4"
          isLoading={bookingsLoading}
          emptyMessage={t("emptyBookings")}
        />
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelBookingTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelBookingDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirmCancelBooking")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("refundBookingTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("refundBookingDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>{t("confirmRefund")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
