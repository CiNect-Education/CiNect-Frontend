"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ChartRow = { date: string; revenue?: number; occupancy?: number };

type AdminDashboardChartsProps = {
  revenueData: ChartRow[];
  occupancyData: ChartRow[];
  revenueLoading: boolean;
  occupancyLoading: boolean;
};

export function AdminDashboardCharts({
  revenueData,
  occupancyData,
  revenueLoading,
  occupancyLoading,
}: AdminDashboardChartsProps) {
  const t = useTranslations("admin");

  return (
    <>
      <Card className="cinect-admin-panel">
        <CardHeader>
          <CardTitle className="text-lg">{t("revenue")}</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : revenueData.length === 0 ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("dashNoRevenueData")}
            </div>
          ) : (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height={256} debounce={32}>
                <LineChart data={revenueData}>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="cinect-admin-panel">
        <CardHeader>
          <CardTitle className="text-lg">{t("occupancy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {occupancyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : occupancyData.length === 0 ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("dashNoOccupancyData")}
            </div>
          ) : (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height={256} debounce={32}>
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MM/dd")} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                    labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                  />
                  <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
