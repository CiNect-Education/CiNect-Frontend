import { useApiQuery } from "@/hooks/use-api-query";
import { promotionSchema, couponSchema } from "@/lib/schemas/common";
import type { Promotion, Coupon } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function usePromotions(params?: QueryParams) {
  return useApiQuery<Promotion[]>(
    ["promotions", JSON.stringify(params)],
    "/promotions",
    params,
    { schema: z.array(promotionSchema) }
  );
}

export function useActivePromotions(limit = 8) {
  return useApiQuery<Promotion[]>(
    ["promotions", "active", String(limit)],
    "/promotions/active",
    { limit },
    { schema: z.array(promotionSchema) }
  );
}

export function useCoupons() {
  return useApiQuery<Coupon[]>(["coupons"], "/coupons", undefined, {
    schema: z.array(couponSchema),
  });
}
