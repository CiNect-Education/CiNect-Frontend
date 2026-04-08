"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types/domain";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { normalizeLocalizedPath } from "../../../../lib/locale-path";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

type LoginFormValues = { email: string; password: string };

function resolvePostLoginPath(role: UserRole | undefined, returnTo: string): string {
  const isAdmin = role === "ADMIN" || role === "STAFF";
  if (!isAdmin) return returnTo;
  return returnTo.startsWith("/admin") ? returnTo : "/admin";
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
      return normalizeLocalizedPath(queryReturnTo);
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
          return normalizeLocalizedPath(path);
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

  function onInvalidSubmit() {
    toast.error(t("validationCheckLoginForm"));
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const user = await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      router.push(resolvePostLoginPath(user?.role, returnTo));
    } catch {
      // Error toast already shown in AuthProvider
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("login")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="email"
                        placeholder={t("emailPlaceholder")}
                        className="pr-24"
                        {...field}
                      />
                      {field.value && !field.value.includes("@") ? (
                        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
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
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("password")}</FormLabel>
                    <Link href="/forgot-password" className="text-primary text-xs hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("signingIn") : t("loginBtn")}
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <SocialLoginButtons />
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-sm">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {t("register")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
