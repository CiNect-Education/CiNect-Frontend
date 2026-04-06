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
    }),
    [statusFilter, dateFrom, dateTo, search]
  );

  const { data: bookingsRes, isLoading: bookingsLoading } = useAdminBookings(params);
  const bookings = bookingsRes?.data ?? [];
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
          value={statusFilter || "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
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

      <DataTable
        columns={columns}
        data={bookings}
        searchKey="movieTitle"
        searchPlaceholder={t("searchBookingsMovie")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={bookingsLoading}
        emptyMessage={t("emptyBookings")}
      />

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
