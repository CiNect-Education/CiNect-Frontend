import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { giftCardSchema } from "@/lib/schemas/common";
import type { GiftCard } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useGiftCards(params?: QueryParams) {
  return useApiQuery<GiftCard[]>(
    ["gift-cards", JSON.stringify(params)],
    "/gift-cards",
    params,
    { schema: z.array(giftCardSchema) }
  );
}

export function useGiftCard(id: string) {
  return useApiQuery<GiftCard>(
    ["gift-card", id],
    `/gift-cards/${id}`,
    undefined,
    { schema: giftCardSchema, enabled: !!id }
  );
}

export function useMyGiftCards(params?: QueryParams) {
  return useApiQuery<GiftCard[]>(
    ["my-gift-cards", JSON.stringify(params)],
    "/me/gifts",
    params,
    { schema: z.array(giftCardSchema) }
  );
}

export function usePurchaseGiftCard() {
  return useApiMutation<GiftCard, { giftCardId: string; recipientEmail?: string; message?: string }>(
    "post",
    "/gift-cards/purchase",
    {
      schema: giftCardSchema,
      successMessage: "Gift card purchased!",
      invalidateKeys: [["gift-cards"]],
    }
  );
}
