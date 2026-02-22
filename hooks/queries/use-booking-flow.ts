import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Seat, Booking, SnackItem, Promotion } from "@/types/domain";
import { toast } from "sonner";

// Get showtime seats
export function useShowtimeSeats(showtimeId: string) {
  return useQuery({
    queryKey: ["showtimes", showtimeId, "seats"],
    queryFn: () => apiClient.get<Seat[]>(`/showtimes/${showtimeId}/seats`),
    refetchInterval: 10000, // Poll every 10s
  });
}

// Hold seats
interface HoldSeatsPayload {
  showtimeId: string;
  seatIds: string[];
}

interface HoldResponse {
  holdId: string;
  expiresAt: string;
}

export function useHoldSeats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HoldSeatsPayload) => apiClient.post<HoldResponse>("/holds", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["showtimes", variables.showtimeId, "seats"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to hold seats");
    },
  });
}

// Release hold
export function useReleaseHold() {
  return useMutation({
    mutationFn: (holdId: string) => apiClient.delete(`/holds/${holdId}`),
  });
}

// Get hold details (for checkout)
export interface HoldDetails {
  holdId: string;
  showtimeId: string;
  expiresAt: string;
  seats: Array<{ id: string; row: string; number: number; type: string; price?: number }>;
  showtime?: {
    movieTitle?: string;
    cinemaName?: string;
    roomName?: string;
    startTime?: string;
    format?: string;
    cinemaId?: string;
  };
}

export function useHold(holdId?: string) {
  return useQuery({
    queryKey: ["holds", holdId],
    queryFn: () => apiClient.get<HoldDetails>(`/holds/${holdId}`),
    enabled: !!holdId,
  });
}

// Get snacks
export function useSnacks(cinemaId?: string) {
  return useQuery({
    queryKey: ["snacks", cinemaId],
    queryFn: () => apiClient.get<SnackItem[]>("/snacks", cinemaId ? { cinemaId } : undefined),
  });
}

// Create booking
interface CreateBookingPayload {
  holdId: string;
  promoCode?: string;
  snacks?: Array<{ snackId: string; quantity: number }>;
  usePoints?: number;
  giftCardCode?: string;
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => apiClient.post<Booking>("/bookings", data),
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create booking");
    },
  });
}

// Get booking
export function useBooking(bookingId?: string) {
  return useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => apiClient.get<Booking>(`/bookings/${bookingId}`),
    enabled: !!bookingId,
  });
}

// Apply promo code
export function useApplyPromo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, promoCode }: { bookingId: string; promoCode: string }) =>
      apiClient.post(`/bookings/${bookingId}/apply-promo`, { promoCode }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
      toast.success("Promo code applied!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Invalid promo code");
    },
  });
}

// Confirm booking
export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => apiClient.post(`/bookings/${bookingId}/confirm`),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => apiClient.post(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking cancelled");
    },
  });
}

// Eligible promotions for a booking
export function useEligiblePromotions(bookingId?: string) {
  return useQuery({
    queryKey: ["promotions", "eligible", bookingId],
    queryFn: () =>
      apiClient.get<Promotion[]>(`/promotions/eligible`, { bookingId: bookingId ?? "" }),
    enabled: !!bookingId,
  });
}

// Apply membership points
export function useApplyPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, points }: { bookingId: string; points: number }) =>
      apiClient.post(`/bookings/${bookingId}/apply-points`, { points }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
      toast.success("Points applied!");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Failed to apply points";
      toast.error(msg);
    },
  });
}

// Initiate payment
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (data: { bookingId: string; method: string; amount: number }) =>
      apiClient.post<{ paymentId: string; paymentUrl?: string }>("/payments/initiate", data),
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(msg);
    },
  });
}

// Get payment status
export function usePaymentStatus(paymentId?: string) {
  return useQuery({
    queryKey: ["payments", paymentId, "status"],
    queryFn: () =>
      apiClient.get<{
        status: string;
        transactionId?: string;
        errorReason?: string;
      }>(`/payments/${paymentId}/status`),
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "SUCCESS" || status === "FAILED") return false;
      return 3000; // Poll every 3s while pending
    },
  });
}

// Payment callback - get paymentId/bookingId from transactionId
export function usePaymentCallback(transactionId?: string) {
  return useQuery({
    queryKey: ["payments", "callback", transactionId],
    queryFn: () =>
      apiClient.get<{ paymentId: string; bookingId: string }>("/payments/callback", {
        transactionId: transactionId ?? "",
      }),
    enabled: !!transactionId,
  });
}

// Apply gift card
export function useApplyGiftCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, giftCardCode }: { bookingId: string; giftCardCode: string }) =>
      apiClient.post(`/bookings/${bookingId}/apply-gift-card`, { giftCardCode }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.bookingId] });
      toast.success("Gift card applied!");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Invalid gift card";
      toast.error(msg);
    },
  });
}
