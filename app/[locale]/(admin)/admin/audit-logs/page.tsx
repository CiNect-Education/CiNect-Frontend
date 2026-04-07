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

type RawAudit = {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action?: string;
  entity?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  newValues?: unknown;
  timestamp?: string;
  createdAt?: string;
};

function normalizeAuditLog(item: RawAudit): AuditLogEntry {
  const details =
    item.details ??
    (item.newValues && typeof item.newValues === "object"
      ? JSON.stringify(item.newValues)
      : item.newValues != null
        ? String(item.newValues)
        : "");

  return {
    id: String(item.id ?? ""),
    userId: String(item.userId ?? ""),
    userName: String(item.userName ?? item.userEmail ?? item.userId ?? ""),
    action: String(item.action ?? ""),
    entity: String(item.entity ?? item.entityType ?? ""),
    entityId: String(item.entityId ?? ""),
    details,
    timestamp: String(item.timestamp ?? item.createdAt ?? ""),
  };
}

function extractAuditPayload(v: unknown): {
  items: AuditLogEntry[];
  meta?: { total?: number; totalPages?: number };
} {
  if (!v || typeof v !== "object") return { items: [] };
  const obj = v as { data?: unknown; meta?: { total?: number; totalPages?: number } };
  if (Array.isArray(obj.data)) {
    return { items: obj.data.map((row) => normalizeAuditLog(row as RawAudit)), meta: obj.meta };
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as { data?: unknown; meta?: { total?: number; totalPages?: number } };
    if (Array.isArray(nested.data)) {
      return {
        items: nested.data.map((row) => normalizeAuditLog(row as RawAudit)),
        meta: nested.meta ?? obj.meta,
      };
    }
  }
  return { items: [] };
}

function exportToCsv(logs: AuditLogEntry[], headers: string[]) {
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
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const ALL = "__ALL__";
  const [actionFilter, setActionFilter] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const limit = 20;

  const params = useMemo(
    () => ({
      search: search || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      action: actionFilter === ALL ? undefined : actionFilter,
      page,
      limit,
    }),
    [search, dateFrom, dateTo, actionFilter, page]
  );

  const { data: logsRes, isLoading: logsLoading } = useAdminAuditLogs(params);
  const payload = extractAuditPayload(logsRes);
  const logs = payload.items;
  const meta = payload.meta;
  const totalPages = meta?.totalPages ?? 1;

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: "timestamp",
        header: t("auditColTimestamp"),
        cell: ({ row }) =>
          row.original.timestamp
            ? format(new Date(row.original.timestamp), "dd/MM/yyyy HH:mm")
            : "—",
      },
      {
        accessorKey: "userName",
        header: t("auditColUser"),
        cell: ({ row }) => row.original.userName ?? row.original.userId ?? "—",
      },
      { accessorKey: "action", header: t("auditColAction") },
      { accessorKey: "entity", header: t("auditColEntity") },
      {
        accessorKey: "entityId",
        header: t("auditColEntityId"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original.entityId ?? "").slice(0, 8)}
            {String(row.original.entityId ?? "").length > 8 ? "…" : ""}
          </span>
        ),
      },
      {
        accessorKey: "details",
        header: t("auditColDetails"),
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate" title={row.original.details}>
            {row.original.details ?? "—"}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <div>
      <PageHeader
        title={t("auditLogs")}
        description={t("descAuditLogs")}
        breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("auditLogs") }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCsv(logs, [
                t("auditColTimestamp"),
                t("auditColUser"),
                t("auditColAction"),
                t("auditColEntity"),
                t("auditColEntityId"),
                t("auditColDetails"),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            {t("exportCSV")}
          </Button>
        }
      />

      <div className="cinect-glass mb-4 flex flex-wrap gap-4 rounded-lg border p-4">
        <Input
          placeholder={t("searchAuditUser")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-[200px]"
        />
        <Input
          type="date"
          placeholder={t("dateFrom")}
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(0);
          }}
        />
        <Input
          type="date"
          placeholder={t("dateTo")}
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
            <SelectValue placeholder={t("actionType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filterAll")}</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        pageSize={50}
        hidePagination
        className="cinect-glass rounded-lg border p-4"
        isLoading={logsLoading}
        emptyMessage={t("emptyAuditLogs")}
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("pageXofY", { current: page + 1, total: totalPages })}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            {tCommon("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            {tCommon("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
