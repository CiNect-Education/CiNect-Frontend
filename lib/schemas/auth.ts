import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .optional()
    .nullable()
    .transform((v) => v ?? undefined);

const fullNameRegex = new RegExp("^\\p{L}+(?: \\p{L}+)*$", "u");
const passwordRegex = /^[A-Za-z0-9@#$%!_]+$/;
const phoneNumberRegex = /^0\d{9}$/;

// ─── Request schemas (form validation) ─────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z
      .string({
        required_error: "Email là bắt buộc",
        invalid_type_error: "Email phải là chuỗi ký tự",
      })
      .trim()
      .min(1, "Email là bắt buộc")
      .email("Email không đúng định dạng")
      .transform((value) => value.toLowerCase()),
    password: z
      .string({
        required_error: "Mật khẩu là bắt buộc",
        invalid_type_error: "Mật khẩu phải là chuỗi ký tự",
      })
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(passwordRegex, {
        message: "Mật khẩu chỉ được chứa chữ, số hoặc ký tự @ # $ % ! _",
      }),
    confirmPassword: z
      .string({
        required_error: "Xác nhận mật khẩu là bắt buộc",
        invalid_type_error: "Xác nhận mật khẩu phải là chuỗi ký tự",
      })
      .min(8, "Xác nhận mật khẩu phải có ít nhất 8 ký tự"),
    fullName: z
      .string({
        required_error: "Họ và tên là bắt buộc",
        invalid_type_error: "Họ và tên phải là chuỗi ký tự",
      })
      .trim()
      .min(1, "Họ và tên là bắt buộc")
      .regex(fullNameRegex, {
        message: "Họ và tên chỉ được chứa chữ cái và dấu cách",
      }),
    phoneNumber: z
      .string({
        required_error: "Số điện thoại là bắt buộc",
        invalid_type_error: "Số điện thoại phải là chuỗi ký tự",
      })
      .min(1, "Số điện thoại là bắt buộc")
      .regex(phoneNumberRegex, {
        message: "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số",
      }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
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
  role: z.enum(["ADMIN", "STAFF", "USER"]),
  membershipTier: n(z.string()),
  membershipPoints: n(z.number()),
  dateOfBirth: n(z.string()),
  gender: n(z.string()),
  city: n(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const authResponseSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});

// ─── Inferred types ────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
