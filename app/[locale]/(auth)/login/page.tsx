"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
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

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email là bắt buộc")
    .regex(EMAIL_REGEX, "Email không đúng định dạng (ví dụ: ten@domain.com)"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .regex(
      PASSWORD_REGEX,
      "Mật khẩu phải có ít nhất 8 ký tự gồm chữ thường, chữ hoa, số và ký tự đặc biệt"
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const rawReturnTo = searchParams.get("returnTo") || "/account/profile";
  // `useRouter()` here is locale-aware, so strip leading "/{locale}" if present
  const returnTo =
    rawReturnTo.startsWith(`/${locale}/`) ? rawReturnTo.replace(`/${locale}`, "") : rawReturnTo;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  function onInvalidSubmit() {
    toast.error("Vui lòng kiểm tra lại email và mật khẩu");
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      router.push(returnTo);
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
        <CardDescription>Enter your credentials to access your account</CardDescription>
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
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="ten@domain.com"
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
              {isLoading ? "Signing in..." : t("loginBtn")}
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
