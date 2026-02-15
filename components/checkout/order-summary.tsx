"use client";

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
  const hasBooking = !!booking?.id;

  const seatsTotal = hasBooking
    ? (booking.seats?.reduce((s, seat) => s + (seat.price ?? 0), 0) ?? 0)
    : holdSeats.reduce((s, seat) => s + (seat.price ?? 0), 0);

  const baseTotal = hasBooking
    ? (booking.totalAmount ?? seatsTotal + snacksTotal)
    : seatsTotal + snacksTotal;

  const total = hasBooking ? booking.finalAmount : baseTotal;

  const seatLabel =
    holdSeats.length > 0 || (booking?.seats?.length ?? 0) > 0
      ? `${holdSeats.length || booking?.seats?.length || 0} tickets`
      : "Seats";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{seatLabel}</span>
            <span className="font-medium">${seatsTotal.toFixed(2)}</span>
          </div>
          {(holdSeats.length > 0 || (booking?.seats?.length ?? 0) > 0) && (
            <p className="text-xs text-muted-foreground">
              {(holdSeats.length ? holdSeats : booking?.seats ?? [])
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
                <span className="text-muted-foreground">Snacks & Drinks</span>
                <span className="font-medium">${snacksTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                {selectedSnacks.map((item) => {
                  const price =
                    item.snack?.unitPrice ?? item.snack?.price ?? 0;
                  return (
                    <div
                      key={item.snackId}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span>
                        {item.quantity}x {item.snack?.name || "Item"}
                      </span>
                      <span>${(price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${baseTotal.toFixed(2)}</span>
        </div>

        {hasBooking && (booking.discountAmount ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${(booking.discountAmount ?? 0).toFixed(2)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold">${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
