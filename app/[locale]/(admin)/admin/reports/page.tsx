"use client";

import { Suspense, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, CalendarDays } from "lucide-react";
import {
  useAdminReportSales,
  useAdminReportMovies,
  useAdminReportCinemas,
} from "@/hooks/queries/use-admin";
import { format } from "date-fns";

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && "data" in v && Array.isArray((v as { data: unknown }).data))
    return (v as { data: T[] }).data;
  return [];
}

function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n"
  );
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORT_TABS = ["sales", "movies", "cinemas"] as const;
type ReportTab = (typeof REPORT_TABS)[number];

function parseReportTab(v: string | null): ReportTab {
  if (v && (REPORT_TABS as readonly string[]).includes(v)) return v as ReportTab;
  return "sales";
}

function AdminReportsPage() {
  const t = useTranslations("admin");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = parseReportTab(searchParams.get("tab"));

  const setReportTab = useCallback(
    (next: ReportTab) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", next);
      router.replace(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const params = useMemo(
    () => ({
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    [dateFrom, dateTo]
  );

  const { data: salesRes } = useAdminReportSales(params);
  const { data: moviesRes } = useAdminReportMovies(params);
  const { data: cinemasRes } = useAdminReportCinemas(params);

  const salesData = toList<{ date: string; revenue: number; bookings: number }>(salesRes?.data ?? salesRes);
  const moviesData = toList<{
    movieId: string;
    movieTitle: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>(moviesRes?.data ?? moviesRes);
  const cinemasData = toList<{
    cinemaId: string;
    cinemaName: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>(cinemasRes?.data ?? cinemasRes);

  const exportSalesCSV = () => {
    downloadCSV(
      ["Date", "Revenue", "Bookings"],
      salesData.map((r) => [r.date, r.revenue, r.bookings]),
      `sales-report-${dateFrom}-${dateTo}.csv`
    );
  };

  const exportMoviesCSV = () => {
    downloadCSV(
      ["Movie ID", "Movie Title", "Revenue", "Bookings", "Occupancy"],
      moviesData.map((r) => [r.movieId, r.movieTitle, r.revenue, r.bookings, r.occupancy ?? ""]),
      `movies-report-${dateFrom}-${dateTo}.csv`
    );
  };

  const exportCinemasCSV = () => {
    downloadCSV(
      ["Cinema ID", "Cinema Name", "Revenue", "Bookings", "Occupancy"],
      cinemasData.map((r) => [r.cinemaId, r.cinemaName, r.revenue, r.bookings, r.occupancy ?? ""]),
      `cinemas-report-${dateFrom}-${dateTo}.csv`
    );
  };

  return (
    <div>
      <PageHeader
        title={t("reports")}
        description="Business analytics and performance reports for your cinema chain."
        breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("reports") }]}
        actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="text-muted-foreground h-4 w-4" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setReportTab(parseReportTab(v))}>
        <TabsList className="cinect-glass border">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="cinemas">Cinemas</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Card className="cinect-glass border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Report</CardTitle>
              <Button variant="outline" size="sm" onClick={exportSalesCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                  No sales data for this period
                </div>
              ) : (
                <div className="mb-6 h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height={256} debounce={32}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MM/dd")} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => (value as number).toLocaleString()}
                        labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                        name="Bookings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="cinect-glass rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((r) => (
                      <TableRow key={r.date}>
                        <TableCell>{format(new Date(r.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">{r.revenue.toLocaleString()} ₫</TableCell>
                        <TableCell className="text-right">{r.bookings}</TableCell>
                      </TableRow>
                    ))}
                    {salesData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-center">
                          No data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movies" className="space-y-6">
          <Card className="cinect-glass border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Movie Performance</CardTitle>
              <Button variant="outline" size="sm" onClick={exportMoviesCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {moviesData.length === 0 ? (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                  No movie data for this period
                </div>
              ) : (
                <div className="mb-6 h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height={256} debounce={32}>
                    <BarChart
                      data={moviesData.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                      <YAxis
                        type="category"
                        dataKey="movieTitle"
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => (v as number).toLocaleString()} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="cinect-glass rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Movie</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moviesData.map((r) => (
                      <TableRow key={r.movieId}>
                        <TableCell>{r.movieTitle}</TableCell>
                        <TableCell className="text-right">{r.revenue.toLocaleString()} ₫</TableCell>
                        <TableCell className="text-right">{r.bookings}</TableCell>
                        <TableCell className="text-right">
                          {r.occupancy != null ? `${(r.occupancy * 100).toFixed(1)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {moviesData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">
                          No data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cinemas" className="space-y-6">
          <Card className="cinect-glass border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cinema Performance</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCinemasCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {cinemasData.length === 0 ? (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                  No cinema data for this period
                </div>
              ) : (
                <div className="mb-6 h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height={256} debounce={32}>
                    <BarChart
                      data={cinemasData.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                      <YAxis
                        type="category"
                        dataKey="cinemaName"
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => (v as number).toLocaleString()} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="cinect-glass rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cinema</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cinemasData.map((r) => (
                      <TableRow key={r.cinemaId}>
                        <TableCell>{r.cinemaName}</TableCell>
                        <TableCell className="text-right">{r.revenue.toLocaleString()} ₫</TableCell>
                        <TableCell className="text-right">{r.bookings}</TableCell>
                        <TableCell className="text-right">
                          {r.occupancy != null ? `${(r.occupancy * 100).toFixed(1)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {cinemasData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">
                          No data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminReportsPageRoute() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground p-8 text-sm">Loading reports…</div>}
    >
      <AdminReportsPage />
    </Suspense>
  );
}
