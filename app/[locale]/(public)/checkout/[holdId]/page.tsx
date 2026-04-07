"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { enUS } from "date-fns/locale";
import { vi as viDateLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { localizeRoomName } from "@/lib/showtime-display";
import { getApiBaseUrl } from "@/lib/api-discovery";
import { useAuth } from "@/providers/auth-provider";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const holdId = params.holdId as string;
  const tShow = useTranslations("showtimeDisplay");
  const tCheckout = useTranslations("checkout");
  const tBookingFlow = useTranslations("bookingFlow");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const toLocalePath = useCallback(
    (path: string) => `/${locale}${path.startsWith("/") ? "" : "/"}${path}`,
    [locale]
  );

  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const formatShowtimeWhen = (iso: string) =>
    `${format(new Date(iso), "PPP", { locale: dateFnsLocale })} · ${format(new Date(iso), "p", { locale: dateFnsLocale })}`;

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

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    const query = searchParams.toString();
    const returnTo = `${pathname}${query ? `?${query}` : ""}`;
    router.replace(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authLoading, isAuthenticated, locale, pathname, router, searchParams]);

  const { data: holdRes, isLoading: holdLoading, error: holdError } = useHold(holdId);
  const hold = holdRes?.data as import("@/types/domain").HoldDetails | undefined;
  const holdShowtimeId = hold?.showtimeId;
  const cinemaId = hold?.showtime?.cinemaId;
  const holdSeats = hold?.seats ?? [];

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
    if (!holdShowtimeId) return;
    try {
      const isSpring = getApiBaseUrl().includes("8081");
      const extraPayload = isSpring
        ? {
            seatIds: holdSeats?.map((s) => s.id) || [],
            paymentMethod: "CARD", // Default for Spring
          }
        : {};

      const res = await createBookingMutation.mutateAsync({
        showtimeId: holdShowtimeId,
        holdId,
        snacks: selectedSnacks.length > 0 ? selectedSnacks : undefined,
        ...extraPayload,
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
  }, [holdShowtimeId, holdId, selectedSnacks, holdSeats, createBookingMutation]);

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
    async (method: string, _amount: number) => {
      if (!bookingId) return;
      try {
        const res = await initiatePaymentMutation.mutateAsync({
          bookingId,
          method,
        });
        const payload = res?.data ?? res;
        const paymentUrl =
          typeof payload === "object" && payload && "paymentUrl" in payload
            ? (payload as { paymentUrl?: string }).paymentUrl
            : (res as { paymentUrl?: string }).paymentUrl;
        const transactionId =
          typeof payload === "object" && payload && "transactionId" in payload
            ? (payload as { transactionId?: string }).transactionId
            : (res as { transactionId?: string }).transactionId;
        const paymentUrlObj = paymentUrl
          ? new URL(paymentUrl, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
          : null;
        const parsedTransactionId = paymentUrlObj?.searchParams.get("transactionId") ?? undefined;
        const finalTransactionId = transactionId || parsedTransactionId;

        const isSimulatedGateway =
          !!paymentUrlObj &&
          (paymentUrlObj.hostname.includes("payment-sim.cinect.local") ||
            paymentUrlObj.pathname.includes("/payment/simulated"));

        if (isSimulatedGateway && finalTransactionId) {
          // Dev fallback for mock gateway: complete callback immediately.
          await apiClient.post("/payments/callback", {
            transactionId: finalTransactionId,
            success: true,
          });
          router.push(toLocalePath(`/payment/callback?transactionId=${finalTransactionId}`));
        } else if (paymentUrl) {
          window.location.href = paymentUrl;
        } else if (finalTransactionId) {
          router.push(toLocalePath(`/payment/callback?transactionId=${finalTransactionId}`));
        } else {
          router.push(toLocalePath(`/tickets/${bookingId}`));
        }
      } catch {
        // Error handled by mutation
      }
    },
    [bookingId, initiatePaymentMutation, router, toLocalePath]
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

  const seatsTotal = holdSeats.reduce((s, seat) => s + (seat.price ?? 0), 0);
  const estimatedTotal = seatsTotal + snacksTotal;

  if (authLoading || !isAuthenticated || holdLoading || (step === 2 && !hold)) {
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
        <p className="text-muted-foreground">{tBookingFlow("holdNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="cinect-glass mb-6 rounded-xl border p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-muted-foreground text-xs font-semibold tracking-[0.22em] uppercase">
              {tCheckout("secureCheckout")}
            </div>
            <h1 className="text-3xl font-bold">{tCheckout("title")}</h1>
            <div className="text-muted-foreground mt-1 text-sm">
              {tCheckout("subtitle")}
            </div>
          </div>
          {hold.showtime?.startTime && (
            <div className="text-muted-foreground text-sm">
              {formatShowtimeWhen(hold.showtime.startTime)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="cinect-glass border">
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
                    {tCheckout("reviewSeats")}
                  </TabsTrigger>
                  <TabsTrigger value="2" className="gap-2">
                    <Popcorn className="h-4 w-4" />
                    {tCheckout("addSnacks")}
                  </TabsTrigger>
                  <TabsTrigger value="3" className="gap-2" disabled={!bookingId}>
                    <CreditCard className="h-4 w-4" />
                    {tCheckout("paymentMethod")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="1" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{hold.showtime?.movieTitle ?? tCheckout("movieFallback")}</h3>
                      <p className="text-muted-foreground text-sm">
                        {[
                          hold.showtime?.cinemaName,
                          hold.showtime?.roomName
                            ? localizeRoomName(hold.showtime.roomName, (k, v) => tShow(k, v))
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      {hold.showtime?.startTime && (
                        <p className="text-muted-foreground text-sm">
                          {formatShowtimeWhen(hold.showtime.startTime)} • {hold.showtime?.format}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{tCheckout("seatsCountLabel")}</h4>
                      <p className="text-muted-foreground">
                        {holdSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                      </p>
                    </div>
                    <Button onClick={handleContinueFromReview}>{tBookingFlow("continueToSnacks")}</Button>
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
                      {tCheckout("creatingBookingHint")}
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
