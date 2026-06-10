"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { useAdminRefunds } from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";
import { ApiErrorState } from "@/components/system/api-error-state";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type RefundRow = {
  id: string;
  userName: string;
  userEmail: string;
  movieTitle: string;
  cinemaName: string;
  amount: number;
  refundMethod: string;
  reason?: string;
  createdAt: string;
};

export default function AdminRefundsPage() {
  const t = useTranslations("admin");
  const { data, isLoading, error, refetch } = useAdminRefunds({ page: 1, limit: 100 });

  const rows = useMemo<RefundRow[]>(() => {
    return unwrapList<Record<string, unknown>>(data?.data ?? data).map((r) => ({
      id: String(r.id ?? ""),
      userName: String((r.user as { fullName?: string })?.fullName ?? "—"),
      userEmail: String((r.user as { email?: string })?.email ?? "—"),
      movieTitle: String(
        (r.booking as { showtime?: { movie?: { title?: string } } })?.showtime?.movie?.title ?? "—"
      ),
      cinemaName: String(
        (r.booking as { showtime?: { cinema?: { name?: string } } })?.showtime?.cinema?.name ?? "—"
      ),
      amount: Number(r.amount ?? 0),
      refundMethod: String(r.refundMethod ?? "—"),
      reason: r.reason ? String(r.reason) : undefined,
      createdAt: String(r.createdAt ?? ""),
    }));
  }, [data]);

  const columns = useMemo<ColumnDef<RefundRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: t("colCreated"),
        cell: ({ row }) =>
          row.original.createdAt ? format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm") : "—",
      },
      { accessorKey: "userName", header: t("colName") },
      { accessorKey: "userEmail", header: t("colEmail") },
      { accessorKey: "movieTitle", header: t("movies") },
      { accessorKey: "cinemaName", header: t("cinema") },
      {
        accessorKey: "amount",
        header: t("refundAmount"),
        cell: ({ row }) => row.original.amount.toLocaleString("vi-VN") + " ₫",
      },
      {
        accessorKey: "refundMethod",
        header: t("refundMethod"),
        cell: ({ row }) => <Badge variant="outline">{row.original.refundMethod}</Badge>,
      },
      {
        accessorKey: "reason",
        header: t("refundReason"),
        cell: ({ row }) => row.original.reason ?? "—",
      },
    ],
    [t]
  );

  return (
    <AdminPageShell title={t("refunds")} description={t("descRefunds")}>
      {error && !isLoading ? (
        <ApiErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchKey="userName"
          searchPlaceholder={t("searchRefunds")}
          className="cinect-glass rounded-lg border p-4"
          isLoading={isLoading}
          emptyMessage={t("emptyRefunds")}
        />
      )}
    </AdminPageShell>
  );
}
