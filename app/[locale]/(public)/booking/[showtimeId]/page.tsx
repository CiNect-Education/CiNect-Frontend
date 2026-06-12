"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const SeatMap = dynamic(
  () => import("@/components/booking/seat-map").then((m) => m.SeatMap),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto h-[280px] w-full max-w-3xl rounded-lg" />,
  },
);
import {
  TicketTypePicker,
  buildTicketLinesPayload,
  ticketLinesTotal,
} from "@/components/booking/ticket-type-picker";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiErrorState } from "@/components/system/api-error-state";
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
import {
  formatVnd,
  localizeAudioLabel,
  localizeRoomFormat,
  localizeRoomName,
} from "@/lib/showtime-display";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import {
  analyzeTicketSeatPlan,
  getSeatClickBlockReason,
  groupSeatsForDisplay,
  resolveBookingNoticeMessage,
  sumSeatPrices,
  validateTicketSeatSelection,
} from "@/lib/seat-selection";
import { SeatSelectionList } from "@/components/booking/seat-selection-list";
import { CinestarNoticeDialog } from "@/components/booking/cinestar-notice-dialog";

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

const CONCESSION_NOTICE_STORAGE_KEY = "cinect_concession_notice_seen_v1";

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
  >({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [conflictedSeatIds, setConflictedSeatIds] = useState<string[]>([]);
  const [expireModalOpen, setExpireModalOpen] = useState(false);
  const [seatNoticeMessage, setSeatNoticeMessage] = useState<string | null>(null);
  const [concessionNoticeOpen, setConcessionNoticeOpen] = useState(false);
  const [pendingConcessionQty, setPendingConcessionQty] = useState<{
    previous: number;
    next: number;
  } | null>(null);
  const [hasSeenConcessionNotice, setHasSeenConcessionNotice] = useState(false);

  const expiringRef = useRef(false);

  useEffect(() => {
    try {
      setHasSeenConcessionNotice(window.localStorage.getItem(CONCESSION_NOTICE_STORAGE_KEY) === "1");
    } catch {
      setHasSeenConcessionNotice(false);
    }
  }, []);

  const markConcessionNoticeSeen = useCallback(() => {
    setHasSeenConcessionNotice(true);
    try {
      window.localStorage.setItem(CONCESSION_NOTICE_STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures and keep the in-memory guard.
    }
  }, []);

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
  const seatsPayloadShowtime =
    seatsPayload && !Array.isArray(seatsPayload) && typeof seatsPayload === "object"
      ? seatsPayload.showtime
      : undefined;
  const roomMeta =
    seatsPayload && !Array.isArray(seatsPayload) && typeof seatsPayload === "object"
      ? seatsPayload.room
      : undefined;
  const seats: Seat[] = Array.isArray(seatsPayload)
    ? seatsPayload
    : ((seatsPayload as ShowtimeSeatsPayload | null)?.seats ?? []);

  const hasCoupleSeatsInRoom = useMemo(
    () => seats.some((seat) => String(seat.type).toUpperCase() === "COUPLE"),
    [seats],
  );

  const visibleTicketProducts = useMemo(() => {
    if (seats.length > 0 && !hasCoupleSeatsInRoom) {
      return ticketProducts.filter((product) => product.code !== "ADULT_DOUBLE");
    }
    return ticketProducts;
  }, [ticketProducts, hasCoupleSeatsInRoom, seats.length]);

  useEffect(() => {
    if (visibleTicketProducts.length === 0) return;
    setTicketQuantities((prev) => {
      const validCodes = new Set(visibleTicketProducts.map((p) => p.code));
      const pruned = Object.fromEntries(
        Object.entries(prev).filter(([code]) => validCodes.has(code as TicketProductCode)),
      ) as Partial<Record<TicketProductCode, number>>;
      const hasSelection = visibleTicketProducts.some((p) => (pruned[p.code] ?? 0) > 0);
      if (hasSelection) return pruned;
      const defaultProduct =
        visibleTicketProducts.find((p) => p.code === "ADULT_SINGLE") ??
        visibleTicketProducts[0];
      return { [defaultProduct.code]: 1 };
    });
  }, [visibleTicketProducts]);

  const ticketSeatPlan = useMemo(
    () => analyzeTicketSeatPlan(ticketQuantities),
    [ticketQuantities],
  );
  const requiredDisplayUnits = ticketSeatPlan.totalDisplayUnits;
  const ticketTotal = useMemo(
    () => ticketLinesTotal(visibleTicketProducts, ticketQuantities),
    [visibleTicketProducts, ticketQuantities],
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

  const selectedSeatDetails = useMemo(
    () => seatArray.filter((s) => selectedSeats.includes(s.id)),
    [seatArray, selectedSeats],
  );
  const selectedSeatUnits = useMemo(
    () => groupSeatsForDisplay(selectedSeatDetails),
    [selectedSeatDetails],
  );

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
        const nextSeats = seatArray.filter((s) => ids.has(s.id) || addIds.includes(s.id));
        const nextUnits = groupSeatsForDisplay(nextSeats);
        if (
          requiredDisplayUnits > 0 &&
          nextUnits.length > requiredDisplayUnits
        ) {
          return prev;
        }
        for (const id of addIds) ids.add(id);
        return [...ids];
      });
    },
    [seatById, clearRealtimeConflicts, requiredDisplayUnits, seatArray],
  );

  const handleSeatClick = useCallback(
    (seatId: string) => {
      const seat = seatById.get(seatId);
      if (!seat) return;
      const blockReason = getSeatClickBlockReason(
        ticketSeatPlan,
        seat,
        selectedSeatDetails,
      );
      if (blockReason) {
        setSeatNoticeMessage(resolveBookingNoticeMessage(tb, blockReason));
        return;
      }
      toggleSeatSelection(seatId);
    },
    [seatById, ticketSeatPlan, selectedSeatDetails, tb, toggleSeatSelection],
  );

  const applyTicketQtyChange = useCallback((code: TicketProductCode, quantity: number) => {
    setTicketQuantities((prev) => ({ ...prev, [code]: quantity }));
    setSelectedSeats([]);
    setHoldId(null);
    setExpiresAt(null);
  }, []);

  const handleTicketQtyChange = (code: TicketProductCode, quantity: number) => {
    if (code === "CONCESSION_SINGLE") {
      const previous = ticketQuantities.CONCESSION_SINGLE ?? 0;
      if (quantity > previous && !hasSeenConcessionNotice) {
        setPendingConcessionQty({ previous, next: quantity });
        setConcessionNoticeOpen(true);
        return;
      }
    }
    applyTicketQtyChange(code, quantity);
  };

  const handleConfirmConcessionNotice = useCallback(() => {
    if (!pendingConcessionQty) return;
    markConcessionNoticeSeen();
    applyTicketQtyChange("CONCESSION_SINGLE", pendingConcessionQty.next);
    setPendingConcessionQty(null);
  }, [applyTicketQtyChange, markConcessionNoticeSeen, pendingConcessionQty]);

  const handleCancelConcessionNotice = useCallback(() => {
    markConcessionNoticeSeen();
    setPendingConcessionQty(null);
  }, [markConcessionNoticeSeen]);

  const totalPrice =
    bookingStep === "seats" && selectedSeatDetails.length > 0
      ? sumSeatPrices(selectedSeatDetails)
      : ticketTotal;

  const handleHoldSeats = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    const ticketError = validateTicketSeatSelection(
      visibleTicketProducts,
      ticketQuantities,
      selectedSeatDetails,
    );
    if (ticketError) {
      setSeatNoticeMessage(resolveBookingNoticeMessage(tb, ticketError));
      return;
    }
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
      } else if (err instanceof ApiError && err.status === 400) {
        setSeatNoticeMessage(err.message || resolveBookingNoticeMessage(tb, "seatCountMismatch"));
      } else {
        setSelectedSeats([]);
        toast.error(
          err instanceof ApiError ? err.message || tb("seatsConflictMessage") : tb("seatsConflictMessage")
        );
      }
      void refetch();
    }
  }, [
    selectedSeats,
    selectedSeatDetails,
    showtimeId,
    holdMutation,
    router,
    ticketQuantities,
    visibleTicketProducts,
    refetch,
    tb,
    clearRealtimeConflicts,
  ]);

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

  const liveAvailableCount = useMemo(
    () => seatArray.filter((seat) => getSeatUiStatus(seat) === "AVAILABLE").length,
    [seatArray],
  );

  const displayRoomName = useMemo(() => {
    const raw = showtime?.roomName ?? roomMeta?.name;
    if (!raw) return null;
    return localizeRoomName(raw, (k, v) => tShow(k, v));
  }, [showtime?.roomName, roomMeta?.name, tShow]);

  const displayFormat = useMemo(() => {
    const raw = showtime?.format ?? seatsPayloadShowtime?.format ?? roomMeta?.format;
    if (!raw) return null;
    return localizeRoomFormat(raw, (k) => tShow(k));
  }, [showtime?.format, seatsPayloadShowtime?.format, roomMeta?.format, tShow]);

  const selectedTicketLines = useMemo(
    () =>
      visibleTicketProducts
        .map((product) => ({
          product,
          quantity: ticketQuantities[product.code] ?? 0,
        }))
        .filter((line) => line.quantity > 0),
    [visibleTicketProducts, ticketQuantities],
  );

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
    if (typeKey === "COUPLE") return tb("coupleSeatType");
    if (typeKey === "DISABLED") return tb("disabled");
    if (typeKey === "WHEELCHAIR") return tb("wheelchair");
    return tb("standard");
  };

  const startDate = useMemo(() => {
    const raw = showtime?.startTime ?? seatsPayloadShowtime?.startTime;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  }, [showtime?.startTime, seatsPayloadShowtime?.startTime]);

  const ticketProductLabel = useCallback(
    (product: TicketProduct) =>
      locale.startsWith("vi") ? product.labelVi : product.labelEn,
    [locale],
  );

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
            <div className="w-36 overflow-hidden rounded-lg xl:w-40">
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
            </div>
          </div>

          <div className="min-w-0 pb-2">
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
                        {displayRoomName ? ` • ${displayRoomName}` : ""}
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
                  {displayFormat && <Badge variant="outline">{displayFormat}</Badge>}
                  {showtime?.language && (
                    <Badge variant="outline">
                      {tb("audioLanguage", {
                        language: localizeAudioLabel(showtime.language, (k) => tShow(k)),
                      })}
                    </Badge>
                  )}
                  {showtime?.subtitles && (
                    <Badge variant="outline">
                      {tb("subtitlesLanguage", {
                        language: localizeAudioLabel(showtime.subtitles, (k) => tShow(k)),
                      })}
                    </Badge>
                  )}
                  {showtime?.memberExclusive && <Badge>{tb("membersBadge")}</Badge>}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="outline">
                  {seatArray.length > 0
                    ? tb("availableSeatsCount", { count: liveAvailableCount })
                    : tb("liveAvailability")}
                </Badge>
              </div>

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
                        : tb("priceUnavailable");
                    return (
                      <Badge key={type} variant="outline" className="gap-2">
                        <span className="font-semibold">{label}</span>
                        <span className="text-muted-foreground">{priceLabel}</span>
                      </Badge>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {bookingStep === "tickets" ? (
            <TicketTypePicker
              products={visibleTicketProducts}
              quantities={ticketQuantities}
              onChange={handleTicketQtyChange}
            />
          ) : (
            <div className="py-1">
                <SeatMap
                  seats={seatArray}
                  selectedSeats={selectedSeats}
                  onSeatClick={handleSeatClick}
                  disabled={!!holdId}
                  conflictedSeatIds={!holdId && allConflicts.length > 0 ? allConflicts : undefined}
                  layoutTemplate={roomMeta?.layoutTemplate}
                  aisleAfterCol={roomMeta?.aisleAfterCol}
                  maxSelectableUnits={
                    requiredDisplayUnits > 0 ? requiredDisplayUnits : undefined
                  }
                  ticketSeatPlan={ticketSeatPlan}
                />
            </div>
          )}
        </div>

        {/* Sticky sidebar (desktop) */}
        <div className="hidden lg:sticky lg:top-4 lg:block lg:self-start lg:border-l lg:border-border/20 lg:pl-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{tb("bookingSummary")}</h2>
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

              {bookingStep === "tickets" && requiredDisplayUnits === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tb("selectTicketHint")}</AlertDescription>
                </Alert>
              )}

              {bookingStep === "tickets" && selectedTicketLines.length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{tb("selectedTicketTypes")}</p>
                  <ul className="space-y-1.5">
                    {selectedTicketLines.map(({ product, quantity }) => (
                      <li key={product.code} className="flex justify-between gap-3">
                        <span className="text-muted-foreground min-w-0">
                          {ticketProductLabel(product)} × {quantity}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {formatPrice(quantity * product.unitPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bookingStep === "seats" &&
                selectedSeats.length === 0 &&
                !holdId &&
                allConflicts.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {requiredDisplayUnits > 0
                        ? ticketSeatPlan.mode === "double_only"
                          ? tb("coupleSeatsRequired", { count: requiredDisplayUnits })
                          : tb("seatsRequired", { count: requiredDisplayUnits })
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
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tb("ticketTotal")}:</span>
                    <span className="text-lg font-bold tabular-nums">{formatPrice(ticketTotal)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{tb("ticketEstimateNote")}</p>
                </>
              )}

              {bookingStep === "seats" && requiredDisplayUnits > 0 && (
                <div className="text-muted-foreground text-sm">
                  {ticketSeatPlan.mode === "double_only"
                    ? tb("coupleSeatsSelectedOfRequired", {
                        selected: selectedSeatUnits.length,
                        required: requiredDisplayUnits,
                      })
                    : tb("seatsSelectedOfRequired", {
                        selected: selectedSeatUnits.length,
                        required: requiredDisplayUnits,
                      })}
                </div>
              )}

              {bookingStep === "seats" && selectedSeats.length > 0 && (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ticketSeatPlan.mode === "double_only"
                          ? tb("coupleSeatsCountLabel")
                          : tb("seatsCountLabel")}
                        :
                      </span>
                      <span className="font-medium">{selectedSeatUnits.length}</span>
                    </div>
                    <SeatSelectionList units={selectedSeatUnits} compact />
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
                  disabled={requiredDisplayUnits === 0}
                  onClick={() => setBookingStep("seats")}
                >
                  {tb("continueToSeats")}
                </Button>
              ) : !holdId ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    selectedSeatUnits.length === 0 ||
                    holdMutation.isPending ||
                    (requiredDisplayUnits > 0 &&
                      selectedSeatUnits.length !== requiredDisplayUnits)
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
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t border-border/25 p-4 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {isMobile && expiresAt && <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">
                {bookingStep === "tickets"
                  ? tb("ticketTotal")
                  : holdId
                    ? tb("seatsHeldStatus")
                    : requiredDisplayUnits > 0
                      ? ticketSeatPlan.mode === "double_only"
                        ? tb("coupleSeatsSelectedOfRequired", {
                            selected: selectedSeatUnits.length,
                            required: requiredDisplayUnits,
                          })
                        : tb("seatsSelectedOfRequired", {
                            selected: selectedSeatUnits.length,
                            required: requiredDisplayUnits,
                          })
                      : tb("seatsSelectedCount", { count: selectedSeatUnits.length })}
              </div>
              <div className="text-lg font-bold tabular-nums">{formatPrice(totalPrice)}</div>
            </div>
            {bookingStep === "tickets" ? (
              <Button
                size="lg"
                disabled={requiredDisplayUnits === 0}
                onClick={() => setBookingStep("seats")}
              >
                {tb("continueToSeats")}
              </Button>
            ) : !holdId ? (
              <Button
                size="lg"
                disabled={
                  selectedSeatUnits.length === 0 ||
                  holdMutation.isPending ||
                  (requiredDisplayUnits > 0 &&
                    selectedSeatUnits.length !== requiredDisplayUnits)
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

      <CinestarNoticeDialog
        open={seatNoticeMessage != null}
        onOpenChange={(open) => {
          if (!open) setSeatNoticeMessage(null);
        }}
        message={seatNoticeMessage ?? ""}
      />

      <CinestarNoticeDialog
        open={concessionNoticeOpen}
        onOpenChange={setConcessionNoticeOpen}
        title={null}
        message={tb("cinestarNoticeConcession")}
        showCancel
        onConfirm={handleConfirmConcessionNotice}
        onCancel={handleCancelConcessionNotice}
      />

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
