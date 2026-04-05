import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .optional()
    .nullable()
    .transform((v) => v ?? undefined);

// ─── Request schemas (form validation) ─────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be at most 100 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Response schemas (runtime validation) ─────────────────────────

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  phone: n(z.string()),
  avatar: n(z.string()),
  // Some backends only return basic user fields; keep the rest optional.
  role: z.enum(["ADMIN", "STAFF", "USER"]).optional().default("USER"),
  membershipTier: n(z.string()),
  membershipPoints: n(z.number()),
  dateOfBirth: n(z.string()),
  gender: n(z.string()),
  city: n(z.string()),
  createdAt: z.string().nullable().optional().transform((v) => v ?? new Date(0).toISOString()),
  updatedAt: z.string().nullable().optional().transform((v) => v ?? new Date(0).toISOString()),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional().default(""),
  expiresIn: z.number().optional().default(0),
});

const canonicalAuthSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});

const nestAuthSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

export const authResponseSchema = z
  .union([canonicalAuthSchema, nestAuthSchema])
  .transform((v) => {
    if ("tokens" in v) return v;
    return {
      user: v.user,
      tokens: {
        accessToken: v.accessToken,
        refreshToken: v.refreshToken ?? "",
        expiresIn: 0,
      },
    };
  });

// ─── Inferred types ────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
