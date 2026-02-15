"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMembershipTiers, useMembershipEvents } from "@/hooks/queries/use-membership";
import { Crown, Star, Gem, Zap, Check, Gift, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";

const TIER_ICONS = {
  MEMBER: Star,
  SILVER: Zap,
  GOLD: Crown,
  DIAMOND: Gem,
};

const TIER_COLORS = {
  MEMBER: "text-zinc-400 bg-zinc-400/10",
  SILVER: "text-slate-300 bg-slate-300/10",
  GOLD: "text-primary bg-primary/10",
  DIAMOND: "text-sky-400 bg-sky-400/10",
};

function toArray<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown };
  const arr = d.data;
  return Array.isArray(arr) ? arr : [];
}

export default function MembershipPage() {
  const t = useTranslations("membership");
  const { data: tiersRes, isLoading, error, refetch } = useMembershipTiers();
  const { data: eventsRes } = useMembershipEvents();

  const tiers = toArray<
    {
      id: string;
      name: string;
      displayName?: string;
      minPoints?: number;
      maxPoints?: number;
      pointsRequired?: number;
      benefits?: string[];
      discount?: number;
      discountPercent?: number;
      level?: number;
    }
  >(tiersRes?.data ?? tiersRes) ?? [];
  const events = toArray<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: string;
  }>(eventsRes?.data ?? eventsRes) ?? [];

  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => {
      const pa = a.minPoints ?? a.pointsRequired ?? 0;
      const pb = b.minPoints ?? b.pointsRequired ?? 0;
      return pa - pb;
    });
  }, [tiers]);

  const tiersWithRange = useMemo(() => {
    return sortedTiers.map((tier, i) => {
      const prev = sortedTiers[i - 1];
      const min = tier.minPoints ?? prev?.maxPoints ?? prev?.pointsRequired ?? 0;
      const max = tier.maxPoints ?? tier.pointsRequired ?? min + 1000;
      const discount = tier.discount ?? tier.discountPercent ?? 0;
      const displayName = tier.displayName ?? tier.name;
      return { ...tier, minPoints: min, maxPoints: max, discount, displayName };
    });
  }, [sortedTiers]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") ?? "Membership Tiers"}
        description="Choose the perfect membership tier and unlock exclusive cinema benefits"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Membership" },
        ]}
      />

      {/* Animated Tier Badges - Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {tiersWithRange.map((tier) => {
          const Icon = TIER_ICONS[tier.name as keyof typeof TIER_ICONS] || Star;
          const colorClasses = TIER_COLORS[tier.name as keyof typeof TIER_COLORS] || TIER_COLORS.MEMBER;

          return (
            <Card
              key={tier.id}
              className="relative border-border/50 hover:border-primary/50 transition-colors overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div
                  className={`mb-3 inline-flex rounded-full p-2.5 animate-tier-glow ${colorClasses}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{tier.displayName}</CardTitle>
                <CardDescription>
                  {tier.minPoints?.toLocaleString()} - {tier.maxPoints?.toLocaleString()} points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tier.benefits && tier.benefits.length > 0 ? (
                    <ul className="space-y-2">
                      {tier.benefits.slice(0, 3).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No benefits listed</p>
                  )}

                  {tier.discount > 0 && (
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{tier.discount}%</div>
                      <div className="text-xs text-muted-foreground">Ticket Discount</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Comparison Table */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Tier Comparison</CardTitle>
          <CardDescription>Compare benefits across all membership tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Points Required</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead>Benefits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiersWithRange.map((tier) => {
                  const Icon = TIER_ICONS[tier.name as keyof typeof TIER_ICONS] || Star;
                  const colorClasses = TIER_COLORS[tier.name as keyof typeof TIER_COLORS] || TIER_COLORS.MEMBER;
                  return (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-flex rounded-full p-2 ${colorClasses} animate-tier-scale`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{tier.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {tier.minPoints?.toLocaleString()} - {tier.maxPoints?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {tier.discount}%
                      </TableCell>
                      <TableCell>
                        {tier.benefits && tier.benefits.length > 0 ? (
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {tier.benefits.map((b, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-primary shrink-0" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Points Earning Rules */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
          <CardDescription>Points earning rules and bonus opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Earn 1 point for every $1 spent on tickets</p>
          <p>• Double points on your birthday month</p>
          <p>• Bonus points for early bird bookings (weekday morning shows)</p>
          <p>• Refer a friend and get 50 bonus points when they make their first booking</p>
          <div className="pt-4">
            <Link href="/register">
              <Button>Join Now - It&apos;s Free!</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Member Events Section */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Member Events
            </CardTitle>
            <CardDescription>Exclusive events and promotions for members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((evt) => (
                <Card key={evt.id} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{evt.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {evt.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(evt.startDate), "MMM d")} -{" "}
                          {format(new Date(evt.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
