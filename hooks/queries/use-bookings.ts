import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { bookingSchema, pricingRuleSchema } from "@/lib/schemas/booking";
import type { Booking, PricingRule } from "@/types/domain";
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

export function usePricingRules(params?: QueryParams) {
  return useApiQuery<PricingRule[]>(["pricing-rules", JSON.stringify(params)], "/pricing", params, {
    schema: z.array(pricingRuleSchema),
  });
}
