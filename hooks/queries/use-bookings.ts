import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { bookingSchema, pricingRuleSchema } from "@/lib/schemas/booking";
import {
  bookingRefundSchema,
  refundEligibilitySchema,
  refundResponseSchema,
} from "@/lib/schemas/booking-refund";
import type { Booking, PricingRule } from "@/types/domain";
import type { BookingRefund, RefundEligibility, RefundResponse } from "@/lib/schemas/booking-refund";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useBookings(params?: QueryParams) {
  return useApiQuery<Booking[]>(["bookings", JSON.stringify(params)], "/bookings", params, {
    schema: z.array(bookingSchema),
  });
}

export function useBooking(id: string) {
  return useApiQuery<Booking>(["booking", id], `/bookings/${id}`, undefined, {
    schema: bookingSchema,
    enabled: !!id,
  });
}

export function useCreateBooking() {
  return useApiMutation<Booking, CreateBookingInput>("post", "/bookings", {
    schema: bookingSchema,
    successMessage: "Booking confirmed!",
    invalidateKeys: [["bookings"]],
  });
}

export function useCancelBooking() {
  return useApiMutation<void, { id: string }>("post", (vars) => `/bookings/${vars.id}/cancel`, {
    successMessage: "Booking cancelled",
    invalidateKeys: [["bookings"]],
  });
}

export function useRefundEligibility(bookingId: string, enabled = true) {
  return useApiQuery<RefundEligibility>(
    ["refund-eligibility", bookingId],
    `/bookings/${bookingId}/refund-eligibility`,
    undefined,
    {
      schema: refundEligibilitySchema,
      enabled: !!bookingId && enabled,
    },
  );
}

export function useRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      method?: "STORE_CREDIT" | "ORIGINAL_PAYMENT";
      reasonCode: import("@/lib/refund-reasons").RefundReasonCode;
      reasonDetail?: string;
    }) => {
      const { id, method, reasonCode, reasonDetail } = vars;
      return apiClient.post<RefundResponse>(
        `/bookings/${id}/refund`,
        { method, reasonCode, reasonDetail },
        { schema: refundResponseSchema },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["refund-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["booking-refunds"] });
    },
    onError: (error: { toastMessage?: string }) => {
      toast.error(error.toastMessage ?? "Refund request failed");
    },
  });
}

export function useBookingRefunds(params?: QueryParams) {
  return useApiQuery<BookingRefund[]>(
    ["booking-refunds", JSON.stringify(params)],
    "/bookings/refunds",
    params,
    {
      schema: z.array(bookingRefundSchema),
    },
  );
}

export function usePricingRules(params?: QueryParams) {
  return useApiQuery<PricingRule[]>(["pricing-rules", JSON.stringify(params)], "/pricing", params, {
    schema: z.array(pricingRuleSchema),
  });
}
