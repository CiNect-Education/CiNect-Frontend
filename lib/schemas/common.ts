import { z } from "zod";

/** Accept null from API but normalize to undefined for TS types */
const nullish = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .optional()
    .nullable()
    .transform((v) => v ?? undefined);

export const promotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  code: nullish(z.string()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number(),
  minPurchase: nullish(z.number()),
  maxDiscount: nullish(z.number()),
  usageLimit: nullish(z.number()),
  usageCount: nullish(z.number()),
  startDate: z.string(),
  endDate: z.string(),
  imageUrl: nullish(z.string()),
  conditions: nullish(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]),
  createdAt: z.string(),
});

export const couponSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number(),
  minPurchase: nullish(z.number()),
  maxDiscount: nullish(z.number()),
  expiresAt: z.string(),
  status: z.enum(["ACTIVE", "USED", "EXPIRED"]),
  userId: nullish(z.string()),
});

export const newsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.enum(["REVIEWS", "TRAILERS", "PROMOTIONS", "GUIDES", "GENERAL"]),
  imageUrl: nullish(z.string()),
  author: z.string(),
  tags: nullish(z.array(z.string())),
  relatedArticleIds: nullish(z.array(z.string())),
  publishedAt: z.string(),
  createdAt: z.string(),
});

export const membershipTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  pointsRequired: z.number(),
  benefits: z.array(z.string()),
  discountPercent: z.number(),
  color: z.string(),
  icon: nullish(z.string()),
});

export const membershipProfileSchema = z.object({
  userId: z.string(),
  tier: membershipTierSchema,
  currentPoints: z.number(),
  totalPoints: z.number(),
  nextTier: nullish(membershipTierSchema),
  pointsToNextTier: nullish(z.number()),
  memberSince: z.string(),
  expiresAt: nullish(z.string()),
});

export const giftCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: nullish(z.string()),
  value: z.number(),
  price: z.number(),
  code: nullish(z.string()),
  recipientEmail: nullish(z.string()),
  message: nullish(z.string()),
  status: z.enum(["AVAILABLE", "SOLD_OUT", "REDEEMED", "EXPIRED"]),
  expiresAt: nullish(z.string()),
  purchasedAt: nullish(z.string()),
  createdAt: z.string(),
});

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["BOOKING", "PROMOTION", "SYSTEM", "MEMBERSHIP"]),
  isRead: z.boolean(),
  link: nullish(z.string()),
  createdAt: z.string(),
});

export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

// ─── Contact / Support request schemas ─────────────────────────────

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  category: z.enum(["BOOKING", "PAYMENT", "ACCOUNT", "TECHNICAL", "OTHER"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  bookingId: z.string().optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
