"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SeatMap } from "@/components/booking/seat-map";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { Button } from "@/components/ui/button";
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
  useHoldSeats,
  useReleaseHold,
} from "@/hooks/queries/use-booking-flow";
import { useSeatRealtime } from "@/hooks/use-seat-realtime";
import { ApiError } from "@/lib/api-client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Seat } from "@/types/domain";

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

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params.showtimeId as string;

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [conflictedSeatIds, setConflictedSeatIds] = useState<string[]>([]);
  const [expireModalOpen, setExpireModalOpen] = useState(false);

  const { data: seatsData, isLoading, error, refetch } = useShowtimeSeats(showtimeId);
  const seats = seatsData?.data ?? (seatsData as unknown as Seat[]);
  const holdMutation = useHoldSeats();
  const releaseMutation = useReleaseHold();
  const {
    conflictedSeatIds: realtimeConflicts,
    clearConflicts: clearRealtimeConflicts,
  } = useSeatRealtime(showtimeId, selectedSeats);

  const allConflicts = [
    ...new Set([...conflictedSeatIds, ...realtimeConflicts]),
  ];

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
      const holdIdVal = typeof payload === "object" && payload && "holdId" in payload
        ? (payload as { holdId: string }).holdId
        : (response as { holdId?: string }).holdId;
      const expiresAtVal = typeof payload === "object" && payload && "expiresAt" in payload
        ? (payload as { expiresAt: string }).expiresAt
        : (response as { expiresAt?: string }).expiresAt;
      setHoldId(holdIdVal ?? null);
      setExpiresAt(expiresAtVal ?? null);
    } catch (err) {
      const failed = extractConflictedSeatIds(err);
      if (failed.length > 0) {
        setConflictedSeatIds(failed);
        setSelectedSeats((prev) => prev.filter((id) => !failed.includes(id)));
      } else {
        setSelectedSeats([]);
      }
    }
  }, [selectedSeats, showtimeId, holdMutation]);

  const handleExpire = useCallback(async () => {
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
  }, [holdId, releaseMutation, refetch]);

  const closeExpireModal = useCallback(() => {
    setExpireModalOpen(false);
  }, []);

  const handleProceed = () => {
    if (!holdId) return;
    router.push(`/checkout/${holdId}`);
  };

  useEffect(() => {
    return () => {
      if (holdId) {
        releaseMutation.mutate(holdId);
      }
    };
  }, [holdId, releaseMutation]);

  const seatArray = Array.isArray(seats) ? seats : [];
  const selectedSeatDetails = seatArray.filter((s) => selectedSeats.includes(s.id));
  const totalPrice = selectedSeatDetails.reduce(
    (sum, seat) => sum + (seat.price ?? 0),
    0
  );

  if (isLoading) {
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Select Your Seats</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <SeatMap
                seats={seatArray}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                disabled={!!holdId}
                conflictedSeatIds={
                  allConflicts.length > 0 ? allConflicts : undefined
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Sticky sidebar (desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expiresAt && (
                <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
              )}

              {allConflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some seats are no longer available. Please select different
                    seats.
                  </AlertDescription>
                </Alert>
              )}

              {selectedSeats.length === 0 && !holdId && allConflicts.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select at least one seat
                  </AlertDescription>
                </Alert>
              )}

              {selectedSeats.length > 0 && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats:</span>
                      <span className="font-medium">{selectedSeats.length}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {selectedSeatDetails.map((seat) => (
                        <div key={seat.id} className="flex justify-between">
                          <span>
                            {seat.row}
                            {seat.number} (
                            {(seat as { type?: string }).type ??
                              (seat as { seatType?: string }).seatType ??
                              "Standard"}
                            )
                          </span>
                          <span>
                            $
                            {(seat.price ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!holdId ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    selectedSeats.length === 0 || holdMutation.isPending
                  }
                  onClick={() => void handleHoldSeats()}
                >
                  {holdMutation.isPending ? "Holding..." : "Continue"}
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleProceed}>
                  Proceed to Checkout
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {expiresAt && (
            <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">
                {holdId
                  ? "Seats held"
                  : `${selectedSeats.length} seat${selectedSeats.length !== 1 ? "s" : ""} selected`}
              </div>
              <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
            </div>
          {!holdId ? (
            <Button
              size="lg"
              disabled={selectedSeats.length === 0 || holdMutation.isPending}
              onClick={() => void handleHoldSeats()}
            >
              {holdMutation.isPending ? "Holding..." : "Continue"}
            </Button>
          ) : (
            <Button size="lg" onClick={handleProceed}>
              Proceed
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
            <DialogTitle>Hold Expired</DialogTitle>
            <DialogDescription>
              Your seat hold has expired. Please select seats again to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeExpireModal}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
