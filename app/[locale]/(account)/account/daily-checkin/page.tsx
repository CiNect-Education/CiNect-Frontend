"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useClaimDailyCheckin, useDailyCheckinStatus, usePointsHistory } from "@/hooks/queries/use-membership";
import { CalendarCheck2, History, Sparkles, CircleHelp } from "lucide-react";
import { toast } from "sonner";

export default function DailyCheckinPage() {
  const t = useTranslations("account");
  const statusQuery = useDailyCheckinStatus(true);
  const claimMutation = useClaimDailyCheckin();
  // Keep params omitted for cross-backend compatibility (Spring uses 0-based page by default).
  const pointsQuery = usePointsHistory();

  const status = statusQuery.data?.data;
  const canClaim = status?.eligibleToday === true;
  const historyItems = useMemo(() => {
    const rows = (pointsQuery.data?.data ?? []) as Array<{
      id: string;
      type: string;
      points: number;
      balance?: number;
      description?: string;
      createdAt: string;
    }>;
    return rows;
  }, [pointsQuery.data]);

  const onClaim = () => {
    if (!canClaim) return;
    claimMutation.mutate(undefined, {
      onSuccess: (res) => {
        const reward = res.data?.rewardPoints ?? 0;
        toast.success(t("dailyCheckinClaimedToast", { points: reward }));
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : t("dailyCheckinClaimFailed");
        toast.error(message);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title={t("dailyCheckinTitle")}
        description={t("dailyCheckinDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("dailyCheckinTitle") }]}
      />

      {statusQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : statusQuery.error ? (
        <ApiErrorState error={statusQuery.error} onRetry={statusQuery.refetch} />
      ) : (
        <div className="space-y-6">
          <Card className="cinect-glass border-primary/25 border shadow-[0_0_0_1px_rgba(255,196,0,.08)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarCheck2 className="text-primary h-5 w-5" />
                {t("dailyCheckinCardTitle")}
              </CardTitle>
              <CardDescription>{t("dailyCheckinCardDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="from-primary/12 to-primary/5 rounded-lg border bg-gradient-to-br p-3">
                  <div className="text-muted-foreground text-xs">{t("dailyCheckinCurrentStreak")}</div>
                  <div className="mt-1 text-xl font-semibold">{status?.streak ?? 0}</div>
                </div>
                <div className="from-primary/12 to-primary/5 rounded-lg border bg-gradient-to-br p-3">
                  <div className="text-muted-foreground text-xs">{t("dailyCheckinTodayReward")}</div>
                  <div className="mt-1 text-xl font-semibold">+{status?.rewardPoints ?? 0}</div>
                </div>
                <div className="from-primary/12 to-primary/5 rounded-lg border bg-gradient-to-br p-3">
                  <div className="text-muted-foreground text-xs">{t("dailyCheckinAvailablePoints")}</div>
                  <div className="mt-1 text-xl font-semibold">{status?.currentPoints ?? 0}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={status?.eligibleToday ? "default" : "secondary"}>
                  {status?.eligibleToday ? t("dailyCheckinReady") : t("dailyCheckinAlreadyDone")}
                </Badge>
                {status?.nextEligibleAt ? (
                  <span className="text-muted-foreground text-xs">
                    {t("dailyCheckinNextEligible")}: {format(new Date(status.nextEligibleAt), "PPp")}
                  </span>
                ) : null}
              </div>

              {canClaim ? (
                <Button onClick={onClaim} disabled={claimMutation.isPending} className="min-w-56">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {claimMutation.isPending ? t("dailyCheckinClaiming") : t("dailyCheckinClaimNow")}
                </Button>
              ) : (
                <Button variant="outline" disabled className="min-w-56">
                  {t("dailyCheckinAlreadyDone")}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="cinect-glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleHelp className="h-5 w-5" />
                {t("dailyCheckinGuideTitle")}
              </CardTitle>
              <CardDescription>{t("dailyCheckinGuideDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{t("dailyCheckinGuideRule1Title")}</div>
                <div className="text-muted-foreground mt-1">{t("dailyCheckinGuideRule1Desc")}</div>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{t("dailyCheckinGuideRule2Title")}</div>
                <div className="text-muted-foreground mt-1">{t("dailyCheckinGuideRule2Desc")}</div>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{t("dailyCheckinGuideRule3Title")}</div>
                <div className="text-muted-foreground mt-1">
                  {t("dailyCheckinGuideRule3Desc", { points: status?.nextRewardPoints ?? status?.rewardPoints ?? 0 })}
                </div>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{t("dailyCheckinGuideRule4Title")}</div>
                <div className="text-muted-foreground mt-1">{t("dailyCheckinGuideRule4Desc")}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cinect-glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t("dailyCheckinHistoryTitle")}
              </CardTitle>
              <CardDescription>{t("dailyCheckinHistoryDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {pointsQuery.isLoading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : historyItems.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">{t("noPointsActivity")}</p>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((item) => {
                    const isPositive = item.points > 0;
                    const isCheckin = (item.description ?? "").toLowerCase().includes("daily check-in");
                    return (
                      <div
                        key={item.id}
                        className="hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {item.description || (isPositive ? t("dailyCheckinPointsAdded") : t("dailyCheckinPointsSpent"))}
                            {isCheckin ? (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                Daily
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-muted-foreground text-xs">{format(new Date(item.createdAt), "PPp")}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}
                            {item.points}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {t("dailyCheckinBalanceLabel")}: {item.balance ?? 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

