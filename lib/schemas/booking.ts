import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .optional()
    .nullable()
    .transform((v) => v ?? undefined);

export const bookingItemSchema = z.object({
  seatId: z.string(),
  row: z.string(),
  number: z.number(),
  type: z.enum(["STANDARD", "VIP", "COUPLE", "DISABLED"]),
  price: z.number(),
});

export const snackItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  imageUrl: n(z.string()),
});

export const paymentSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  method: z.enum(["CARD", "MOMO", "ZALOPAY", "VNPAY", "BANK_TRANSFER", "CASH"]),
  status: z.enum(["PENDING", "PAID", "REFUNDED"]),
  amount: z.number(),
  transactionId: n(z.string()),
  paidAt: n(z.string()),
  createdAt: z.string(),
});

export const bookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  showtimeId: z.string(),
  seats: z.array(bookingItemSchema),
  snacks: z.array(snackItemSchema),
  totalAmount: z.number(),
  discountAmount: z.number(),
  finalAmount: z.number(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  payment: n(paymentSchema),
  promotionCode: n(z.string()),
  movieTitle: z.string(),
  moviePosterUrl: n(z.string()),
  cinemaName: z.string(),
  roomName: z.string(),
  showtime: z.string(),
  format: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
  qrCode: n(z.string()),
  expiresAt: n(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const pricingRuleSchema = z.object({
  id: z.string(),
  seatType: z.enum(["STANDARD", "VIP", "COUPLE", "DISABLED"]),
  dayType: z.enum(["WEEKDAY", "WEEKEND", "HOLIDAY"]),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]),
  roomFormat: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
  price: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Create booking request ────────────────────────────────────────

export const createBookingSchema = z.object({
  showtimeId: z.string().min(1, "Showtime is required"),
  seatIds: z.array(z.string()).min(1, "Select at least one seat"),
  snacks: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().min(1),
      })
    )
    .optional(),
  promotionCode: z.string().optional(),
  paymentMethod: z.enum(["CARD", "MOMO", "ZALOPAY", "VNPAY", "BANK_TRANSFER", "CASH"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
