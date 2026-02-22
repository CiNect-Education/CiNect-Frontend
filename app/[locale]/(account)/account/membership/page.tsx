"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import {
  useMembershipProfile,
  useMembershipTiers,
  usePointsHistory,
  useMyCoupons,
  useRedeemCoupon,
} from "@/hooks/queries/use-membership";
import {
  Crown,
  Star,
  Gift,
  Zap,
  TrendingUp,
  Calendar,
  Cake,
  Clock,
  Ticket,
  Copy,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";

export default function AccountMembershipPage() {
  const t = useTranslations("membership");
  const tCommon = useTranslations("common");

  const {
    data: profileRes,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useMembershipProfile();
  const { data: tiersRes } = useMembershipTiers();
  const { data: pointsRes } = usePointsHistory();
  const { data: couponsRes } = useMyCoupons();
  const redeemCoupon = useRedeemCoupon();

  const profile = profileRes?.data as import("@/types/domain").MembershipProfile | undefined;
  const tiers = (tiersRes?.data ?? []) as import("@/types/domain").MembershipTier[];
  const pointsHistory = (pointsRes?.data ?? []) as Array<{
    id: string;
    description: string;
    points: number;
    createdAt: string;
  }>;
  const coupons = (couponsRes?.data ?? []) as import("@/types/domain").Coupon[];

  if (profileLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="mb-6 h-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (profileError) {
    return <ApiErrorState error={profileError} onRetry={refetch} />;
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground">No membership data available</p>
            <Button className="mt-4" asChild>
              <a href="/membership">{t("joinNow")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTier = profile.tier; // MembershipTier object
  const nextTier = profile.nextTier; // MembershipTier object or undefined
  const progressToNext = nextTier
    ? ((profile.currentPoints - (currentTier.pointsRequired || 0)) /
        ((nextTier.pointsRequired || 1) - (currentTier.pointsRequired || 0))) *
      100
    : 100;

  const handleRedeemCoupon = (couponId: string) => {
    redeemCoupon.mutate({ couponId });
  };

  return (
    <div>
      <PageHeader title={t("title")} />

      <div className="flex flex-col gap-6">
        {/* Animated Tier Badge Card */}
        <Card className="border-primary/20 overflow-hidden">
          <div className="from-primary/10 via-primary/5 relative bg-gradient-to-br to-transparent p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* Animated Badge */}
              <div className="relative">
                <div className="animate-tier-glow from-primary to-primary/70 shadow-primary/30 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
                  <Crown className="text-primary-foreground h-12 w-12" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <Badge className="animate-tier-scale text-xs font-bold tracking-wider uppercase">
                    {currentTier?.name || "Member"}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{currentTier?.name || "Member"} Tier</h2>
                <p className="text-muted-foreground">
                  {profile.currentPoints.toLocaleString()} {t("points")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Member since {format(new Date(profile.memberSince), "MMMM yyyy")}
                </p>

                {/* Progress to next tier */}
                {nextTier && (
                  <div className="mt-4 max-w-md">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("progress")} to {nextTier.name}
                      </span>
                      <span className="font-medium">
                        {profile.currentPoints.toLocaleString()} /{" "}
                        {nextTier.pointsRequired.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={Math.min(progressToNext, 100)} className="h-3" />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {profile.pointsToNextTier?.toLocaleString()} points to {nextTier.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Discount badge */}
              {currentTier?.discountPercent && (
                <div className="bg-background/50 rounded-lg border p-4 text-center">
                  <p className="text-primary text-3xl font-bold">{currentTier.discountPercent}%</p>
                  <p className="text-muted-foreground text-xs">Discount</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="bg-primary/10 rounded-full p-3">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{profile.totalPoints.toLocaleString()}</div>
                <div className="text-muted-foreground text-sm">Total Points Earned</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-green-500/10 p-3">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{coupons.length}</div>
                <div className="text-muted-foreground text-sm">Active Coupons</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{profile.currentPoints.toLocaleString()}</div>
                <div className="text-muted-foreground text-sm">Available Points</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Birthday Gift Section */}
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50/50 to-transparent dark:border-pink-900 dark:from-pink-950/20">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-pink-100 p-3 dark:bg-pink-900/30">
              <Cake className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("birthdayGift")}</h3>
              <p className="text-muted-foreground text-sm">
                Enjoy special birthday perks and bonus points during your birthday month! Make sure
                your date of birth is set in your profile.
              </p>
            </div>
            <Gift className="h-8 w-8 text-pink-400" />
          </CardContent>
        </Card>

        {/* Coupons with Countdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5" />
              {t("coupons")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {coupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && isPast(new Date(coupon.expiresAt));
                  const timeLeft = coupon.expiresAt
                    ? formatDistanceToNow(new Date(coupon.expiresAt), { addSuffix: true })
                    : null;

                  return (
                    <div
                      key={coupon.id}
                      className={`rounded-lg border p-4 ${
                        isExpired
                          ? "border-muted bg-muted/30 opacity-60"
                          : "border-primary/30 bg-primary/5 border-dashed"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-primary font-mono font-bold">{coupon.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast.success("Code copied!");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.discountValue}% off`
                          : `${coupon.discountValue.toLocaleString()}đ off`}
                        {coupon.minPurchase ? ` (min ${coupon.minPurchase.toLocaleString()}đ)` : ""}
                      </p>

                      {/* Countdown */}
                      {timeLeft && !isExpired && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-orange-600 dark:text-orange-400">
                            Expires {timeLeft}
                          </span>
                        </div>
                      )}

                      {isExpired && (
                        <Badge variant="destructive" className="mt-2 text-xs">
                          Expired
                        </Badge>
                      )}

                      {!isExpired && coupon.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleRedeemCoupon(coupon.id)}
                          disabled={redeemCoupon.isPending}
                        >
                          {t("redeemCoupon")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center">No coupons available</p>
            )}
          </CardContent>
        </Card>

        {/* Points History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              {t("pointsHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pointsHistory.length > 0 ? (
              <div className="space-y-3">
                {pointsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-muted-foreground text-sm">
                        {format(new Date(item.createdAt), "PPp")}
                      </div>
                    </div>
                    <div
                      className={`font-bold ${item.points > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {item.points > 0 ? "+" : ""}
                      {item.points.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center">No points activity yet</p>
            )}
          </CardContent>
        </Card>

        {/* Tier Benefits */}
        {currentTier?.benefits && currentTier.benefits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("benefits")}</CardTitle>
              <CardDescription>Your {currentTier.name} tier benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {currentTier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="bg-primary h-2 w-2 rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
