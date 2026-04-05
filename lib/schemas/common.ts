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
  // Optional list of payment methods this promo applies to (if backend provides it)
  eligiblePaymentMethods: nullish(
    z.array(z.enum(["CARD", "MOMO", "ZALOPAY", "VNPAY", "BANK_TRANSFER", "CASH"]))
  ),
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

/** Normalize tier benefits from JSON/Prisma (array, JSON string, or missing). */
function normalizeBenefitsList(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((x) => String(x));
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val) as unknown;
      return Array.isArray(p) ? p.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const membershipTierSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  level: z.coerce.number(),
  pointsRequired: z.coerce.number(),
  benefits: z.preprocess((v) => normalizeBenefitsList(v), z.array(z.string())),
  discountPercent: z.coerce.number(),
  color: z.string(),
  icon: nullish(z.string()),
});

/** Nested profile (Nest / Spring aligned). */
const membershipProfileObjectSchema = z.object({
  userId: z.coerce.string(),
  tier: membershipTierSchema,
  currentPoints: z.coerce.number(),
  totalPoints: z.coerce.number(),
  nextTier: nullish(membershipTierSchema),
  pointsToNextTier: nullish(z.coerce.number()),
  memberSince: z.coerce.string(),
  expiresAt: nullish(z.coerce.string()),
});

/**
 * Spring previously returned a flat DTO (tierName, tierLevel, …); Nest returns nested `tier`.
 * Accept both; allow null when the backend has no membership row.
 */
function preprocessMembershipProfileData(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || raw === null) return raw;
  const o = raw as Record<string, unknown>;
  if (o.tier && typeof o.tier === "object") {
    return raw;
  }
  if ("tierName" in o || "tierLevel" in o || "tierId" in o) {
    return {
      userId: o.userId,
      tier: {
        id: o.tierId,
        name: o.tierName,
        level: o.tierLevel,
        pointsRequired: o.pointsRequired,
        benefits: o.benefits,
        discountPercent: o.discountPercent,
        color: o.color,
        icon: o.icon,
      },
      currentPoints: o.currentPoints,
      totalPoints: o.totalPoints,
      nextTier: o.nextTier,
      pointsToNextTier: o.pointsToNextTier,
      memberSince: o.memberSince,
      expiresAt: o.expiresAt,
    };
  }
  return raw;
}

export const membershipProfileSchema = z.preprocess(
  preprocessMembershipProfileData,
  membershipProfileObjectSchema.nullable()
);

export const giftCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Nest/Prisma may omit or null; Decimal fields often arrive as strings in JSON */
  description: nullish(z.string()),
  imageUrl: nullish(z.string()),
  value: z.coerce.number(),
  price: z.coerce.number(),
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
