import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { membershipProfileSchema } from "@/lib/schemas/common";
import { couponSchema } from "@/lib/schemas/common";
import type { MembershipTier, MembershipProfile, Coupon } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useMembershipTiers() {
  // Some backends return an envelope, others may return a plain array.
  // To avoid noisy console warnings when the shape drifts, we skip strict zod validation here.
  return useApiQuery<MembershipTier[]>(["membership-tiers"], "/membership/tiers");
}

export function useMembershipProfile() {
  return useApiQuery<MembershipProfile | null>(
    ["membership", "profile"],
    "/membership/profile",
    undefined,
    {
      schema: membershipProfileSchema,
      retry: false,
    }
  );
}

export function usePointsHistory(params?: QueryParams) {
  return useApiQuery<
    Array<{
      id: string;
      type: string;
      points: number;
      description: string;
      createdAt: string;
    }>
  >(["points-history", JSON.stringify(params)], "/me/points/history", params);
}

export function useMyCoupons() {
  return useApiQuery<Coupon[]>(["my-coupons"], "/me/coupons", undefined, {
    schema: z.array(couponSchema),
  });
}

export function useRedeemCoupon() {
  return useApiMutation<void, { couponId: string }>("post", "/me/coupons/redeem", {
    successMessage: "Coupon redeemed!",
    invalidateKeys: [["my-coupons"]],
  });
}

export function useMembershipEvents() {
  return useApiQuery<
    Array<{
      id: string;
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      type: string;
    }>
  >(["membership-events"], "/membership/events");
}

export type DailyCheckinStatus = {
  eligibleToday: boolean;
  rewardPoints: number;
  nextRewardPoints?: number;
  streak: number;
  nextStreak: number;
  currentPoints: number;
  totalPoints: number;
  lastCheckinAt?: string;
  nextEligibleAt?: string;
};

export function useDailyCheckinStatus(enabled = true) {
  return useApiQuery<DailyCheckinStatus>(["membership", "daily-checkin", "status"], "/membership/daily-checkin/status", undefined, {
    enabled,
    retry: false,
  });
}

export function useClaimDailyCheckin() {
  return useApiMutation<
    {
      success: boolean;
      claimedAt: string;
      rewardPoints: number;
      streak: number;
      currentPoints: number;
      totalPoints: number;
    },
    void
  >("post", "/membership/daily-checkin/claim", {
    successMessage: "Daily check-in claimed!",
    invalidateKeys: [["membership", "profile"], ["points-history"], ["membership", "daily-checkin", "status"]],
  });
}
