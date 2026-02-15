"use client";

import { useState, useMemo } from "react";
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

function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const t = useTranslations("admin");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().slice(0, 10)
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

  const salesData = salesRes?.data ?? [];
  const moviesData = moviesRes?.data ?? [];
  const cinemasData = cinemasRes?.data ?? [];

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
        breadcrumbs={[
          { label: t("title"), href: "/admin" },
          { label: t("reports") },
        ]}
        actions={
          <div className="flex gap-2 items-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
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

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="cinemas">Cinemas</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Report</CardTitle>
              <Button variant="outline" size="sm" onClick={exportSalesCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  No sales data for this period
                </div>
              ) : (
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(new Date(v), "MM/dd")}
                      />
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
              <div className="rounded-md border">
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
                        <TableCell>
                          {format(new Date(r.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.revenue.toLocaleString()} ₫
                        </TableCell>
                        <TableCell className="text-right">
                          {r.bookings}
                        </TableCell>
                      </TableRow>
                    ))}
                    {salesData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Movie Performance</CardTitle>
              <Button variant="outline" size="sm" onClick={exportMoviesCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {moviesData.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  No movie data for this period
                </div>
              ) : (
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
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
              <div className="rounded-md border">
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
                        <TableCell className="text-right">
                          {r.revenue.toLocaleString()} ₫
                        </TableCell>
                        <TableCell className="text-right">{r.bookings}</TableCell>
                        <TableCell className="text-right">
                          {r.occupancy != null
                            ? `${(r.occupancy * 100).toFixed(1)}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {moviesData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cinema Performance</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCinemasCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {cinemasData.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  No cinema data for this period
                </div>
              ) : (
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
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
              <div className="rounded-md border">
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
                        <TableCell className="text-right">
                          {r.revenue.toLocaleString()} ₫
                        </TableCell>
                        <TableCell className="text-right">{r.bookings}</TableCell>
                        <TableCell className="text-right">
                          {r.occupancy != null
                            ? `${(r.occupancy * 100).toFixed(1)}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {cinemasData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
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
