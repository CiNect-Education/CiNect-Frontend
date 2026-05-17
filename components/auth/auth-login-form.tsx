"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/types/domain";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const REMEMBER_EMAIL_KEY = "cinect-remember-login-email";

type LoginFormValues = { email: string; password: string };

function resolvePostLoginPath(role: UserRole | undefined, returnTo: string): string {
  const isAdmin = role === "ADMIN" || role === "STAFF";
  if (!isAdmin) return returnTo;
  return returnTo.startsWith("/admin") ? returnTo : "/admin";
}

export function AuthLoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t("validationRequiredEmail"))
          .regex(EMAIL_REGEX, t("validationInvalidEmail")),
        password: z
          .string()
          .min(1, t("validationRequiredPassword"))
          .regex(PASSWORD_REGEX, t("validationInvalidPassword")),
      }),
    [t]
  );

  const returnTo = useMemo(() => {
    const queryReturnTo = searchParams.get("returnTo");
    if (queryReturnTo) {
      return queryReturnTo.startsWith(`/${locale}/`)
        ? queryReturnTo.replace(`/${locale}`, "")
        : queryReturnTo;
    }

    if (typeof window !== "undefined") {
      try {
        const ref = document.referrer ? new URL(document.referrer) : null;
        const sameOrigin = ref && ref.origin === window.location.origin;
        const path = ref ? `${ref.pathname}${ref.search}` : "";
        const isAuthPage = /^\/(vi|en)\/(login|register|forgot-password|reset-password|callback)/.test(
          path
        );

        if (sameOrigin && path && !isAuthPage) {
          return path.startsWith(`/${locale}/`) ? path.replace(`/${locale}`, "") : path;
        }
      } catch {
        // Ignore malformed referrer URL and fallback to home page.
      }
    }

    return "/";
  }, [locale, searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      form.setValue("email", saved);
      setRememberMe(true);
    }
  }, [form]);

  function onInvalidSubmit() {
    toast.error(t("validationCheckLoginForm"));
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      if (typeof window !== "undefined") {
        if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      const user = await login({ email, password: data.password });
      router.push(resolvePostLoginPath(user?.role, returnTo));
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("loginIdentifier")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="email"
                      placeholder={t("loginIdentifierPlaceholder")}
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={authLabelClass()}>{t("password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("password")}
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

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="remember-me" className="cursor-pointer text-sm font-normal text-slate-600">
                {t("rememberMe")}
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-primary text-xs font-medium hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          <Button type="submit" variant="cta" className={authSubmitClass} disabled={isLoading}>
            {isLoading ? t("signingIn") : t("loginBtn")}
          </Button>
        </form>
      </Form>

      <SocialLoginButtons variant="panel" />
    </div>
  );
}
