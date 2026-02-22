"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeConnection, type SeatEvent } from "@/lib/realtime";
import type { Seat } from "@/types/domain";

const POLL_INTERVAL_MS = 8000;

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

export function useSeatRealtime(showtimeId: string, selectedSeatIds: string[] = []) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<RealtimeConnection | null>(null);
  const selectedRef = useRef(selectedSeatIds);
  const [usePolling, setUsePolling] = useState(false);
  const [conflictedSeatIds, setConflictedSeatIds] = useState<string[]>([]);

  selectedRef.current = selectedSeatIds;

  useEffect(() => {
    const conn = new RealtimeConnection(showtimeId);

    const handleEvent = (event: SeatEvent) => {
      if (event.showtimeId !== showtimeId) return;

      const newStatus = statusFromEventType(event.type);
      const seatIdsSet = new Set(event.seatIds);

      queryClient.setQueryData(
        ["showtimes", showtimeId, "seats"],
        (old: { data?: Seat[] } | Seat[] | undefined) => {
          const prev = Array.isArray(old) ? old : (old?.data ?? []);
          const seats = Array.isArray(prev) ? prev : [];
          const updated = seats.map((seat) =>
            seatIdsSet.has(seat.id) ? { ...seat, status: newStatus } : seat
          );
          return Array.isArray(old) ? updated : { ...(old ?? {}), data: updated };
        }
      );

      const unavailable = event.type === "SEAT_HELD" || event.type === "SEAT_BOOKED";
      const selected = selectedRef.current;
      if (unavailable && selected.length > 0) {
        const conflicted = event.seatIds.filter((id) => selected.includes(id));
        if (conflicted.length > 0) {
          setConflictedSeatIds((prev) => Array.from(new Set([...prev, ...conflicted])));
        }
      }
    };

    conn.subscribe(handleEvent);
    conn.connect();

    const checkConnected = () => {
      if (!conn.isConnected) {
        setUsePolling(true);
      }
    };
    const t = setTimeout(checkConnected, 2000);

    connectionRef.current = conn;

    return () => {
      clearTimeout(t);
      conn.disconnect();
      connectionRef.current = null;
      setUsePolling(false);
    };
  }, [showtimeId, queryClient]);

  // Fallback polling when WebSocket fails
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
