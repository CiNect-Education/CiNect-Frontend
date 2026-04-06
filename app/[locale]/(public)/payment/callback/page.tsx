"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { usePaymentStatus, useConfirmBooking } from "@/hooks/queries/use-booking-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function PaymentCallbackPage() {
  const tPay = useTranslations("payment");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get("transactionId");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const confirmBooking = useConfirmBooking();
  const confirmOnceRef = useRef(false);

  useEffect(() => {
    if (!transactionId) {
      setError(tPay("missingTransactionId"));
      setLoading(false);
      return;
    }

    apiClient
      .get<{ id: string; bookingId: string; status: string }>("/payments/callback", {
        transactionId,
      })
      .then((res) => {
        setPaymentId(res.data.id);
        setBookingId(res.data.bookingId);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || tPay("verifyPaymentFailed"));
        setLoading(false);
      });
  }, [transactionId, tPay]);

  const { data: statusData } = usePaymentStatus(paymentId || undefined);
  const paymentStatus = statusData?.data?.status;

  useEffect(() => {
    if (paymentStatus !== "SUCCESS" || !bookingId) return;
    if (confirmOnceRef.current || confirmBooking.isSuccess) return;
    confirmOnceRef.current = true;
    confirmBooking.mutate(bookingId);
  }, [paymentStatus, bookingId, confirmBooking]);

  const paymentSucceeded = paymentStatus === "SUCCESS" || paymentStatus === "PAID";

  useEffect(() => {
    if ((paymentSucceeded || confirmBooking.isSuccess) && bookingId) {
      const timer = setTimeout(() => {
        router.push(`/tickets/${bookingId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentSucceeded, confirmBooking.isSuccess, bookingId, router]);

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), 120000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <p className="text-muted-foreground">{tPay("callbackVerifyingShort")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="cinect-glass w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="text-destructive mx-auto mb-2 h-12 w-12" />
            <CardTitle>{tPay("callbackPaymentError")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/")}>{tCommon("goHome")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (timedOut && paymentStatus !== "SUCCESS") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="cinect-glass w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="text-primary mx-auto mb-2 h-12 w-12" />
            <CardTitle>{tPay("callbackPaymentTimeout")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{tPay("callbackTimeoutDescription")}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                {tCommon("retry")}
              </Button>
              <Button onClick={() => router.push("/account/orders")}>{tPay("callbackViewOrders")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSucceeded || confirmBooking.isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="cinect-glass w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="text-primary mx-auto mb-2 h-12 w-12" />
            <CardTitle>{tPay("callbackSuccessExclaim")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{tPay("callbackBookingRedirect")}</p>
            <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "FAILED") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="cinect-glass w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="text-destructive mx-auto mb-2 h-12 w-12" />
            <CardTitle>{tPay("failedTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {statusData?.data?.errorReason ?? tPay("paymentNotSuccessfulDefault")}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                {tCommon("goHome")}
              </Button>
              <Button onClick={() => window.location.reload()}>{tPay("callbackRetryPayment")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="cinect-glass w-full max-w-md">
        <CardHeader className="text-center">
          <Loader2 className="text-primary mx-auto mb-2 h-12 w-12 animate-spin" />
          <CardTitle>{tPay("callbackProcessingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{tPay("pleaseWaitVerify")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
