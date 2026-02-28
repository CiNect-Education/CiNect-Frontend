import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { membershipTierSchema, membershipProfileSchema } from "@/lib/schemas/common";
import { couponSchema } from "@/lib/schemas/common";
import type { MembershipTier, MembershipProfile, Coupon } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useMembershipTiers() {
  const tiersSchema = z
    .array(membershipTierSchema)
    // Some backends may return an empty object when no tiers configured
    .or(z.object({}).transform(() => [] as MembershipTier[]));

  return useApiQuery<MembershipTier[]>(["membership-tiers"], "/membership/tiers", undefined, {
    schema: tiersSchema,
  });
}

export function useMembershipProfile() {
  return useApiQuery<MembershipProfile>(
    ["membership", "profile"],
    "/membership/profile",
    undefined,
    { schema: membershipProfileSchema }
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
