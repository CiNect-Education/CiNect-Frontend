"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuditLogs } from "@/hooks/queries/use-admin";
import { format } from "date-fns";
import { Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && "data" in v && Array.isArray((v as { data: unknown }).data))
    return (v as { data: T[] }).data;
  return [];
}

function exportToCsv(logs: AuditLogEntry[]) {
  const headers = ["Timestamp", "User", "Action", "Entity", "Entity ID", "Details"];
  const rows = logs.map((log) => [
    log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
    log.userName ?? log.userId ?? "",
    log.action ?? "",
    log.entity ?? "",
    log.entityId ?? "",
    (log.details ?? "").replace(/"/g, '""'),
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
    "\n"
  );
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogsPage() {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const params = useMemo(
    () => ({
      search: search || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      action: actionFilter || undefined,
      page: page + 1,
      limit,
    }),
    [search, dateFrom, dateTo, actionFilter, page]
  );

  const { data: logsRes } = useAdminAuditLogs(params);
  const logs = toList<AuditLogEntry>(logsRes?.data ?? logsRes);
  const meta = (logsRes?.data as { meta?: { total?: number; totalPages?: number } } | undefined)
    ?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) =>
          row.original.timestamp
            ? format(new Date(row.original.timestamp), "dd/MM/yyyy HH:mm")
            : "—",
      },
      {
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => row.original.userName ?? row.original.userId ?? "—",
      },
      { accessorKey: "action", header: "Action" },
      { accessorKey: "entity", header: "Entity" },
      {
        accessorKey: "entityId",
        header: "Entity ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original.entityId ?? "").slice(0, 8)}
            {String(row.original.entityId ?? "").length > 8 ? "…" : ""}
          </span>
        ),
      },
      {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate" title={row.original.details}>
            {row.original.details ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title={t("auditLogs")}
        description="View system audit logs and activity history."
        breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("auditLogs") }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => exportToCsv(logs)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <Input
          placeholder="Search user..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-[200px]"
        />
        <Input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(0);
          }}
        />
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(0);
          }}
        />
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={logs} pageSize={50} hidePagination />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
