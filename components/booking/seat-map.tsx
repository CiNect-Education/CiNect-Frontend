"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Seat } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Minus, Plus, RotateCcw, Move } from "lucide-react";

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
  disabled?: boolean;
  conflictedSeatIds?: string[];
}

type SeatUiStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
type SeatUiType = "STANDARD" | "VIP" | "COUPLE" | "DISABLED";

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

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
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
      } else if (e.touches.length === 1) {
        isPanningRef.current = true;
        panStartRef.current = pan;
        pointerStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    },
    [scale, pan]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const delta = dist / lastPinchRef.current;
      const newScale = clamp(lastScaleRef.current * delta, 0.7, 2.6);
      setScale(newScale);
      return;
    }

    if (e.touches.length === 1 && isPanningRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - pointerStartRef.current.x;
      const dy = e.touches[0].clientY - pointerStartRef.current.y;
      setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchRef.current = null;
    isPanningRef.current = false;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan with primary button / touch contact.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isPanningRef.current = true;
    panStartRef.current = pan;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    if (e.pointerType === "mouse" && (e.buttons & 1) !== 1) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return;
      // ctrl+wheel behaves like zoom on some trackpads; also allow normal wheel zoom when hovering map.
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const ox = (e.clientX - rect.left) / rect.width;
      const oy = (e.clientY - rect.top) / rect.height;
      setTransformOrigin({ x: ox, y: oy });
      setScale((prev) => clamp(prev + (e.deltaY > 0 ? -0.08 : 0.08), 0.7, 2.6));
    },
    []
  );

  // Group seats by row
  const rowMap = useMemo(() => {
    return seats.reduce(
      (acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
      },
      {} as Record<string, Seat[]>
    );
  }, [seats]);

  const rows = useMemo(() => Object.keys(rowMap).sort(), [rowMap]);

  const getSeatStatus = (seat: Seat): SeatUiStatus =>
    ((seat as { status?: string }).status ?? seat.status ?? "AVAILABLE") as SeatUiStatus;
  const getSeatType = (seat: Seat): SeatUiType =>
    (((seat as { type?: string; seatType?: string }).type ??
      (seat as { seatType?: string }).seatType ??
      "STANDARD") as SeatUiType);

  const getSeatPrice = (seat: Seat): number => {
    const raw = (seat as { price?: unknown }).price ?? 0;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    if (typeof raw === "string") {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const getSeatColor = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const seatType = getSeatType(seat);
    if (seatType === "DISABLED" || status === "BLOCKED") {
      return "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60";
    }
    if (status === "BOOKED") {
      return "bg-[hsl(var(--seat-booked-bg))] text-[hsl(var(--seat-booked-fg))] border-[hsl(var(--seat-booked-border))] cursor-not-allowed";
    }
    if (status === "HELD") {
      return "bg-[hsl(var(--seat-held-bg))] text-[hsl(var(--seat-held-fg))] border-[hsl(var(--seat-held-border))] cursor-not-allowed";
    }
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-primary-foreground border-primary shadow-sm";
    }
    if (conflictedSeatIds && conflictedSeatIds.includes(seat.id)) {
      return "bg-[hsl(var(--seat-conflict-bg))] border-2 border-[hsl(var(--seat-conflict-border))] ring-2 ring-[hsl(var(--seat-conflict-border))]/40";
    }
    if (seatType === "VIP") {
      return "bg-[hsl(var(--seat-vip-bg))] text-[hsl(var(--seat-vip-fg))] hover:bg-[hsl(var(--seat-vip-bg))] border-[hsl(var(--seat-vip-border))]";
    }
    if (seatType === "COUPLE") {
      return "bg-[hsl(var(--seat-couple-bg))] text-[hsl(var(--seat-couple-fg))] hover:bg-[hsl(var(--seat-couple-bg))] border-[hsl(var(--seat-couple-border))]";
    }
    return "bg-[hsl(var(--seat-available-bg))] text-[hsl(var(--seat-available-fg))] hover:bg-[hsl(var(--seat-available-bg))] border-[hsl(var(--seat-available-border))]";
  };

  const canSelect = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const seatType = getSeatType(seat);
    return !disabled && status === "AVAILABLE" && seatType !== "DISABLED";
  };

  const zoomIn = () => setScale((s) => clamp(s + 0.15, 0.7, 2.6));
  const zoomOut = () => setScale((s) => clamp(s - 0.15, 0.7, 2.6));
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setTransformOrigin({ x: 0.5, y: 0.5 });
  };

  const typeLabel = (t: SeatUiType) => {
    switch (t) {
      case "VIP":
        return "VIP";
      case "COUPLE":
        return "Couple";
      case "DISABLED":
        return "Disabled";
      default:
        return "Standard";
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-4">
        {/* Controls + Legend */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Move className="h-4 w-4" />
              Drag to pan • Pinch / wheel to zoom
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={zoomOut} aria-label="Zoom out">
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-muted-foreground w-14 text-center text-sm tabular-nums">
              {Math.round(scale * 100)}%
            </div>
            <Button type="button" size="sm" variant="outline" onClick={zoomIn} aria-label="Zoom in">
              <Plus className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetView} aria-label="Reset view">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-available-border))] bg-[hsl(var(--seat-available-bg))] text-[hsl(var(--seat-available-fg))]"
          >
            Available
          </Badge>
          <Badge variant="default">Selected</Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-booked-border))] bg-[hsl(var(--seat-booked-bg))] text-[hsl(var(--seat-booked-fg))]"
          >
            Booked
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-held-border))] bg-[hsl(var(--seat-held-bg))] text-[hsl(var(--seat-held-fg))]"
          >
            Held
          </Badge>
          <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">
            Disabled
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-vip-border))] bg-[hsl(var(--seat-vip-bg))] text-[hsl(var(--seat-vip-fg))]"
          >
            VIP
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-couple-border))] bg-[hsl(var(--seat-couple-bg))] text-[hsl(var(--seat-couple-fg))]"
          >
            Couple
          </Badge>
        </div>

        {/* Map viewport */}
        <div
          className={cn(
            "bg-muted/20 relative overflow-hidden rounded-xl border p-4",
            "touch-none select-none"
          )}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Screen */}
          <div className="pointer-events-none mb-4">
            <div className="from-primary/60 h-2 rounded-t-3xl bg-gradient-to-b to-transparent" />
            <div className="text-muted-foreground mt-2 text-center text-xs font-semibold tracking-[0.22em]">
              SCREEN
            </div>
          </div>

          <div
            className="inline-block min-w-min origin-center transition-transform duration-75"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: `${transformOrigin.x * 100}% ${transformOrigin.y * 100}%`,
            }}
          >
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  <div className="text-muted-foreground w-8 text-center text-sm font-semibold">
                    {row}
                  </div>
                  <div className="flex gap-1">
                    {rowMap[row]
                      .sort((a, b) => a.number - b.number)
                      .map((seat) => {
                        const status = getSeatStatus(seat);
                        const type = getSeatType(seat);
                        const price = getSeatPrice(seat);
                        const selectable = canSelect(seat);
                        const isCouple = type === "COUPLE";

                        return (
                          <Tooltip key={seat.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled={!selectable}
                                onClick={() => selectable && onSeatClick(seat.id)}
                                tabIndex={selectable ? 0 : -1}
                                onKeyDown={(e) => {
                                  if (selectable && (e.key === " " || e.key === "Enter")) {
                                    e.preventDefault();
                                    onSeatClick(seat.id);
                                  }
                                }}
                                className={cn(
                                  "relative h-9 w-9 touch-manipulation rounded-md border text-[11px] font-semibold",
                                  "transition-[transform,background-color,border-color,color,box-shadow] duration-150",
                                  "focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none",
                                  "active:scale-95",
                                  selectable && "hover:-translate-y-0.5 hover:shadow-sm",
                                  getSeatColor(seat),
                                  isCouple && "w-[72px]"
                                )}
                                aria-label={`Seat ${row}${seat.number} - ${typeLabel(type)} - ${status}`}
                              >
                                <span className="relative z-10">{seat.number}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-semibold">
                                Seat {row}
                                {seat.number}
                              </div>
                              <div className="text-muted-foreground mt-0.5 flex items-center gap-2">
                                <span>{typeLabel(type)}</span>
                                <span>•</span>
                                <span>{status}</span>
                              </div>
                              <div className="mt-1 font-medium">
                                {price > 0 ? `$${price.toFixed(2)}` : "—"}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                  <div className="text-muted-foreground w-8 text-center text-sm font-semibold">
                    {row}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
