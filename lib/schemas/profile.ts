import { z } from "zod";

const FULL_NAME_REGEX = /^[\p{L}\s'.-]+$/u;
const PHONE_REGEX = /^(?:\+84|0)\d{9}$/;
const CITY_REGEX = /^[\p{L}\s'.-]+$/u;

function isValidPastDate(value: string): boolean {
  if (!value) return true;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export const PROFILE_GENDER_VALUES = ["", "MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

export const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be at most 80 characters")
    .regex(FULL_NAME_REGEX, "Full name can only contain letters and spaces"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE_REGEX.test(value), {
      message: "Phone number must start with 0 or +84 and contain 10 digits",
    }),
  avatar: z
    .string()
    .trim()
    .refine((value) => value === "" || URL.canParse(value), {
      message: "Avatar must be a valid URL",
    }),
  dateOfBirth: z.string().refine((value) => isValidPastDate(value), {
    message: "Date of birth must be a valid past date",
  }),
  gender: z.enum(PROFILE_GENDER_VALUES),
  city: z
    .string()
    .trim()
    .max(80, "City must be at most 80 characters")
    .refine((value) => value === "" || value.length >= 2, {
      message: "City must be at least 2 characters",
    })
    .refine((value) => value === "" || CITY_REGEX.test(value), {
      message: "City can only contain letters and spaces",
    }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;