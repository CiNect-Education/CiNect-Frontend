import { z } from "zod";

export const refundEligibilitySchema = z.object({
  eligible: z.boolean(),
  reasonCode: z.string(),
  deadlineHours: z.number(),
  deadlineAt: z.string().optional(),
  showtimeAt: z.string().optional(),
  refundAmount: z.number().optional(),
  monthlyRefundsUsed: z.number().optional(),
  monthlyRefundsLimit: z.number().optional(),
  allowedMethods: z.array(z.enum(["STORE_CREDIT", "ORIGINAL_PAYMENT"])),
});

export type RefundEligibility = z.infer<typeof refundEligibilitySchema>;

export const bookingRefundSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  amount: z.number(),
  refundMethod: z.enum(["STORE_CREDIT", "ORIGINAL_PAYMENT"]),
  storeCreditCode: z.string().optional(),
  pointsRestored: z.number(),
  giftCardRestored: z.string().optional(),
  reason: z.string().optional(),
  createdAt: z.string(),
  movieTitle: z.string().optional(),
  cinemaName: z.string().optional(),
  showtime: z.string().optional(),
});

export type BookingRefund = z.infer<typeof bookingRefundSchema>;

export const refundResponseSchema = z.object({
  message: z.string(),
  refund: z.object({
    id: z.string(),
    bookingId: z.string(),
    amount: z.number(),
    refundMethod: z.enum(["STORE_CREDIT", "ORIGINAL_PAYMENT"]),
    storeCreditCode: z.string().optional(),
    pointsRestored: z.number(),
    giftCardRestored: z.string().optional(),
    createdAt: z.string(),
  }),
});

export type RefundResponse = z.infer<typeof refundResponseSchema>;
