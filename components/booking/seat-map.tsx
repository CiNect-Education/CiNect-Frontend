"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Seat } from "@/types/domain";

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
  disabled?: boolean;
  conflictedSeatIds?: string[];
}

export function SeatMap({
  seats,
  selectedSeats,
  onSeatClick,
  disabled,
  conflictedSeatIds,
}: SeatMapProps) {
  const [scale, setScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState({ x: 0.5, y: 0.5 });
  const lastPinchRef = useRef<number | null>(null);
  const lastScaleRef = useRef(1);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      lastPinchRef.current = dist;
      lastScaleRef.current = scale;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTransformOrigin({
        x: ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width,
        y: ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height,
      });
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const delta = dist / lastPinchRef.current;
      const newScale = Math.min(Math.max(lastScaleRef.current * delta, 0.5), 3);
      setScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchRef.current = null;
  }, []);
  // Group seats by row
  const rowMap = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const rows = Object.keys(rowMap).sort();

  const getSeatStatus = (seat: Seat) =>
    (seat as { status?: string }).status ?? seat.status;
  const getSeatType = (seat: Seat) =>
    (seat as { type?: string; seatType?: string }).type ?? (seat as { seatType?: string }).seatType ?? "STANDARD";

  const getSeatColor = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const seatType = getSeatType(seat);
    if (seatType === "DISABLED" || status === "BLOCKED") {
      return "bg-muted text-muted-foreground cursor-not-allowed";
    }
    if (status === "BOOKED") {
      return "bg-red-500/20 text-red-600 border-red-400 cursor-not-allowed";
    }
    if (status === "HELD") {
      return "bg-yellow-500/20 text-yellow-600 border-yellow-400 cursor-not-allowed";
    }
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-primary-foreground";
    }
    if (conflictedSeatIds && conflictedSeatIds.includes(seat.id)) {
      return "bg-red-500/30 border-2 border-red-500 ring-2 ring-red-500/50";
    }
    if (seatType === "VIP") {
      return "bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/50";
    }
    if (seatType === "COUPLE") {
      return "bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/50";
    }
    return "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/30";
  };

  const canSelect = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const seatType = getSeatType(seat);
    return (
      !disabled &&
      (status === "AVAILABLE") &&
      seatType !== "DISABLED"
    );
  };

  return (
    <div
      className="space-y-6 overflow-x-auto md:overflow-visible touch-pan-x overscroll-x-contain -mx-4 px-4 md:mx-0 md:px-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="inline-block min-w-min transition-transform duration-100 origin-center md:transform-none"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${transformOrigin.x * 100}% ${transformOrigin.y * 100}%`,
        }}
      >
      {/* Screen */}
      <div className="relative">
        <div className="h-2 bg-gradient-to-b from-primary/50 to-transparent rounded-t-3xl" />
        <div className="text-center text-sm text-muted-foreground mt-2">SCREEN</div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border border-green-500/30 bg-green-500/10" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border border-red-400 bg-red-500/20" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border border-yellow-400 bg-yellow-500/20" />
          <span>Held</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-muted" />
          <span>Disabled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border border-green-500/50 bg-green-500/20" />
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border border-green-500/50 bg-green-500/20" />
          <span>Couple</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2">
            <div className="w-8 text-center text-sm font-medium text-muted-foreground">
              {row}
            </div>
            <div className="flex gap-1">
              {rowMap[row]
                .sort((a, b) => a.number - b.number)
                .map((seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!canSelect(seat)}
                    onClick={() => canSelect(seat) && onSeatClick(seat.id)}
                    tabIndex={canSelect(seat) ? 0 : -1}
                    onKeyDown={(e) => {
                      if (canSelect(seat) && (e.key === " " || e.key === "Enter")) {
                        e.preventDefault();
                        onSeatClick(seat.id);
                      }
                    }}
                    className={cn(
                      "h-8 w-8 md:h-8 md:w-8 min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 rounded border text-[10px] font-medium transition-all touch-manipulation",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      "active:scale-95",
                      getSeatColor(seat),
                      getSeatType(seat) === "COUPLE" && "w-16 md:w-16 min-w-[56px] md:min-w-0"
                    )}
                    aria-label={`Seat ${row}${seat.number} - ${getSeatType(seat)} - ${getSeatStatus(seat)}`}
                  >
                    {seat.number}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
