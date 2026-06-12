"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeConnection, type SeatEvent } from "@/lib/realtime";
import type { ApiEnvelope } from "@/types/api";
import type { Seat, ShowtimeSeatsPayload } from "@/types/domain";

const POLL_INTERVAL_MS = 8000;

type SeatsQueryCache =
  | ApiEnvelope<ShowtimeSeatsPayload>
  | { data?: ShowtimeSeatsPayload | Seat[] }
  | Seat[]
  | undefined;

function statusFromEventType(type: SeatEvent["type"]): "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" {
  switch (type) {
    case "SEAT_HELD":
      return "HELD";
    case "SEAT_RELEASED":
    case "HOLD_EXPIRED":
      return "AVAILABLE";
    case "SEAT_BOOKED":
      return "BOOKED";
    default:
      return "AVAILABLE";
  }
}

function patchSeatStatuses(
  seats: Seat[],
  seatIdsSet: Set<string>,
  newStatus: ReturnType<typeof statusFromEventType>
): Seat[] {
  return seats.map((seat) =>
    seatIdsSet.has(seat.id) ? { ...seat, status: newStatus } : seat
  );
}

function patchSeatsQueryCache(
  old: SeatsQueryCache,
  seatIdsSet: Set<string>,
  newStatus: ReturnType<typeof statusFromEventType>
): SeatsQueryCache {
  if (!old) return old;

  if (Array.isArray(old)) {
    return patchSeatStatuses(old, seatIdsSet, newStatus);
  }

  const data = old.data;
  if (Array.isArray(data)) {
    return { ...old, data: patchSeatStatuses(data, seatIdsSet, newStatus) };
  }

  if (data && typeof data === "object" && "seats" in data) {
    const payload = data as ShowtimeSeatsPayload;
    return {
      ...old,
      data: {
        ...payload,
        seats: patchSeatStatuses(payload.seats ?? [], seatIdsSet, newStatus),
      },
    };
  }

  return old;
}

export function useSeatRealtime(showtimeId: string, selectedSeatIds: string[] = []) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<RealtimeConnection | null>(null);
  const selectedRef = useRef(selectedSeatIds);
  const [usePolling, setUsePolling] = useState(true);
  const [conflictedSeatIds, setConflictedSeatIds] = useState<string[]>([]);

  selectedRef.current = selectedSeatIds;

  useEffect(() => {
    const conn = new RealtimeConnection(showtimeId);

    const handleEvent = (event: SeatEvent) => {
      if (event.showtimeId !== showtimeId) return;

      const newStatus = statusFromEventType(event.type);
      const seatIdsSet = new Set(event.seatIds);

      queryClient.setQueryData<SeatsQueryCache>(
        ["showtimes", showtimeId, "seats"],
        (old) => patchSeatsQueryCache(old, seatIdsSet, newStatus)
      );

      // Only BOOKED is a hard conflict. SEAT_HELD also fires for the current user's own hold.
      const selected = selectedRef.current;
      if (event.type === "SEAT_BOOKED" && selected.length > 0) {
        const conflicted = event.seatIds.filter((id) => selected.includes(id));
        if (conflicted.length > 0) {
          setConflictedSeatIds((prev) => Array.from(new Set([...prev, ...conflicted])));
        }
      }
    };

    conn.subscribe(handleEvent);
    conn.connect();

    const checkConnected = () => {
      setUsePolling(!conn.isConnected);
    };
    const t = setTimeout(checkConnected, 2000);

    connectionRef.current = conn;

    return () => {
      clearTimeout(t);
      conn.disconnect();
      connectionRef.current = null;
      setUsePolling(true);
    };
  }, [showtimeId, queryClient]);

  useEffect(() => {
    if (!usePolling) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ["showtimes", showtimeId, "seats"],
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [usePolling, queryClient, showtimeId]);

  const clearConflicts = useCallback(() => {
    setConflictedSeatIds([]);
  }, []);

  return { conflictedSeatIds, clearConflicts };
}
