"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { SeatMap } from "@/components/booking/seat-map";
import {
  TicketTypePicker,
  buildTicketLinesPayload,
  requiredSeatCountFromTickets,
  ticketLinesTotal,
} from "@/components/booking/ticket-type-picker";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useShowtimeSeats,
  useShowtimeTicketProducts,
  useHoldSeats,
  useReleaseHold,
} from "@/hooks/queries/use-booking-flow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiError } from "@/lib/api-client";
import { AlertCircle, Calendar, Clock, MapPin, MonitorPlay, Ticket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Seat, TicketProduct, TicketProductCode, ShowtimeSeatsPayload } from "@/types/domain";
import { useSeatRealtime } from "@/hooks/use-seat-realtime";
import { useShowtime } from "@/hooks/queries/use-cinemas";
import { Separator } from "@/components/ui/separator";
import { RemoteImage } from "@/components/shared/remote-image";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { vi as viDateLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, localizeAudioLabel, localizeRoomName } from "@/lib/showtime-display";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

function getSeatUiStatus(seat: Seat): string {
  return String((seat as { status?: string }).status ?? seat.status ?? "AVAILABLE");
}

function seatsFromSeatsPayload(payload: unknown): Seat[] {
  if (Array.isArray(payload)) return payload as Seat[];
  if (payload && typeof payload === "object" && "seats" in payload) {
    return ((payload as ShowtimeSeatsPayload).seats ?? []) as Seat[];
  }
  return [];
}

function extractConflictedSeatIds(error: unknown): string[] {
  if (!(error instanceof ApiError) || error.status !== 409) return [];
  const d = error.details;
  if (Array.isArray(d)) return d as string[];
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.seatIds)) return obj.seatIds as string[];
    if (Array.isArray(obj.conflictingSeats)) return obj.conflictingSeats as string[];
    if (Array.isArray(obj.seats)) return obj.seats as string[];
    const first = Object.values(obj)[0];
    if (Array.isArray(first)) return first as string[];
  }
  return [];
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value === "string") {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? value : null;
  }
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? value.toISOString() : null;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    const t = d.getTime();
    return Number.isFinite(t) ? d.toISOString() : null;
  }
  return null;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const showtimeId = params.showtimeId as string;
  const isMobile = useIsMobile();
  const tb = useTranslations("booking");
  const tShow = useTranslations("showtimeDisplay");
  const dateFnsLocale = locale.startsWith("vi") ? viDateLocale : enUS;
  const formatPrice = useCallback((amount: number) => formatVnd(amount, locale), [locale]);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookingStep, setBookingStep] = useState<"tickets" | "seats">("tickets");
  const [ticketQuantities, setTicketQuantities] = useState<
    Partial<Record<TicketProductCode, number>>
  >({ ADULT_SINGLE: 1 });
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [conflictedSeatIds, setConflictedSeatIds] = useState<string[]>([]);
  const [expireModalOpen, setExpireModalOpen] = useState(false);

  const expiringRef = useRef(false);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    const query = searchParams.toString();
    const returnTo = `${pathname}${query ? `?${query}` : ""}`;
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authLoading, isAuthenticated, pathname, router, searchParams]);

  const { data: showtimeRes } = useShowtime(showtimeId);
  const showtime = (showtimeRes?.data ?? showtimeRes) as unknown as {
    movieTitle?: string;
    moviePosterUrl?: string;
    cinemaName?: string;
    roomName?: string;
    startTime?: string;
    format?: string;
    language?: string;
    subtitles?: string;
    availableSeats?: number;
    totalSeats?: number;
    memberExclusive?: boolean;
    basePrice?: number;
  } | null;

  const { data: ticketProductsRes, isLoading: ticketsLoading } =
    useShowtimeTicketProducts(showtimeId);
  const ticketProducts = useMemo(() => {
    const raw = ticketProductsRes?.data ?? ticketProductsRes;
    return Array.isArray(raw) ? (raw as TicketProduct[]) : [];
  }, [ticketProductsRes]);

  const { data: seatsData, isLoading, error, refetch } = useShowtimeSeats(showtimeId);
  const seatsPayload = (seatsData?.data ?? seatsData) as ShowtimeSeatsPayload | Seat[] | null;
  const roomMeta =
    seatsPayload && !Array.isArray(seatsPayload) && typeof seatsPayload === "object"
      ? seatsPayload.room
      : undefined;
  const seats: Seat[] = Array.isArray(seatsPayload)
    ? seatsPayload
    : ((seatsPayload as ShowtimeSeatsPayload | null)?.seats ?? []);

  const requiredSeatCount = useMemo(
    () => requiredSeatCountFromTickets(ticketProducts, ticketQuantities),
    [ticketProducts, ticketQuantities],
  );
  const ticketTotal = useMemo(
    () => ticketLinesTotal(ticketProducts, ticketQuantities),
    [ticketProducts, ticketQuantities],
  );

  const seatArray: Seat[] = useMemo(
    () =>
      (Array.isArray(seats) ? seats : []).map((s) => {
        const anySeat = s as unknown as {
          row?: string;
          rowLabel?: string;
          price?: number | string | null;
          pairId?: string | null;
          gridCol?: number | null;
        };
        const rawPrice = anySeat.price ?? 0;
        const price =
          typeof rawPrice === "string"
            ? Number(rawPrice)
            : typeof rawPrice === "number"
              ? rawPrice
              : 0;
        return {
          ...(s as Seat),
          row: anySeat.row ?? anySeat.rowLabel ?? (s as Seat).row,
          price: Number.isFinite(price) ? price : 0,
          pairId: anySeat.pairId ?? (s as Seat).pairId,
          gridCol: anySeat.gridCol ?? (s as Seat).gridCol,
        };
      }),
    [seats],
  );

  const holdMutation = useHoldSeats();
  const releaseMutation = useReleaseHold();
  const { conflictedSeatIds: realtimeConflicts, clearConflicts: clearRealtimeConflicts } =
    useSeatRealtime(showtimeId, selectedSeats);

  const allConflicts = [...new Set([...conflictedSeatIds, ...realtimeConflicts])];

  const seatById = useMemo(() => new Map(seatArray.map((s) => [s.id, s])), [seatArray]);

  const toggleSeatSelection = useCallback(
    (seatId: string) => {
      setConflictedSeatIds([]);
      clearRealtimeConflicts();
      const seat = seatById.get(seatId);
      if (!seat) return;

      setSelectedSeats((prev) => {
        const ids = new Set(prev);
        const partnerId =
          seat.type === "COUPLE" && seat.pairId ? seat.pairId : null;

        if (ids.has(seatId)) {
          ids.delete(seatId);
          if (partnerId) ids.delete(partnerId);
          return [...ids];
        }

        const addIds = partnerId ? [seatId, partnerId] : [seatId];
        const cap = requiredSeatCount > 0 ? requiredSeatCount : undefined;
        if (cap != null && ids.size + addIds.length > cap) {
          return prev;
        }
        for (const id of addIds) ids.add(id);
        return [...ids];
      });
    },
    [seatById, clearRealtimeConflicts, requiredSeatCount],
  );

  const handleSeatClick = toggleSeatSelection;

  const handleTicketQtyChange = (code: TicketProductCode, quantity: number) => {
    setTicketQuantities((prev) => ({ ...prev, [code]: quantity }));
    setSelectedSeats([]);
    setHoldId(null);
    setExpiresAt(null);
  };

  const handleHoldSeats = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    setConflictedSeatIds([]);
    try {
      const freshResult = await refetch();
      const freshPayload = freshResult.data?.data ?? freshResult.data;
      const freshSeats = seatsFromSeatsPayload(freshPayload);
      const unavailable = selectedSeats.filter((id) => {
        const seat = freshSeats.find((s) => s.id === id);
        return !seat || getSeatUiStatus(seat) !== "AVAILABLE";
      });
      if (unavailable.length > 0) {
        setConflictedSeatIds(unavailable);
        setSelectedSeats((prev) => prev.filter((id) => !unavailable.includes(id)));
        toast.error(tb("seatsConflictMessage"));
        return;
      }

      const ticketLines = buildTicketLinesPayload(ticketQuantities);
      const response = await holdMutation.mutateAsync({
        showtimeId,
        seatIds: selectedSeats,
        ...(ticketLines.length > 0 ? { ticketLines } : {}),
      });
      const payload = response?.data ?? response;
      const holdIdVal =
        typeof payload === "object" && payload && "holdId" in payload
          ? (payload as { holdId?: string }).holdId
          : typeof payload === "object" && payload && "id" in payload
            ? (payload as { id?: string }).id
          : (response as { holdId?: string }).holdId;
      const expiresAtVal =
        typeof payload === "object" && payload && "expiresAt" in payload
          ? (payload as { expiresAt: string }).expiresAt
          : (response as { expiresAt?: string }).expiresAt;
      setHoldId(holdIdVal ?? null);
      setExpiresAt(normalizeIsoDate(expiresAtVal));
      setConflictedSeatIds([]);
      clearRealtimeConflicts();
      void refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(`/booking/${showtimeId}`)}`);
        return;
      }
      const failed = extractConflictedSeatIds(err);
      if (failed.length > 0) {
        setConflictedSeatIds(failed);
        setSelectedSeats((prev) => prev.filter((id) => !failed.includes(id)));
        toast.error(tb("seatsConflictMessage"));
      } else {
        setSelectedSeats([]);
        toast.error(
          err instanceof ApiError ? err.message || tb("seatsConflictMessage") : tb("seatsConflictMessage")
        );
      }
      void refetch();
    }
  }, [selectedSeats, showtimeId, holdMutation, router, ticketQuantities, refetch, tb, clearRealtimeConflicts]);

  const handleExpire = useCallback(async () => {
    if (expiringRef.current) return;
    expiringRef.current = true;
    try {
      setExpireModalOpen(true);
      if (holdId) {
        try {
          await releaseMutation.mutateAsync(holdId);
        } catch {
          // ignore
        }
      }
      setHoldId(null);
      setExpiresAt(null);
      setSelectedSeats([]);
      refetch();
    } finally {
      expiringRef.current = false;
    }
  }, [holdId, releaseMutation, refetch]);

  const closeExpireModal = useCallback(() => {
    setExpireModalOpen(false);
  }, []);

  const handleProceed = () => {
    if (!holdId) return;
    router.push(`/checkout/${holdId}`);
  };

  // Intentionally avoid releasing on unmount.
  // Holds are time-limited server-side; releasing on unmount can cause loops if the
  // page remounts during dev/hydration transitions.

  const selectedSeatDetails = seatArray.filter((s) => selectedSeats.includes(s.id));
  const totalPrice =
    ticketProducts.length > 0 && requiredSeatCount > 0
      ? ticketTotal
      : selectedSeatDetails.reduce((sum, seat) => sum + (seat.price ?? 0), 0);

  const seatTypeStats = useMemo(() => {
    const byType = new Map<string, { count: number; min: number; max: number }>();
    for (const seat of seatArray) {
      const rawType =
        (seat as { type?: string; seatType?: string }).type ??
        (seat as { seatType?: string }).seatType ??
        "STANDARD";
      const type = String(rawType);
      if (type !== "STANDARD" && type !== "VIP" && type !== "COUPLE") continue;
      const price = typeof seat.price === "number" ? seat.price : 0;
      const cur = byType.get(type);
      if (!cur) byType.set(type, { count: 1, min: price, max: price });
      else
        byType.set(type, {
          count: cur.count + 1,
          min: Math.min(cur.min, price),
          max: Math.max(cur.max, price),
        });
    }
    return byType;
  }, [seatArray]);

  const seatTypeLabel = (typeKey: string) => {
    if (typeKey === "VIP") return tb("vip");
    if (typeKey === "COUPLE") return tb("couple");
    if (typeKey === "DISABLED") return tb("disabled");
    if (typeKey === "WHEELCHAIR") return tb("wheelchair");
    return tb("standard");
  };

  const startDate = useMemo(() => {
    const raw = showtime?.startTime;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  }, [showtime?.startTime]);

  const pageLoading =
    authLoading || !isAuthenticated || isLoading || (bookingStep === "tickets" && ticketsLoading);

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Cinematic backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
        {showtime?.moviePosterUrl ? (
          <div className="absolute inset-0 opacity-25 blur-[2px]">
            <RemoteImage
              src={showtime.moviePosterUrl}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="cinect-hero-glow absolute inset-0" />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Showtime header */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[auto,minmax(0,1fr)] lg:items-start">
          <div className="hidden shrink-0 lg:block">
            <Card className="w-36 overflow-hidden shadow-md xl:w-40">
              <div className="bg-muted relative aspect-[2/3]">
                {showtime?.moviePosterUrl ? (
                  <RemoteImage
                    src={showtime.moviePosterUrl}
                    alt={showtime?.movieTitle ?? tb("moviePosterAlt")}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Ticket className="text-muted-foreground h-10 w-10" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="cinect-glass border-border/60">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
                    <MonitorPlay className="h-4 w-4" />
                    {bookingStep === "tickets" ? tb("ticketStepEyebrow") : tb("seatSelectionEyebrow")}
                  </div>
                  <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                    {showtime?.movieTitle ?? tb("selectYourSeatsFallback")}
                  </h1>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {showtime?.cinemaName && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {showtime.cinemaName}
                        {showtime?.roomName
                          ? ` • ${localizeRoomName(showtime.roomName, (k, v) => tShow(k, v))}`
                          : ""}
                      </span>
                    )}
                    {startDate && (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {format(startDate, "PPP", { locale: dateFnsLocale })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {format(startDate, "p", { locale: dateFnsLocale })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {showtime?.format && <Badge variant="outline">{showtime.format}</Badge>}
                  {showtime?.language && (
                    <Badge variant="outline">
                      {localizeAudioLabel(showtime.language, (k) => tShow(k))}
                    </Badge>
                  )}
                  {showtime?.subtitles && (
                    <Badge variant="outline">
                      {localizeAudioLabel(showtime.subtitles, (k) => tShow(k))}
                    </Badge>
                  )}
                  {showtime?.memberExclusive && <Badge>{tb("membersBadge")}</Badge>}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="outline">
                  {typeof showtime?.availableSeats === "number"
                    ? tb("availableSeatsCount", { count: showtime.availableSeats })
                    : tb("liveAvailability")}
                </Badge>
                <Badge variant="outline">
                  {tb("baseFrom")}{" "}
                  {typeof showtime?.basePrice === "number" && Number.isFinite(showtime.basePrice)
                    ? formatPrice(showtime.basePrice)
                    : "—"}
                </Badge>
              </div>

              {/* Pricing chips */}
              {seatTypeStats.size > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {["STANDARD", "VIP", "COUPLE"].map((type) => {
                    const s = seatTypeStats.get(type);
                    if (!s || s.count <= 0) return null;
                    const label = seatTypeLabel(type);
                    const priceLabel =
                      Number.isFinite(s.min) && Number.isFinite(s.max)
                        ? s.min === s.max
                          ? formatPrice(s.min)
                          : `${formatPrice(s.min)}–${formatPrice(s.max)}`
                        : "—";
                    return (
                      <Badge key={type} variant="outline" className="gap-2">
                        <span className="font-semibold">{label}</span>
                        <span className="text-muted-foreground">{priceLabel}</span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {bookingStep === "tickets" ? (
            <TicketTypePicker
              products={ticketProducts}
              quantities={ticketQuantities}
              onChange={handleTicketQtyChange}
            />
          ) : (
            <Card className="cinect-glass border-border/60">
              <CardContent className="pt-6">
                <SeatMap
                  seats={seatArray}
                  selectedSeats={selectedSeats}
                  onSeatClick={handleSeatClick}
                  disabled={!!holdId}
                  conflictedSeatIds={!holdId && allConflicts.length > 0 ? allConflicts : undefined}
                  layoutTemplate={roomMeta?.layoutTemplate}
                  aisleAfterCol={roomMeta?.aisleAfterCol}
                  roomName={
                    showtime?.roomName
                      ? localizeRoomName(showtime.roomName, (k, v) => tShow(k, v))
                      : roomMeta?.name
                  }
                  maxSelectable={requiredSeatCount > 0 ? requiredSeatCount : undefined}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sticky sidebar (desktop) */}
        <div className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <Card className="cinect-glass border-border/60">
            <CardHeader>
              <CardTitle>{tb("bookingSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMobile && expiresAt && (
                <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
              )}

              {allConflicts.length > 0 && !holdId && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {tb("seatsConflictMessage")}
                  </AlertDescription>
                </Alert>
              )}

              {bookingStep === "tickets" && requiredSeatCount === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tb("selectSeatHint")}</AlertDescription>
                </Alert>
              )}

              {bookingStep === "seats" &&
                selectedSeats.length === 0 &&
                !holdId &&
                allConflicts.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {requiredSeatCount > 0
                        ? tb("seatsRequired", { count: requiredSeatCount })
                        : tb("selectSeatHint")}
                    </AlertDescription>
                  </Alert>
                )}

              {bookingStep === "seats" && (
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={holdId != null}
                  onClick={() => {
                    setBookingStep("tickets");
                    setSelectedSeats([]);
                  }}
                >
                  {tb("backToTickets")}
                </Button>
              )}

              {bookingStep === "tickets" && ticketTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tb("ticketTotal")}:</span>
                  <span className="text-lg font-bold tabular-nums">{formatPrice(ticketTotal)}</span>
                </div>
              )}

              {bookingStep === "seats" && requiredSeatCount > 0 && (
                <div className="text-muted-foreground text-sm">
                  {tb("seatsSelectedOfRequired", {
                    selected: selectedSeats.length,
                    required: requiredSeatCount,
                  })}
                </div>
              )}

              {bookingStep === "seats" && selectedSeats.length > 0 && (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tb("seatsCountLabel")}:</span>
                      <span className="font-medium">{selectedSeats.length}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {selectedSeatDetails.map((seat) => (
                        <div key={seat.id} className="flex items-center gap-2">
                          <span className="font-semibold">
                            {seat.row}
                            {seat.number}
                          </span>
                          <span className="text-muted-foreground">
                            {seatTypeLabel(
                              ((seat as { type?: string }).type ??
                                (seat as { seatType?: string }).seatType ??
                                "STANDARD") as string
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const counts = selectedSeatDetails.reduce(
                          (acc, s) => {
                            const kind =
                              (s as { type?: string; seatType?: string }).type ??
                              (s as { seatType?: string }).seatType ??
                              "STANDARD";
                            const key = String(kind);
                            acc[key] = (acc[key] ?? 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        );
                        return Object.entries(counts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([k, v]) => (
                            <Badge key={k} variant="outline" className="gap-2">
                              <span className="font-semibold">{seatTypeLabel(k)}</span>
                              <span className="text-muted-foreground">{v}</span>
                            </Badge>
                          ));
                      })()}
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tb("totalLabel")}:</span>
                      <span className="text-lg font-bold tabular-nums">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {bookingStep === "tickets" ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={requiredSeatCount === 0}
                  onClick={() => setBookingStep("seats")}
                >
                  {tb("continueToSeats")}
                </Button>
              ) : !holdId ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    selectedSeats.length === 0 ||
                    holdMutation.isPending ||
                    (requiredSeatCount > 0 && selectedSeats.length !== requiredSeatCount)
                  }
                  onClick={() => void handleHoldSeats()}
                >
                  {holdMutation.isPending ? tb("holding") : tb("continueBooking")}
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleProceed}>
                  {tb("proceedToCheckout")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="cinect-glass fixed inset-x-0 bottom-0 z-40 border-t p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {isMobile && expiresAt && <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">
                {bookingStep === "tickets"
                  ? tb("ticketTotal")
                  : holdId
                    ? tb("seatsHeldStatus")
                    : requiredSeatCount > 0
                      ? tb("seatsSelectedOfRequired", {
                          selected: selectedSeats.length,
                          required: requiredSeatCount,
                        })
                      : tb("seatsSelectedCount", { count: selectedSeats.length })}
              </div>
              <div className="text-lg font-bold tabular-nums">{formatPrice(totalPrice)}</div>
            </div>
            {bookingStep === "tickets" ? (
              <Button
                size="lg"
                disabled={requiredSeatCount === 0}
                onClick={() => setBookingStep("seats")}
              >
                {tb("continueToSeats")}
              </Button>
            ) : !holdId ? (
              <Button
                size="lg"
                disabled={
                  selectedSeats.length === 0 ||
                  holdMutation.isPending ||
                  (requiredSeatCount > 0 && selectedSeats.length !== requiredSeatCount)
                }
                onClick={() => void handleHoldSeats()}
              >
                {holdMutation.isPending ? tb("holding") : tb("continueBooking")}
              </Button>
            ) : (
              <Button size="lg" onClick={handleProceed}>
                {tb("proceedShort")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden />

      {/* Hold expiration modal */}
      <Dialog open={expireModalOpen} onOpenChange={setExpireModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tb("holdExpiredTitle")}</DialogTitle>
            <DialogDescription>{tb("holdExpiredDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeExpireModal}>{tb("ok")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
