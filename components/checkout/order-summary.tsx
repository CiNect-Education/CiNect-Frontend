"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatVnd } from "@/lib/showtime-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Booking } from "@/types/domain";

interface OrderSummaryProps {
  holdId?: string;
  holdSeats?: Array<{ row: string; number: number; type?: string; price?: number }>;
  selectedSnacks: Array<{
    snackId: string;
    quantity: number;
    snack?: { name?: string; unitPrice?: number; price?: number };
  }>;
  snacksTotal: number;
  promoCode?: string;
  usePoints?: number;
  giftCardCode?: string;
  booking?: Booking | null;
}

export function OrderSummary({
  holdSeats = [],
  selectedSnacks,
  snacksTotal,
  promoCode,
  usePoints,
  giftCardCode,
  booking,
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const fmt = (n: number) => formatVnd(n, locale);
  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const hasBooking = !!booking?.id;

  const seatsTotal = hasBooking
    ? (booking.seats?.reduce((s, seat) => s + toNumber(seat.price), 0) ?? 0)
    : holdSeats.reduce((s, seat) => s + toNumber(seat.price), 0);

  const baseTotal = hasBooking
    ? (toNumber(booking.totalAmount) || seatsTotal + snacksTotal)
    : seatsTotal + snacksTotal;

  const total = hasBooking ? (toNumber(booking.finalAmount) || baseTotal) : baseTotal;

  const seatCount = holdSeats.length || booking?.seats?.length || 0;
  const seatLabel =
    seatCount > 0 ? t("ticketsCount", { count: seatCount }) : t("seatsOnlyLabel");

  const appliedPromoCode = booking?.promotionCode ?? promoCode;
  const appliedPoints = booking?.pointsUsed ?? usePoints;
  const appliedGiftCardCode = booking?.giftCardCode ?? giftCardCode;

  return (
    <Card className="cinect-glass border">
      <CardHeader>
        <CardTitle>{t("orderSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{seatLabel}</span>
            <span className="font-medium">{fmt(seatsTotal)}</span>
          </div>
          {(holdSeats.length > 0 || (booking?.seats?.length ?? 0) > 0) && (
            <p className="text-muted-foreground text-xs">
              {(holdSeats.length ? holdSeats : (booking?.seats ?? []))
                .map((s) => `${s.row}${s.number}`)
                .join(", ")}
            </p>
          )}
        </div>

        {selectedSnacks.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">{t("snacksDrinks")}</span>
                <span className="font-medium">{fmt(snacksTotal)}</span>
              </div>
              <div className="space-y-1">
                {selectedSnacks.map((item) => {
                  const price = toNumber(item.snack?.unitPrice ?? item.snack?.price);
                  return (
                    <div
                      key={item.snackId}
                      className="text-muted-foreground flex justify-between text-xs"
                    >
                      <span>
                        {item.quantity}x {item.snack?.name || t("snackLineItemFallback")}
                      </span>
                      <span>{fmt(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium">{fmt(baseTotal)}</span>
        </div>

        {hasBooking && toNumber(booking.discountAmount) > 0 && (
          <div className="text-primary space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t("discount")}</span>
              <span>-{fmt(toNumber(booking.discountAmount))}</span>
            </div>
            {(appliedPromoCode || (appliedPoints ?? 0) > 0 || appliedGiftCardCode) && (
              <div className="text-muted-foreground space-y-0.5 text-xs">
                {appliedPromoCode && <p>{t("promoApplied", { code: appliedPromoCode })}</p>}
                {appliedPoints && appliedPoints > 0 && (
                  <p>{t("pointsUsed", { points: appliedPoints.toLocaleString() })}</p>
                )}
                {appliedGiftCardCode && (
                  <p>{t("giftCardApplied", { code: appliedGiftCardCode })}</p>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="flex justify-between">
          <span className="font-semibold">{t("total")}</span>
          <span className="text-2xl font-bold tabular-nums">{fmt(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
