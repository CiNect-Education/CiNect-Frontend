"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authFieldClass, authLabelClass, authSubmitClass } from "@/components/auth/auth-form-styles";

const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^0\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export function AuthRegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          fullName: z
            .string()
            .trim()
            .min(2, t("validationFullNameMin"))
            .max(50, t("validationFullNameMax"))
            .regex(FULL_NAME_REGEX, t("validationFullNameLettersOnly")),
          email: z
            .string()
            .trim()
            .min(1, t("validationRequiredEmail"))
            .regex(EMAIL_REGEX, t("validationInvalidEmail")),
          phone: z
            .string()
            .trim()
            .min(1, t("validationRequiredPhone"))
            .regex(PHONE_REGEX, t("validationInvalidPhone")),
          password: z
            .string()
            .min(1, t("validationRequiredPassword"))
            .regex(PASSWORD_REGEX, t("validationInvalidPassword")),
          confirmPassword: z
            .string()
            .min(1, t("validationRequiredConfirmPassword"))
            .regex(PASSWORD_REGEX, t("validationInvalidConfirmPassword")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onInvalidSubmit() {
    toast.error(t("validationCheckRegisterForm"));
  }

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      await register({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      router.push("/login");
    } catch {
      // Error toast already shown in AuthProvider
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("fullName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} className={authFieldClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("email")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="email"
                      placeholder={t("emailPlaceholder")}
                      className={`${authFieldClass} pr-24`}
                      {...field}
                    />
                    {field.value && !field.value.includes("@") ? (
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                        @gmail.com
                      </span>
                    ) : null}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("phone")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("phonePlaceholder")}
                    inputMode="tel"
                    maxLength={10}
                    className={authFieldClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className={`${authFieldClass} pr-10`}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 px-3 text-slate-500 hover:text-slate-800"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`${authFieldClass} pr-10`}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 px-3 text-slate-500 hover:text-slate-800"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="cta" className={authSubmitClass} disabled={isLoading}>
            {isLoading ? t("creatingAccount") : t("registerBtn")}
          </Button>
        </form>
      </Form>

      <SocialLoginButtons variant="panel" />
    </div>
  );
}
