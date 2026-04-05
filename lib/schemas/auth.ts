import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .optional()
    .nullable()
    .transform((v) => v ?? undefined);

const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
const GMAIL_EMAIL_REGEX = /^[A-Za-z0-9]+@gmail\.com$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// ─── Request schemas (form validation) ─────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .regex(GMAIL_EMAIL_REGEX, "Email must be in ten@gmail.com format and contain no special characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .regex(
      PASSWORD_REGEX,
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    ),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .regex(GMAIL_EMAIL_REGEX, "Email must be in ten@gmail.com format and contain no special characters"),
    password: z
      .string()
      .min(1, "Password is required")
      .regex(
        PASSWORD_REGEX,
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z
      .string()
      .min(1, "Confirm password is required")
      .regex(
        PASSWORD_REGEX,
        "Confirm password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      ),
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .regex(FULL_NAME_REGEX, "Name can only contain letters and spaces"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(PHONE_REGEX, "Phone number must be exactly 10 digits"),
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
  role: n(z.enum(["ADMIN", "STAFF", "USER"])).transform((v) => v ?? "USER"),
  membershipTier: n(z.string()),
  membershipPoints: n(z.number()),
  dateOfBirth: n(z.string()),
  gender: n(z.string()),
  city: n(z.string()),
  createdAt: n(z.string()),
  updatedAt: n(z.string()),
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
