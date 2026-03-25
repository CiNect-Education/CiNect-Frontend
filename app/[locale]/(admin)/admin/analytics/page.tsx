"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Download, FileDown, Calendar } from "lucide-react";
import {
  useAdminAnalyticsRevenue,
  useAdminAnalyticsForecast,
  useAdminAnalyticsOccupancy,
  useAdminReportMovies,
  useAdminAnalyticsCustomerSegments,
  useAdminAnalyticsPeakHours,
} from "@/hooks/queries/use-admin";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { format } from "date-fns";

type DateRange = "7d" | "30d" | "90d" | "custom";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function toArray<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown };
  const arr = d.data;
  return Array.isArray(arr) ? arr : [];
}

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin");
  const [range, setRange] = useState<DateRange>("30d");
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const params = useMemo(() => {
    if (range === "custom") {
      return { from: dateFrom, to: dateTo };
    }
    return { range };
  }, [range, dateFrom, dateTo]);

  const { data: revenueRes } = useAdminAnalyticsRevenue(params);
  const { data: forecastRes } = useAdminAnalyticsForecast(params);
  const { data: occupancyRes } = useAdminAnalyticsOccupancy(params);
  const { data: moviesRes } = useAdminReportMovies(params);
  const { data: segmentsRes } = useAdminAnalyticsCustomerSegments();
  const { data: peakHoursRes } = useAdminAnalyticsPeakHours();

  const revenueData = toArray<{ date: string; revenue: number; predicted?: boolean }>(
    revenueRes?.data ?? revenueRes
  );
  const forecastData = toArray<{ date: string; revenue: number }>(forecastRes?.data ?? forecastRes);
  const occupancyData = toArray<{
    cinemaId: string;
    cinemaName: string;
    date: string;
    occupancy: number;
  }>(occupancyRes?.data ?? occupancyRes);
  const moviesData = toArray<{
    movieId: string;
    movieTitle: string;
    revenue: number;
    bookings: number;
    occupancy?: number;
  }>(moviesRes?.data ?? moviesRes);
  const segmentsData = toArray<{ segment: string; count: number; percentage: number }>(
    segmentsRes?.data ?? segmentsRes
  );
  const peakHoursData = toArray<{ hour: number; bookings: number }>(
    peakHoursRes?.data ?? peakHoursRes
  );

  const mergedRevenueChart = useMemo(() => {
    const byDate = new Map<string, { date: string; revenue: number; forecast?: number }>();
    revenueData.forEach((r) => {
      byDate.set(r.date, { date: r.date, revenue: r.revenue });
    });
    forecastData.forEach((f) => {
      const existing = byDate.get(f.date);
      if (existing) existing.forecast = f.revenue;
      else byDate.set(f.date, { date: f.date, revenue: 0, forecast: f.revenue });
    });
    return Array.from(byDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [revenueData, forecastData]);

  const occupancyByCinemaDate = useMemo(() => {
    const map = new Map<string, number>();
    occupancyData.forEach((o) => {
      const key = `${o.cinemaName}|${o.date}`;
      map.set(key, o.occupancy);
    });
    return map;
  }, [occupancyData]);

  const occupancyDates = useMemo(
    () => [...new Set(occupancyData.map((o) => o.date))].sort(),
    [occupancyData]
  );
  const occupancyCinemas = useMemo(
    () => [...new Set(occupancyData.map((o) => o.cinemaName))].sort(),
    [occupancyData]
  );

  const peakHoursChartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, bookings: 0 }));
    peakHoursData.forEach((p) => {
      const idx = p.hour >= 0 && p.hour < 24 ? p.hour : 0;
      hours[idx].bookings = p.bookings;
    });
    return hours;
  }, [peakHoursData]);

  const exportRevenueCSV = () =>
    exportToCSV(
      revenueData.map((r) => ({ date: r.date, revenue: r.revenue })),
      `revenue-${range}-${dateFrom}-${dateTo}`
    );
  const exportForecastCSV = () =>
    exportToCSV(forecastData, `forecast-${range}-${dateFrom}-${dateTo}`);
  const exportOccupancyCSV = () =>
    exportToCSV(occupancyData, `occupancy-${range}-${dateFrom}-${dateTo}`);
  const exportMoviesCSV = () =>
    exportToCSV(
      moviesData.map((m) => ({
        movieId: m.movieId,
        movieTitle: m.movieTitle,
        revenue: m.revenue,
        bookings: m.bookings,
        occupancy: m.occupancy != null ? (m.occupancy * 100).toFixed(1) + "%" : null,
      })),
      `movies-${range}-${dateFrom}-${dateTo}`
    );
  const exportSegmentsCSV = () => exportToCSV(segmentsData, "customer-segments");
  const exportPeakHoursCSV = () =>
    exportToCSV(
      peakHoursChartData.map((p) => ({ hour: `${p.hour}:00`, bookings: p.bookings })),
      "peak-hours"
    );

  return (
    <AdminPageShell
      title={t("analytics") ?? "Analytics"}
      description="Enterprise analytics dashboard for revenue, occupancy, and customer insights."
      breadcrumbs={[
        { label: t("title"), href: "/admin" },
        { label: t("analytics") ?? "Analytics" },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "ghost"}
                size="sm"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
            <Button
              variant={range === "custom" ? "default" : "ghost"}
              size="sm"
              onClick={() => setRange("custom")}
            >
              Custom
            </Button>
          </div>
          {range === "custom" && (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Revenue Trend */}
        <Card id="revenue-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportRevenueCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF("revenue-section", "revenue-report")}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 && forecastData.length === 0 ? (
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                No revenue data for this period
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedRevenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MM/dd")} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip
                      formatter={(value) => (value as number).toLocaleString()}
                      labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                      name="Revenue"
                    />
                    {forecastData.length > 0 && (
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Forecast"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forecast Chart */}
        <Card id="forecast-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Forecast</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportForecastCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF("forecast-section", "forecast-report")}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {forecastData.length === 0 ? (
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                No forecast data for this period
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MM/dd")} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip
                      formatter={(value) => (value as number).toLocaleString()}
                      labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Predicted Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Occupancy Heatmap (Treemap) */}
          <Card id="occupancy-section">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Occupancy by Cinema & Date</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportOccupancyCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF("occupancy-section", "occupancy-report")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {occupancyData.length === 0 ? (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                  No occupancy data for this period
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border-b p-2 text-left">Cinema</th>
                        {occupancyDates.slice(0, 14).map((d) => (
                          <th key={d} className="text-muted-foreground border-b p-2 text-center">
                            {format(new Date(d), "MM/dd")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyCinemas.map((cinema) => (
                        <tr key={cinema}>
                          <td className="border-b p-2 font-medium">{cinema}</td>
                          {occupancyDates.slice(0, 14).map((d) => {
                            const occ = occupancyByCinemaDate.get(`${cinema}|${d}`) ?? 0;
                            const pct = Math.round(occ * 100);
                            const bg =
                              pct >= 80
                                ? "bg-green-600/80"
                                : pct >= 50
                                  ? "bg-green-500/50"
                                  : pct >= 25
                                    ? "bg-yellow-500/50"
                                    : "bg-muted";
                            return (
                              <td key={d} className="border-b p-2 text-center">
                                <span
                                  className={`inline-block min-w-[2rem] rounded px-1 py-0.5 ${bg}`}
                                  title={`${pct}%`}
                                >
                                  {pct}%
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Segmentation */}
          <Card id="segments-section">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Segmentation</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportSegmentsCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF("segments-section", "customer-segments")}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {segmentsData.length === 0 ? (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                  No segmentation data available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentsData.map((s, i) => ({
                          ...s,
                          fill: PIE_COLORS[i % PIE_COLORS.length],
                        }))}
                        dataKey="count"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      />
                      <Tooltip
                        formatter={(value, _name, props) => [
                          value,
                          `${((props.payload as { percentage?: number }).percentage ?? 0).toFixed(1)}%`,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Movies */}
        <Card id="movies-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing Movies</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportMoviesCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF("movies-section", "movies-report")}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {moviesData.length === 0 ? (
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                No movie data for this period
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moviesData.slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
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
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card id="peak-hours-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Peak Booking Hours</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPeakHoursCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF("peak-hours-section", "peak-hours")}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {peakHoursChartData.every((p) => p.bookings === 0) ? (
              <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
                No peak hours data available
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip
                      formatter={(value) => [value, "Bookings"]}
                      labelFormatter={(h) => `${h}:00`}
                    />
                    <Bar dataKey="bookings" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
