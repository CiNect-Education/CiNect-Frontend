"use client";

import { useEffect, useState } from "react";
import { usePaymentStatus } from "@/hooks/queries/use-booking-flow";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

interface PaymentStatusProps {
  paymentId: string;
  onSuccess?: (transactionId?: string) => void;
  onFailed?: () => void;
}

export function PaymentStatus({ paymentId, onSuccess, onFailed }: PaymentStatusProps) {
  const [timedOut, setTimedOut] = useState(false);
  const { data, isLoading, refetch } = usePaymentStatus(paymentId);

  const status = data?.data?.status;
  const transactionId = data?.data?.transactionId;
  const errorReason = data?.data?.errorReason;

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === "SUCCESS") {
      onSuccess?.(transactionId);
    }
    if (status === "FAILED") {
      onFailed?.();
    }
  }, [status, transactionId, onSuccess, onFailed]);

  if (timedOut && status !== "SUCCESS" && status !== "FAILED") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
        <XCircle className="text-destructive h-16 w-16" />
        <h3 className="text-lg font-semibold">Payment Timed Out</h3>
        <p className="text-muted-foreground text-sm">
          The payment verification took too long. Please check your payment status in your account
          or contact support.
        </p>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Payment Successful</h3>
        <p className="text-muted-foreground text-sm">Your payment has been confirmed.</p>
        {transactionId && (
          <p className="text-muted-foreground font-mono text-xs">Transaction: {transactionId}</p>
        )}
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="border-destructive/50 flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
        <XCircle className="text-destructive h-16 w-16" />
        <h3 className="text-lg font-semibold">Payment Failed</h3>
        <p className="text-muted-foreground text-sm">
          {errorReason ?? "Your payment could not be processed."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
      <Loader2 className="text-primary h-12 w-12 animate-spin" />
      <h3 className="text-lg font-semibold">Verifying Payment</h3>
      <p className="text-muted-foreground text-sm">Please wait while we confirm your payment...</p>
    </div>
  );
}
