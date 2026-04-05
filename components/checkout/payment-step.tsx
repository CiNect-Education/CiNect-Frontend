"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { CreditCard, Wallet, Gift, Tag, Smartphone, Building2, Banknote } from "lucide-react";
import type { PaymentMethod } from "@/types/domain";

interface PaymentStepProps {
  onPayment: (paymentMethod: PaymentMethod, amount: number) => Promise<void>;
  isLoading: boolean;
  totalAmount: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
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
  eligiblePromotions?: Array<{
    id: string;
    title: string;
    code?: string;
    eligiblePaymentMethods?: PaymentMethod[];
  }>;
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

function paymentMethodShort(m: PaymentMethod, t: (key: string) => string) {
  if (m === "CARD") return t("pmShortCard");
  if (m === "BANK_TRANSFER") return t("pmShortBank");
  return m.toLowerCase();
}

export function PaymentStep({
  onPayment,
  isLoading,
  totalAmount,
  promoCode,
  onPromoCodeChange,
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

  const visiblePromotions =
    eligiblePromotions?.filter(
      (p) =>
        !p.eligiblePaymentMethods ||
        p.eligiblePaymentMethods.length === 0 ||
        p.eligiblePaymentMethods.includes(paymentMethod)
    ) ?? [];
  const hiddenPromotionsCount =
    (eligiblePromotions?.length ?? 0) - (visiblePromotions?.length ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPayment(paymentMethod, totalAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {eligiblePromotions.length > 0 && (
        <Card className="cinect-glass p-4">
          <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            {t("availablePromotions")}
          </Label>
          <p className="text-muted-foreground mb-1 text-xs">{t("promotionsHint")}</p>
          {hiddenPromotionsCount > 0 && (
            <p className="text-muted-foreground mb-2 text-[11px]">{t("promotionsOtherMethodsHint")}</p>
          )}
          <div className="space-y-2">
            {visiblePromotions.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hover:bg-muted/70 flex w-full items-center justify-between rounded-md border p-2 text-left text-sm transition-colors"
                onClick={() => {
                  if (!p.code) return;
                  onPromoCodeChange(p.code);
                  onApplyPromo();
                }}
              >
                <span className="pr-2">
                  {p.title}
                  {p.eligiblePaymentMethods && p.eligiblePaymentMethods.length > 0 && (
                    <span className="text-muted-foreground ml-2 text-[11px]">
                      ({p.eligiblePaymentMethods.map((m) => paymentMethodShort(m, t)).join(", ")})
                    </span>
                  )}
                </span>
                {p.code && (
                  <span className="text-primary font-mono text-xs font-semibold">{p.code}</span>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="cinect-glass p-4">
        <Label htmlFor="promo" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          {t("promoCodeLabel")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="promo"
            placeholder={t("promoPlaceholder")}
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyPromo}
            disabled={!promoCode.trim() || isApplyingPromo}
          >
            {isApplyingPromo ? tCommon("applying") : tCommon("apply")}
          </Button>
        </div>
      </Card>

      <Card className="cinect-glass p-4">
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
      </Card>

      <Card className="cinect-glass p-4">
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
      </Card>

      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("paymentMethod")}</Label>
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {paymentMethods.map((m) => (
              <Card key={m.value} className="cinect-glass p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={m.value} id={m.value} />
                  <Label htmlFor={m.value} className="flex flex-1 cursor-pointer items-center gap-2">
                    {m.icon}
                    {m.label}
                  </Label>
                </div>
              </Card>
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
