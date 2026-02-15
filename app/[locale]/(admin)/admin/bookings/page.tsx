"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
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

  const { data: bookingsRes } = useAdminBookings(params);
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
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original.id).slice(0, 8)}...
          </span>
        ),
      },
      {
        accessorKey: "movieTitle",
        header: "Movie",
      },
      {
        accessorKey: "cinemaName",
        header: "Cinema",
      },
      {
        id: "user",
        header: "User",
        cell: ({ row }) => row.original.userId?.slice(0, 8) ?? "—",
      },
      {
        accessorKey: "finalAmount",
        header: "Amount",
        cell: ({ row }) =>
          (row.original.finalAmount?.toLocaleString() ?? "0") + " ₫",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs ${
              row.original.status === "CONFIRMED"
                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                : row.original.status === "CANCELLED"
                ? "bg-red-500/20 text-red-700 dark:text-red-400"
                : row.original.status === "COMPLETED"
                ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) =>
          row.original.createdAt
            ? format(new Date(row.original.createdAt), "MMM d, HH:mm")
            : "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const b = row.original;
          const canCancel =
            b.status !== "CANCELLED" && b.status !== "COMPLETED";
          const canRefund =
            b.status === "CONFIRMED" || b.status === "COMPLETED";
          return (
            <div className="flex gap-1">
              {canCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCancelTarget(b)}
                  title="Cancel"
                >
                  <Ban className="h-4 w-4 text-destructive" />
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRefundTarget(b)}
                  title="Refund"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title={t("bookings")}
        description="View and manage all customer bookings and orders."
        breadcrumbs={[
          { label: t("title"), href: "/admin" },
          { label: t("bookings") },
        ]}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="Search bookings..."
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
            <SelectValue placeholder="Status" />
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
          placeholder="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchKey="movieTitle"
        searchPlaceholder="Search by movie..."
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>
              Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
