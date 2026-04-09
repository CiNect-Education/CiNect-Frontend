"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { SeatMap } from "@/components/booking/seat-map";
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
import { useShowtimeSeats, useHoldSeats, useReleaseHold } from "@/hooks/queries/use-booking-flow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiError } from "@/lib/api-client";
import { AlertCircle, Calendar, Clock, MapPin, MonitorPlay, Ticket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Seat } from "@/types/domain";
import { useSeatRealtime } from "@/hooks/use-seat-realtime";
import { useShowtime } from "@/hooks/queries/use-cinemas";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { vi as viDateLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, localizeAudioLabel, localizeRoomName } from "@/lib/showtime-display";
import { useAuth } from "@/providers/auth-provider";

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
    router.replace(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authLoading, isAuthenticated, locale, pathname, router, searchParams]);

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

  const { data: seatsData, isLoading, error, refetch } = useShowtimeSeats(showtimeId);
  const seatsPayload = seatsData?.data ?? (seatsData as unknown);
  const seats =
    Array.isArray(seatsPayload)
      ? (seatsPayload as Seat[])
      : ((seatsPayload as { seats?: Seat[] } | null)?.seats ?? []);
  const holdMutation = useHoldSeats();
  const releaseMutation = useReleaseHold();
  const { conflictedSeatIds: realtimeConflicts, clearConflicts: clearRealtimeConflicts } =
    useSeatRealtime(showtimeId, selectedSeats);

  const allConflicts = [...new Set([...conflictedSeatIds, ...realtimeConflicts])];

  const handleSeatClick = (seatId: string) => {
    setConflictedSeatIds([]);
    clearRealtimeConflicts();
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const handleHoldSeats = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    setConflictedSeatIds([]);
    try {
      const response = await holdMutation.mutateAsync({
        showtimeId,
        seatIds: selectedSeats,
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
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const returnTo = `/${locale}/booking/${showtimeId}`;
        router.push(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const failed = extractConflictedSeatIds(err);
      if (failed.length > 0) {
        setConflictedSeatIds(failed);
        setSelectedSeats((prev) => prev.filter((id) => !failed.includes(id)));
      } else {
        setSelectedSeats([]);
      }
    }
  }, [selectedSeats, showtimeId, holdMutation, router, locale]);

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
    router.push(`/${locale}/checkout/${holdId}`);
  };

  // Intentionally avoid releasing on unmount.
  // Holds are time-limited server-side; releasing on unmount can cause loops if the
  // page remounts during dev/hydration transitions.

  const seatArray: Seat[] = (Array.isArray(seats) ? seats : []).map((s) => {
    const anySeat = s as unknown as {
      row?: string;
      rowLabel?: string;
      price?: number | string | null;
    };
    const rawPrice = anySeat.price ?? 0;
    const price =
      typeof rawPrice === "string" ? Number(rawPrice) : typeof rawPrice === "number" ? rawPrice : 0;
    return {
      ...(s as Seat),
      row: anySeat.row ?? anySeat.rowLabel ?? (s as Seat).row,
      price: Number.isFinite(price) ? price : 0,
    };
  });
  const selectedSeatDetails = seatArray.filter((s) => selectedSeats.includes(s.id));
  const totalPrice = selectedSeatDetails.reduce((sum, seat) => sum + (seat.price ?? 0), 0);

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

  const handleAutoPickSeats = () => {
    const availableSeats = seatArray.filter((seat) => {
      const status =
        (seat as { status?: string }).status !== undefined
          ? (seat as { status?: string }).status
          : seat.status;
      const type =
        (seat as { type?: string }).type ??
        (seat as { seatType?: string }).seatType ??
        "STANDARD";
      return status === "AVAILABLE" && type !== "DISABLED";
    });
    if (availableSeats.length === 0 || holdId) return;

    const seatsByRow = availableSeats.reduce(
      (acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
      },
      {} as Record<string, Seat[]>
    );

    Object.values(seatsByRow).forEach((rowSeats) =>
      rowSeats.sort((a, b) => a.number - b.number)
    );

    const desiredCount = selectedSeats.length > 0 ? selectedSeats.length : 2;
    let bestGroup: Seat[] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const rowSeats of Object.values(seatsByRow)) {
      if (rowSeats.length < desiredCount) continue;
      const rowCenter = (rowSeats.length - 1) / 2;
      for (let i = 0; i <= rowSeats.length - desiredCount; i++) {
        const group = rowSeats.slice(i, i + desiredCount);
        const isContiguous = group.every(
          (seat, idx) => idx === 0 || seat.number === group[idx - 1].number + 1
        );
        if (!isContiguous) continue;
        const groupCenter = i + (desiredCount - 1) / 2;
        const score = Math.abs(groupCenter - rowCenter);
        if (score < bestScore) {
          bestScore = score;
          bestGroup = group;
        }
      }
    }

    if (bestGroup && bestGroup.length > 0) {
      setConflictedSeatIds([]);
      clearRealtimeConflicts();
      setSelectedSeats(bestGroup.map((s) => s.id));
    }
  };

  if (authLoading || !isAuthenticated || isLoading) {
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
            <Image
              src={showtime.moviePosterUrl}
              alt=""
              fill
              sizes="100vw"
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
        <div className="mb-6 grid gap-4 lg:grid-cols-[240px,1fr]">
          <div className="hidden lg:block">
            <Card className="overflow-hidden">
              <div className="bg-muted relative aspect-[2/3]">
                {showtime?.moviePosterUrl ? (
                  <Image
                    src={showtime.moviePosterUrl}
                    alt={showtime?.movieTitle ?? tb("moviePosterAlt")}
                    fill
                    sizes="240px"
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
                    {tb("seatSelectionEyebrow")}
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground text-sm">
                  {tb("seatMapTip")}
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
          <Card className="cinect-glass border-border/60">
            <CardContent className="pt-6">
              <SeatMap
                seats={seatArray}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                disabled={!!holdId}
                conflictedSeatIds={allConflicts.length > 0 ? allConflicts : undefined}
              />
            </CardContent>
          </Card>
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

              {allConflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {tb("seatsConflictMessage")}
                  </AlertDescription>
                </Alert>
              )}

              {selectedSeats.length === 0 && !holdId && allConflicts.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {tb("selectSeatHint")}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                disabled={holdId != null || seatArray.length === 0}
                onClick={handleAutoPickSeats}
              >
                {tb("chooseBestSeats")}
              </Button>

              {selectedSeats.length > 0 && (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tb("seatsCountLabel")}:</span>
                      <span className="font-medium">{selectedSeats.length}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {selectedSeatDetails.map((seat) => (
                        <div key={seat.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {seat.row}
                              {seat.number}
                            </div>
                            <div className="text-muted-foreground">
                              {seatTypeLabel(
                                ((seat as { type?: string }).type ??
                                  (seat as { seatType?: string }).seatType ??
                                  "STANDARD") as string
                              )}
                            </div>
                          </div>
                          <div className="font-semibold tabular-nums">
                            {formatPrice(seat.price ?? 0)}
                          </div>
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

              {!holdId ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={selectedSeats.length === 0 || holdMutation.isPending}
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
                {holdId
                  ? tb("seatsHeldStatus")
                  : tb("seatsSelectedCount", { count: selectedSeats.length })}
              </div>
              <div className="text-lg font-bold tabular-nums">{formatPrice(totalPrice)}</div>
            </div>
            {!holdId ? (
              <Button
                size="lg"
                disabled={selectedSeats.length === 0 || holdMutation.isPending}
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
