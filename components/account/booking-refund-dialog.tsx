"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRefundEligibility, useRequestRefund } from "@/hooks/queries/use-bookings";
import {
  REFUND_REASON_CODES,
  type RefundReasonCode,
  buildRefundReasonPayload,
} from "@/lib/refund-reasons";
import { formatVnd } from "@/lib/showtime-display";
import type { Booking } from "@/types/domain";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

type Props = {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type Step = "reason" | "confirm";

export function BookingRefundDialog({ booking, open, onOpenChange, onSuccess }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [step, setStep] = useState<Step>("reason");
  const [reasonCode, setReasonCode] = useState<RefundReasonCode | "">("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [method, setMethod] = useState<"STORE_CREDIT" | "ORIGINAL_PAYMENT">("STORE_CREDIT");

  const { data: eligibilityRes, isLoading, error, isFetching } = useRefundEligibility(
    booking.id,
    open,
  );
  const eligibility = eligibilityRes?.data;
  const refundMutation = useRequestRefund();

  useEffect(() => {
    if (!open) {
      setStep("reason");
      setReasonCode("");
      setReasonDetail("");
      return;
    }
    const preferred = eligibility?.allowedMethods?.[0];
    if (preferred) setMethod(preferred);
  }, [open, eligibility?.allowedMethods]);

  const reasonKeys = {
    DEADLINE_PASSED: "refundReasonDEADLINE_PASSED",
    NOT_PAID: "refundReasonNOT_PAID",
    ALREADY_REFUNDED: "refundReasonALREADY_REFUNDED",
    INVALID_STATUS: "refundReasonINVALID_STATUS",
    MONTHLY_LIMIT_REACHED: "refundReasonMONTHLY_LIMIT_REACHED",
    SHOWTIME_STARTED: "refundReasonSHOWTIME_STARTED",
    BOOKING_NOT_FOUND: "refundReasonBOOKING_NOT_FOUND",
  } as const;

  const reasonMessage = (code?: string) => {
    if (!code || code === "ELIGIBLE") return null;
    const key = reasonKeys[code as keyof typeof reasonKeys];
    return key ? t(key) : code;
  };

  const reasonLabel = (code: RefundReasonCode) =>
    t(`refundCancelReason${code}` as "refundCancelReasonSCHEDULE_CONFLICT");

  const canProceedReason =
    !!reasonCode && (reasonCode !== "OTHER" || reasonDetail.trim().length >= 3);

  const handleConfirm = async () => {
    if (!reasonCode) {
      toast.error(t("refundReasonRequired"));
      return;
    }

    try {
      const payload = buildRefundReasonPayload(reasonCode, reasonDetail);
      const res = await refundMutation.mutateAsync({
        id: booking.id,
        method,
        ...payload,
      });
      const storeCode = res.data?.refund?.storeCreditCode;
      if (storeCode) {
        toast.success(t("refundSuccessStoreCredit", { code: storeCode }));
      } else {
        toast.success(t("refundSuccessOriginal"));
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // toast handled in mutation
    }
  };

  const deadlineLabel =
    eligibility?.deadlineAt && !Number.isNaN(Date.parse(eligibility.deadlineAt))
      ? format(new Date(eligibility.deadlineAt), "PPp")
      : null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === "reason" ? t("refundReasonStepTitle") : t("refundDialogTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>{step === "reason" ? t("refundReasonStepDesc") : t("refundDialogDesc")}</p>
              <p className="text-foreground font-medium">{booking.movieTitle}</p>

              {isLoading || isFetching ? (
                <Skeleton className="h-16 w-full" />
              ) : error ? (
                <div className="space-y-2">
                  <p className="text-destructive">{t("refundLoadError")}</p>
                  <p className="text-muted-foreground text-xs">{error.toastMessage}</p>
                </div>
              ) : !eligibility?.eligible ? (
                <p className="text-destructive">
                  {reasonMessage(eligibility?.reasonCode) ?? t("refundNotEligible")}
                </p>
              ) : step === "reason" ? (
                <div className="bg-muted/40 space-y-3 rounded-md border p-3">
                  <p className="text-foreground font-medium">{t("refundReasonChooseLabel")}</p>
                  <RadioGroup
                    value={reasonCode}
                    onValueChange={(v) => setReasonCode(v as RefundReasonCode)}
                    className="gap-2"
                  >
                    {REFUND_REASON_CODES.map((code) => (
                      <div key={code} className="flex items-start gap-2">
                        <RadioGroupItem value={code} id={`refund-reason-${code}`} className="mt-1" />
                        <Label htmlFor={`refund-reason-${code}`} className="cursor-pointer font-normal">
                          {reasonLabel(code)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {reasonCode === "OTHER" ? (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="refund-reason-detail">{t("refundReasonOtherLabel")}</Label>
                      <Textarea
                        id="refund-reason-detail"
                        value={reasonDetail}
                        onChange={(e) => setReasonDetail(e.target.value)}
                        placeholder={t("refundReasonOtherPlaceholder")}
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-muted-foreground text-xs">{t("refundReasonOtherHint")}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-muted/40 space-y-3 rounded-md border p-3">
                  <div className="rounded-md border border-dashed p-2 text-xs">
                    <span className="text-muted-foreground">{t("refundReasonSelectedLabel")}: </span>
                    <span className="text-foreground font-medium">
                      {reasonCode ? reasonLabel(reasonCode) : "—"}
                    </span>
                    {reasonCode === "OTHER" && reasonDetail.trim() ? (
                      <p className="text-muted-foreground mt-1">{reasonDetail.trim()}</p>
                    ) : null}
                  </div>
                  <p>
                    {t("refundAmountLabel")}:{" "}
                    <span className="font-semibold">
                      {formatVnd(eligibility.refundAmount ?? booking.finalAmount ?? 0, locale)}
                    </span>
                  </p>
                  {deadlineLabel ? (
                    <p className="text-muted-foreground text-xs">
                      {t("refundDeadlineHint", {
                        hours: eligibility.deadlineHours,
                        deadline: deadlineLabel,
                      })}
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-foreground text-xs font-medium">{t("refundMethodChooseLabel")}</p>
                    <RadioGroup
                      value={method}
                      onValueChange={(v) => setMethod(v as typeof method)}
                      className="gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="STORE_CREDIT" id="refund-store-credit" className="mt-1" />
                        <Label htmlFor="refund-store-credit" className="cursor-pointer font-normal">
                          <span className="font-medium">{t("refundMethodStoreCredit")}</span>
                          <span className="text-muted-foreground block text-xs">
                            {t("refundMethodStoreCreditHint")}
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="ORIGINAL_PAYMENT" id="refund-original" className="mt-1" />
                        <Label htmlFor="refund-original" className="cursor-pointer font-normal">
                          <span className="font-medium">{t("refundMethodOriginal")}</span>
                          <span className="text-muted-foreground block text-xs">
                            {t("refundMethodOriginalHint")}
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          {step === "confirm" && eligibility?.eligible ? (
            <Button type="button" variant="outline" onClick={() => setStep("reason")}>
              {t("refundBack")}
            </Button>
          ) : (
            <AlertDialogCancel>{t("refundCancel")}</AlertDialogCancel>
          )}
          {step === "reason" && eligibility?.eligible ? (
            <AlertDialogAction
              disabled={!canProceedReason}
              onClick={(e) => {
                e.preventDefault();
                setStep("confirm");
              }}
            >
              {t("refundNext")}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              disabled={!eligibility?.eligible || refundMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
            >
              {refundMutation.isPending ? t("refundSubmitting") : t("refundConfirm")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
