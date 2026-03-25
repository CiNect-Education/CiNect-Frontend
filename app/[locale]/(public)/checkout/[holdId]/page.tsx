"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { SnacksStep } from "@/components/checkout/snacks-step";
import { PaymentStep } from "@/components/checkout/payment-step";
import { OrderSummary } from "@/components/checkout/order-summary";
import {
  useHold,
  useCreateBooking,
  useBooking,
  useSnacks,
  useEligiblePromotions,
  useApplyPromo,
  useApplyPoints,
  useApplyGiftCard,
  useInitiatePayment,
} from "@/hooks/queries/use-booking-flow";
import { useMembershipProfile } from "@/hooks/queries/use-membership";
import { Popcorn, CreditCard, Film } from "lucide-react";
import { format } from "date-fns";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const holdId = params.holdId as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSnacks, setSelectedSnacks] = useState<
    Array<{ snackId: string; quantity: number }>
  >([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [usePoints, setUsePoints] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [hasFavoriteCombo, setHasFavoriteCombo] = useState(false);

  const FAVORITE_COMBO_KEY = "cinect_favorite_combo";

  const { data: holdRes, isLoading: holdLoading, error: holdError } = useHold(holdId);
  const hold = holdRes?.data as import("@/hooks/queries/use-booking-flow").HoldDetails | undefined;
  const cinemaId = hold?.showtime?.cinemaId;

  const { data: snacksRes, isLoading: snacksLoading, error: snacksError } = useSnacks(cinemaId);
  const snacksData = snacksRes?.data ?? snacksRes;
  const snackItems = Array.isArray(snacksData) ? snacksData : [];

  const { data: membershipRes } = useMembershipProfile();
  const profile = membershipRes?.data as import("@/types/domain").MembershipProfile | undefined;
  const availablePoints = profile?.currentPoints ?? 0;

  const { data: bookingRes } = useBooking(bookingId ?? undefined);
  const booking = bookingRes?.data as import("@/types/domain").Booking | undefined;

  const { data: promotionsRes } = useEligiblePromotions(bookingId ?? undefined);
  const promotionsData = promotionsRes?.data ?? promotionsRes;
  const eligiblePromotions = Array.isArray(promotionsData) ? promotionsData : [];

  const createBookingMutation = useCreateBooking();
  const applyPromoMutation = useApplyPromo();
  const applyPointsMutation = useApplyPoints();
  const applyGiftCardMutation = useApplyGiftCard();
  const initiatePaymentMutation = useInitiatePayment();

  const handleSnackChange = useCallback((snackId: string, quantity: number) => {
    setSelectedSnacks((prev) => {
      const existing = prev.find((s) => s.snackId === snackId);
      if (quantity === 0) return prev.filter((s) => s.snackId !== snackId);
      if (existing) return prev.map((s) => (s.snackId === snackId ? { ...s, quantity } : s));
      return [...prev, { snackId, quantity }];
    });
  }, []);

  // Load favorite combo from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FAVORITE_COMBO_KEY);
      if (!raw) {
        setHasFavoriteCombo(false);
        return;
      }
      const parsed = JSON.parse(raw) as Array<{ snackId: string; quantity: number }>;
      const nonZero = parsed.filter((s) => s.quantity > 0);
      setHasFavoriteCombo(nonZero.length > 0);
    } catch {
      setHasFavoriteCombo(false);
    }
  }, [holdId]);

  const handleSaveFavoriteCombo = useCallback(() => {
    if (typeof window === "undefined") return;
    const nonZero = selectedSnacks.filter((s) => s.quantity > 0);
    if (nonZero.length === 0) return;
    window.localStorage.setItem(FAVORITE_COMBO_KEY, JSON.stringify(nonZero));
    setHasFavoriteCombo(true);
  }, [selectedSnacks]);

  const handleApplyFavoriteCombo = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FAVORITE_COMBO_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ snackId: string; quantity: number }>;
      setSelectedSnacks(parsed);
    } catch {
      // ignore parse error
    }
  }, []);

  const handleContinueFromReview = useCallback(() => setStep(2), []);

  const handleContinueFromSnacks = useCallback(async () => {
    try {
      const res = await createBookingMutation.mutateAsync({
        holdId,
        snacks: selectedSnacks.length > 0 ? selectedSnacks : undefined,
      });
      const payload = res?.data ?? res;
      const id =
        typeof payload === "object" && payload && "id" in payload
          ? (payload as { id: string }).id
          : (res as { id?: string }).id;
      setBookingId(id ?? null);
      setStep(3);
    } catch {
      // Error handled by mutation
    }
  }, [holdId, selectedSnacks, createBookingMutation]);

  const handleApplyPromo = useCallback(() => {
    if (!bookingId || !promoCode.trim()) return;
    applyPromoMutation.mutate({ bookingId, promoCode: promoCode.trim() });
  }, [bookingId, promoCode, applyPromoMutation]);

  const handleApplyPoints = useCallback(() => {
    if (!bookingId || usePoints <= 0) return;
    applyPointsMutation.mutate({ bookingId, points: usePoints });
  }, [bookingId, usePoints, applyPointsMutation]);

  const handleApplyGiftCard = useCallback(() => {
    if (!bookingId || !giftCardCode.trim()) return;
    applyGiftCardMutation.mutate({
      bookingId,
      giftCardCode: giftCardCode.trim(),
    });
  }, [bookingId, giftCardCode, applyGiftCardMutation]);

  const handlePayment = useCallback(
    async (method: string, amount: number) => {
      const finalAmount = booking?.finalAmount ?? amount;
      if (!bookingId) return;
      try {
        const res = await initiatePaymentMutation.mutateAsync({
          bookingId,
          method,
          amount: finalAmount,
        });
        const payload = res?.data ?? res;
        const paymentUrl =
          typeof payload === "object" && payload && "paymentUrl" in payload
            ? (payload as { paymentUrl?: string }).paymentUrl
            : (res as { paymentUrl?: string }).paymentUrl;

        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          router.push(`/tickets/${bookingId}`);
        }
      } catch {
        // Error handled by mutation
      }
    },
    [bookingId, booking?.finalAmount, initiatePaymentMutation, router]
  );
  const selectedSnackDetails = selectedSnacks
    .map((s) => ({
      ...s,
      snack: snackItems.find((sn) => sn.id === s.snackId),
    }))
    .filter((s) => s.snack);

  const snackPrice = (s: { unitPrice?: number; price?: number }) =>
    s.unitPrice ?? (s as { price?: number }).price ?? 0;

  const snacksTotal = selectedSnackDetails.reduce(
    (sum, item) =>
      sum + snackPrice(item.snack as { unitPrice?: number; price?: number }) * item.quantity,
    0
  );

  const holdSeats = hold?.seats ?? [];
  const seatsTotal = holdSeats.reduce((s, seat) => s + (seat.price ?? 0), 0);
  const estimatedTotal = seatsTotal + snacksTotal;

  if (holdLoading || (step === 2 && !hold)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (holdError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={holdError} />
      </div>
    );
  }

  if (!hold) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Hold not found or expired.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs
                value={String(step)}
                onValueChange={(v) => {
                  const n = Number(v) as 1 | 2 | 3;
                  if (n === 3 && !bookingId) return;
                  setStep(n);
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="1" className="gap-2">
                    <Film className="h-4 w-4" />
                    Review
                  </TabsTrigger>
                  <TabsTrigger value="2" className="gap-2">
                    <Popcorn className="h-4 w-4" />
                    Snacks
                  </TabsTrigger>
                  <TabsTrigger value="3" className="gap-2" disabled={!bookingId}>
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="1" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{hold.showtime?.movieTitle ?? "Movie"}</h3>
                      <p className="text-muted-foreground text-sm">
                        {hold.showtime?.cinemaName} • {hold.showtime?.roomName}
                      </p>
                      {hold.showtime?.startTime && (
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(hold.showtime.startTime), "PPP 'at' p")} •{" "}
                          {hold.showtime?.format}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Seats</h4>
                      <p className="text-muted-foreground">
                        {holdSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                      </p>
                    </div>
                    <Button onClick={handleContinueFromReview}>Continue to Snacks</Button>
                  </div>
                </TabsContent>

                <TabsContent value="2" className="mt-6">
                  {snacksLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : snacksError ? (
                    <ApiErrorState error={snacksError} />
                  ) : (
                    <SnacksStep
                      snacks={snackItems}
                      selectedSnacks={selectedSnacks}
                      onSnackChange={handleSnackChange}
                      onSkip={handleContinueFromSnacks}
                      onContinue={handleContinueFromSnacks}
                      onSaveFavorite={handleSaveFavoriteCombo}
                      onApplyFavorite={handleApplyFavoriteCombo}
                      hasFavorite={hasFavoriteCombo}
                    />
                  )}
                </TabsContent>

                <TabsContent value="3" className="mt-6">
                  {!bookingId ? (
                    <p className="text-muted-foreground">
                      Creating booking... If this persists, go back and continue from Snacks.
                    </p>
                  ) : (
                    <PaymentStep
                      onPayment={handlePayment}
                      isLoading={initiatePaymentMutation.isPending}
                      totalAmount={booking?.finalAmount ?? estimatedTotal}
                      promoCode={promoCode}
                      onPromoCodeChange={setPromoCode}
                      onApplyPromo={handleApplyPromo}
                      isApplyingPromo={applyPromoMutation.isPending}
                      giftCardCode={giftCardCode}
                      onGiftCardCodeChange={setGiftCardCode}
                      onApplyGiftCard={handleApplyGiftCard}
                      isApplyingGiftCard={applyGiftCardMutation.isPending}
                      usePoints={usePoints}
                      onUsePointsChange={setUsePoints}
                      onApplyPoints={handleApplyPoints}
                      isApplyingPoints={applyPointsMutation.isPending}
                      availablePoints={availablePoints}
                      eligiblePromotions={eligiblePromotions.map((p) => ({
                        id: p.id,
                        title: p.title,
                        code: p.code,
                        eligiblePaymentMethods: p.eligiblePaymentMethods,
                      }))}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <OrderSummary
            holdId={holdId}
            holdSeats={holdSeats}
            selectedSnacks={selectedSnackDetails}
            snacksTotal={snacksTotal}
            promoCode={promoCode}
            usePoints={usePoints}
            giftCardCode={giftCardCode}
            booking={booking}
          />
        </div>
      </div>
    </div>
  );
}
