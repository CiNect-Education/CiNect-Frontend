"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Users,
  Ticket,
  Film,
  DollarSign,
  Building2,
  TrendingUp,
} from "lucide-react";
import {
  useAdminKPIs,
  useAdminRevenue,
  useAdminOccupancy,
  useAdminRecentBookings,
} from "@/hooks/queries/use-admin";
import { format } from "date-fns";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const [kpiRange] = useState("7d");
  const [chartRange] = useState("30d");

  const { data: kpisRes, isLoading: kpisLoading } = useAdminKPIs(kpiRange);
  const { data: revenueRes, isLoading: revenueLoading } =
    useAdminRevenue(chartRange);
  const { data: occupancyRes, isLoading: occupancyLoading } =
    useAdminOccupancy(chartRange);
  const { data: bookingsRes, isLoading: bookingsLoading } =
    useAdminRecentBookings(10);

  const kpis = kpisRes?.data;
  const revenueData = revenueRes?.data ?? [];
  const occupancyData = occupancyRes?.data ?? [];
  const recentBookings = bookingsRes?.data ?? [];

  const stats = [
    {
      label: t("totalRevenue"),
      value: kpisLoading ? "--" : (kpis?.totalRevenue ?? 0).toLocaleString(),
      icon: DollarSign,
    },
    {
      label: t("totalBookings"),
      value: kpisLoading ? "--" : (kpis?.totalBookings ?? 0).toLocaleString(),
      icon: Ticket,
    },
    {
      label: t("totalMovies"),
      value: kpisLoading ? "--" : (kpis?.totalMovies ?? 0).toString(),
      icon: Film,
    },
    {
      label: t("cinemas"),
      value: kpisLoading ? "--" : (kpis?.totalCinemas ?? 0).toString(),
      icon: Building2,
    },
    {
      label: "Occupancy",
      value: kpisLoading ? "--" : `${((kpis?.occupancyRate ?? 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("dashboard")}
        description="Overview of your cinema business performance."
      />

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  {"sublabel" in stat && (stat as any).sublabel && (
                    <p className="text-xs text-muted-foreground">
                      {(stat as any).sublabel}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-primary/10 p-2.5">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenueData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No revenue data
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) =>
                        format(new Date(v), "MM/dd")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        (value as number).toLocaleString()
                      }
                      labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {occupancyLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : occupancyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No occupancy data
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) =>
                        format(new Date(v), "MM/dd")
                      }
                    />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      formatter={(value) =>
                        `${(Number(value) * 100).toFixed(1)}%`
                      }
                      labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                    />
                    <Bar
                      dataKey="occupancy"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-1 h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No recent bookings
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{b.movieTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.cinemaName} · {format(new Date(b.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {b.finalAmount.toLocaleString()} ₫
                      </p>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${
                          b.status === "CONFIRMED"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : b.status === "CANCELLED"
                            ? "bg-red-500/20 text-red-700 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
