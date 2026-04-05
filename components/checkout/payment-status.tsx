"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const tPay = useTranslations("payment");
  const tCheckout = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const [timedOut, setTimedOut] = useState(false);
  const { data, refetch } = usePaymentStatus(paymentId);

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
        <h3 className="text-lg font-semibold">{tPay("timedOutTitle")}</h3>
        <p className="text-muted-foreground text-sm">{tPay("timedOutDescription")}</p>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary h-10 w-10" />
        </div>
        <h3 className="text-lg font-semibold">{tPay("successTitle")}</h3>
        <p className="text-muted-foreground text-sm">{tCheckout("paymentConfirmed")}</p>
        {transactionId && (
          <p className="text-muted-foreground font-mono text-xs">
            {tPay("transactionRef", { transactionId })}
          </p>
        )}
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="border-destructive/50 flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
        <XCircle className="text-destructive h-16 w-16" />
        <h3 className="text-lg font-semibold">{tPay("failedTitle")}</h3>
        <p className="text-muted-foreground text-sm">
          {errorReason ?? tPay("failedDefaultReason")}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
      <Loader2 className="text-primary h-12 w-12 animate-spin" />
      <h3 className="text-lg font-semibold">{tPay("verifying")}</h3>
      <p className="text-muted-foreground text-sm">{tCheckout("paymentConfirming")}</p>
    </div>
  );
}
