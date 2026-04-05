"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Seat } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const t = useTranslations("booking");

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
        <p className="text-muted-foreground text-sm">{t("seatMapHint")}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-available-border))] bg-[hsl(var(--seat-available-bg))] text-[hsl(var(--seat-available-fg))]"
          >
            {t("available")}
          </Badge>
          <Badge variant="default">{t("selected")}</Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-booked-border))] bg-[hsl(var(--seat-booked-bg))] text-[hsl(var(--seat-booked-fg))]"
          >
            {t("booked")}
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-held-border))] bg-[hsl(var(--seat-held-bg))] text-[hsl(var(--seat-held-fg))]"
          >
            {t("held")}
          </Badge>
          <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">
            {t("disabled")}
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-vip-border))] bg-[hsl(var(--seat-vip-bg))] text-[hsl(var(--seat-vip-fg))]"
          >
            {t("vip")}
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-couple-border))] bg-[hsl(var(--seat-couple-bg))] text-[hsl(var(--seat-couple-fg))]"
          >
            {t("couple")}
          </Badge>
        </div>

        <div
          className={cn(
            "bg-muted/20 rounded-xl border p-4",
            "overflow-x-auto overscroll-x-contain",
            "[-webkit-overflow-scrolling:touch]"
          )}
        >
          {/* Screen */}
          <div className="pointer-events-none mb-4">
            <div className="from-primary/60 h-2 rounded-t-3xl bg-gradient-to-b to-transparent" />
            <div className="text-muted-foreground mt-2 text-center text-xs font-semibold tracking-[0.22em]">
              SCREEN
            </div>
          </div>

          <div className="inline-block min-w-min">
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  <div className="text-muted-foreground w-8 shrink-0 text-center text-sm font-semibold">
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
                  <div className="text-muted-foreground w-8 shrink-0 text-center text-sm font-semibold">
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
