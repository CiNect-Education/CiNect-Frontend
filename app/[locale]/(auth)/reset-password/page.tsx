"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useResetPassword } from "@/hooks/queries/use-auth";

type ResetFormValues = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const resetSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(6, t("validationPasswordMin6")),
          confirmPassword: z.string().min(6, t("validationPasswordMin6")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(data: ResetFormValues) {
    if (!token) {
      toast.error(t("resetTokenMissing"));
      return;
    }

    resetPassword.mutate(
      { token, newPassword: data.password },
      {
        onSuccess: () => {
          toast.success(tToast("resetPasswordSuccess"));
          router.push("/login");
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("resetPassword")}</CardTitle>
        <CardDescription>{t("resetSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={resetPassword.isPending || !token}>
              {resetPassword.isPending ? t("resettingPassword") : t("resetBtn")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-primary text-sm hover:underline">
          {t("login")}
        </Link>
      </CardFooter>
    </Card>
  );
}
