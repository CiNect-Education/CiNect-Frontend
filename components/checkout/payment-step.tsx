"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { CreditCard, Wallet, Gift, Smartphone, Building2, Banknote } from "lucide-react";
import type { PaymentMethod, Promotion } from "@/types/domain";
import { PromoPickerRow, PromoPickerSheet } from "@/components/checkout/promo-picker-sheet";

interface PaymentStepProps {
  onPayment: (paymentMethod: PaymentMethod, amount: number) => Promise<void>;
  isLoading: boolean;
  totalAmount: number;
  orderAmount: number;
  appliedPromoCode?: string | null;
  onApplyPromo: (code: string) => Promise<void> | void;
  isApplyingPromo?: boolean;
  giftCardCode: string;
  onGiftCardCodeChange: (code: string) => void;
  onApplyGiftCard: () => void;
  isApplyingGiftCard?: boolean;
  usePoints: number;
  onUsePointsChange: (points: number) => void;
  onApplyPoints: () => void;
  isApplyingPoints?: boolean;
  availablePoints?: number;
  eligiblePromotions?: Promotion[];
}

function paymentMethodLabel(m: PaymentMethod, t: (key: string) => string) {
  switch (m) {
    case "CARD":
      return t("pmCard");
    case "MOMO":
      return t("pmMomo");
    case "ZALOPAY":
      return t("pmZalopay");
    case "VNPAY":
      return t("pmVnpay");
    case "BANK_TRANSFER":
      return t("pmBankTransfer");
    default:
      return m;
  }
}

export function PaymentStep({
  onPayment,
  isLoading,
  totalAmount,
  orderAmount,
  appliedPromoCode,
  onApplyPromo,
  isApplyingPromo,
  giftCardCode,
  onGiftCardCodeChange,
  onApplyGiftCard,
  isApplyingGiftCard,
  usePoints,
  onUsePointsChange,
  onApplyPoints,
  isApplyingPoints,
  availablePoints = 0,
  eligiblePromotions = [],
}: PaymentStepProps) {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [promoPickerOpen, setPromoPickerOpen] = useState(false);

  const paymentMethods = useMemo(
    () =>
      (
        [
          { value: "CARD" as const, icon: <CreditCard className="h-4 w-4" /> },
          { value: "MOMO" as const, icon: <Smartphone className="h-4 w-4" /> },
          { value: "ZALOPAY" as const, icon: <Smartphone className="h-4 w-4" /> },
          { value: "VNPAY" as const, icon: <Wallet className="h-4 w-4" /> },
          { value: "BANK_TRANSFER" as const, icon: <Building2 className="h-4 w-4" /> },
        ] as const
      ).map((row) => ({
        ...row,
        label: paymentMethodLabel(row.value, t),
      })),
    [t]
  );

  const appliedPromotion = useMemo(
    () =>
      eligiblePromotions.find(
        (p) =>
          p.code &&
          appliedPromoCode &&
          p.code.toUpperCase() === appliedPromoCode.toUpperCase(),
      ) ?? null,
    [eligiblePromotions, appliedPromoCode],
  );

  const eligiblePromoCount = eligiblePromotions.filter((p) => p.code).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPayment(paymentMethod, totalAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="cinect-flow-divider pb-4">
        <PromoPickerRow
          appliedPromoCode={appliedPromoCode}
          appliedPromotion={appliedPromotion}
          eligibleCount={eligiblePromoCount}
          onOpen={() => setPromoPickerOpen(true)}
        />
        <PromoPickerSheet
          open={promoPickerOpen}
          onOpenChange={setPromoPickerOpen}
          promotions={eligiblePromotions}
          appliedPromoCode={appliedPromoCode}
          paymentMethod={paymentMethod}
          orderAmount={orderAmount}
          isApplying={isApplyingPromo}
          onApply={onApplyPromo}
        />
      </div>

      <div className="cinect-flow-divider space-y-3 pb-6">
        <Label htmlFor="gift" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Gift className="h-4 w-4" />
          {t("giftCardLabel")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="gift"
            placeholder={t("giftCardPlaceholder")}
            value={giftCardCode}
            onChange={(e) => onGiftCardCodeChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyGiftCard}
            disabled={!giftCardCode.trim() || isApplyingGiftCard}
          >
            {isApplyingGiftCard ? tCommon("applying") : tCommon("apply")}
          </Button>
        </div>
      </div>

      <div className="cinect-flow-divider space-y-3 pb-6">
        <Label htmlFor="points" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Banknote className="h-4 w-4" />
          {t("useLoyaltyPoints")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="points"
            type="number"
            min={0}
            max={availablePoints}
            placeholder={t("pointsPlaceholder")}
            value={usePoints || ""}
            onChange={(e) => onUsePointsChange(parseInt(e.target.value, 10) || 0)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyPoints}
            disabled={usePoints <= 0 || isApplyingPoints || usePoints > availablePoints}
          >
            {isApplyingPoints ? tCommon("applying") : tCommon("apply")}
          </Button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("pointsAvailable", { points: availablePoints.toLocaleString() })}
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <Label className="text-sm font-medium">{t("paymentMethod")}</Label>
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {paymentMethods.map((m) => (
              <div
                key={m.value}
                className={cn(
                  "cinect-flow-interactive p-4",
                  paymentMethod === m.value && "cinect-flow-interactive-selected",
                )}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={m.value} id={m.value} />
                  <Label htmlFor={m.value} className="flex flex-1 cursor-pointer items-center gap-2">
                    {m.icon}
                    {m.label}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? t("processing") : t("completePayment")}
      </Button>
    </form>
  );
}
