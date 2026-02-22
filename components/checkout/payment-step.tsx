"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { CreditCard, Wallet, Gift, Tag, Smartphone, Building2, Banknote } from "lucide-react";
import type { PaymentMethod } from "@/types/domain";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "CARD", label: "Credit / Debit Card", icon: <CreditCard className="h-4 w-4" /> },
  { value: "MOMO", label: "MoMo", icon: <Smartphone className="h-4 w-4" /> },
  { value: "ZALOPAY", label: "ZaloPay", icon: <Smartphone className="h-4 w-4" /> },
  { value: "VNPAY", label: "VNPay", icon: <Wallet className="h-4 w-4" /> },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: <Building2 className="h-4 w-4" /> },
];

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
  eligiblePromotions?: Array<{ id: string; title: string; code?: string }>;
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPayment(paymentMethod, totalAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Eligible Promotions */}
      {eligiblePromotions.length > 0 && (
        <Card className="p-4">
          <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            Available Promotions
          </Label>
          <div className="space-y-2">
            {eligiblePromotions.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>{p.title}</span>
                {p.code && (
                  <span className="text-muted-foreground font-mono text-xs">{p.code}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Promo Code */}
      <Card className="p-4">
        <Label htmlFor="promo" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Promo Code
        </Label>
        <div className="flex gap-2">
          <Input
            id="promo"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyPromo}
            disabled={!promoCode.trim() || isApplyingPromo}
          >
            {isApplyingPromo ? "Applying..." : "Apply"}
          </Button>
        </div>
      </Card>

      {/* Gift Card */}
      <Card className="p-4">
        <Label htmlFor="gift" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Gift className="h-4 w-4" />
          Gift Card
        </Label>
        <div className="flex gap-2">
          <Input
            id="gift"
            placeholder="Enter gift card code"
            value={giftCardCode}
            onChange={(e) => onGiftCardCodeChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyGiftCard}
            disabled={!giftCardCode.trim() || isApplyingGiftCard}
          >
            {isApplyingGiftCard ? "Applying..." : "Apply"}
          </Button>
        </div>
      </Card>

      {/* Membership Points */}
      <Card className="p-4">
        <Label htmlFor="points" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Banknote className="h-4 w-4" />
          Use Loyalty Points
        </Label>
        <div className="flex gap-2">
          <Input
            id="points"
            type="number"
            min={0}
            max={availablePoints}
            placeholder="Points to use"
            value={usePoints || ""}
            onChange={(e) => onUsePointsChange(parseInt(e.target.value, 10) || 0)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyPoints}
            disabled={usePoints <= 0 || isApplyingPoints || usePoints > availablePoints}
          >
            {isApplyingPoints ? "Applying..." : "Apply"}
          </Button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Available: {availablePoints.toLocaleString()} points (discount calculated at checkout)
        </p>
      </Card>

      {/* Payment Method */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Payment Method</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <Card key={m.value} className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={m.value} id={m.value} />
                  <Label
                    htmlFor={m.value}
                    className="flex flex-1 cursor-pointer items-center gap-2"
                  >
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
        {isLoading ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
}
