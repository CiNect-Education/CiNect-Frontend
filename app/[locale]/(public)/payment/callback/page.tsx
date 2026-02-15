"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { usePaymentStatus, useConfirmBooking } from "@/hooks/queries/use-booking-flow";
import { PaymentStatus } from "@/components/checkout/payment-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get("transactionId");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const confirmBooking = useConfirmBooking();

  // Step 1: Call callback endpoint to get paymentId
  useEffect(() => {
    if (!transactionId) {
      setError("Missing transaction ID");
      setLoading(false);
      return;
    }

    apiClient
      .get<{ paymentId: string; bookingId: string; status: string }>(
        "/payments/callback",
        { transactionId }
      )
      .then((res) => {
        setPaymentId(res.data.paymentId);
        setBookingId(res.data.bookingId);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to verify payment");
        setLoading(false);
      });
  }, [transactionId]);

  // Step 2: Poll payment status
  const { data: statusData } = usePaymentStatus(paymentId || undefined);
  const paymentStatus = statusData?.data?.status;

  // Step 3: On success, confirm booking
  useEffect(() => {
    if (paymentStatus === "SUCCESS" && bookingId && !confirmBooking.isSuccess) {
      confirmBooking.mutate(bookingId);
    }
  }, [paymentStatus, bookingId, confirmBooking]);

  // Navigate to ticket on confirm success
  useEffect(() => {
    if (confirmBooking.isSuccess && bookingId) {
      const timer = setTimeout(() => {
        router.push(`/tickets/${bookingId}` as any);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [confirmBooking.isSuccess, bookingId, router]);

  // Timeout after 2 minutes
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), 120000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/" as any)}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (timedOut && paymentStatus !== "SUCCESS") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Clock className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
            <CardTitle>Payment Timeout</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Payment verification timed out. If you were charged, your booking will be confirmed automatically.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button onClick={() => router.push("/account/orders" as any)}>
                View Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "SUCCESS" || confirmBooking.isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <CardTitle>Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your booking has been confirmed. Redirecting to your ticket...
            </p>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "FAILED") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {statusData?.data?.errorReason || "Your payment was not successful. Please try again."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.push("/" as any)}>
                Go Home
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending state
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-2" />
          <CardTitle>Processing Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Please wait while we verify your payment...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
