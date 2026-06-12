"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/showtime-display";
import type { Seat } from "@/types/domain";
import { groupSeatsForDisplay } from "@/lib/seat-selection";
import type { TicketSeatPlan } from "@/lib/seat-selection";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
  disabled?: boolean;
  conflictedSeatIds?: string[];
  layoutTemplate?: string;
  aisleAfterCol?: number | null;
  roomName?: string;
  /** Số đơn vị chọn trên sơ đồ (ghế đôi = 1). */
  maxSelectableUnits?: number;
  ticketSeatPlan?: TicketSeatPlan;
}

type SeatUiStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
type SeatUiType = "STANDARD" | "VIP" | "COUPLE" | "DISABLED";

function seatCode(row: string, number: number): string {
  return `${row}${String(number).padStart(2, "0")}`;
}

function coupleBlockLabel(row: string, seats: Seat[]): string {
  const minNum = Math.min(...seats.map((s) => s.number));
  const block = Math.ceil(minNum / 2);
  return `${row}${String(block).padStart(2, "0")}`;
}

type RowCell =
  | { kind: "aisle" }
  | { kind: "seat"; seat: Seat }
  | { kind: "couple"; seats: Seat[]; label: string };

export function SeatMap({
  seats,
  selectedSeats,
  onSeatClick,
  disabled,
  conflictedSeatIds,
  layoutTemplate = "GRID",
  aisleAfterCol,
  roomName,
  maxSelectableUnits,
  ticketSeatPlan,
}: SeatMapProps) {
  const tb = useTranslations("booking");
  const locale = useLocale();
  const isCinestar = layoutTemplate === "CINESTAR_STANDARD";
  const aisleCol = aisleAfterCol ?? (isCinestar ? 6 : null);

  const rowMap = useMemo(() => {
    return seats.reduce(
      (acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
      },
      {} as Record<string, Seat[]>,
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

  const isSelected = (seat: Seat) => selectedSeats.includes(seat.id);

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
    if (isSelected(seat)) {
      return "bg-primary text-primary-foreground border-primary shadow-sm";
    }
    if (conflictedSeatIds?.includes(seat.id)) {
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

  const selectedUnitCount = useMemo(() => {
    const picked = seats.filter((s) => selectedSeats.includes(s.id));
    return groupSeatsForDisplay(picked).length;
  }, [seats, selectedSeats]);

  const seatAllowedByTicket = (seat: Seat): boolean => {
    if (!ticketSeatPlan || ticketSeatPlan.mode === "empty") return true;
    const seatType = getSeatType(seat);
    const isCouple = seatType === "COUPLE" && !!seat.pairId;
    if (ticketSeatPlan.mode === "double_only") return isCouple;
    if (ticketSeatPlan.mode === "single_only") return !isCouple;
    return true;
  };

  const canSelect = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const seatType = getSeatType(seat);
    if (disabled || status !== "AVAILABLE" || seatType === "DISABLED") return false;
    if (!seatAllowedByTicket(seat)) return false;
    if (
      maxSelectableUnits != null &&
      maxSelectableUnits > 0 &&
      !isSelected(seat) &&
      selectedUnitCount >= maxSelectableUnits
    ) {
      return false;
    }
    return true;
  };

  const buildRowCells = (rowSeats: Seat[]): RowCell[] => {
    const sorted = [...rowSeats].sort((a, b) => {
      const ga = a.gridCol ?? a.number;
      const gb = b.gridCol ?? b.number;
      return ga - gb || a.number - b.number;
    });

    const cells: RowCell[] = [];
    let prevGrid = 0;
    const coupleHandled = new Set<string>();

    for (const seat of sorted) {
      const grid = seat.gridCol ?? seat.number;
      if (isCinestar && aisleCol != null && prevGrid > 0 && grid > prevGrid + 1) {
        cells.push({ kind: "aisle" });
      }
      prevGrid = grid;

      const type = getSeatType(seat);
      if (type === "COUPLE" && seat.pairId) {
        if (coupleHandled.has(seat.id)) continue;
        const partner = sorted.find((s) => s.id === seat.pairId);
        if (!partner) {
          cells.push({ kind: "seat", seat });
          continue;
        }
        coupleHandled.add(seat.id);
        coupleHandled.add(partner.id);
        const pair = [seat, partner].sort((a, b) => a.number - b.number);
        cells.push({
          kind: "couple",
          seats: pair,
          label: coupleBlockLabel(seat.row, pair),
        });
        prevGrid = Math.max(
          seat.gridCol ?? seat.number,
          partner.gridCol ?? partner.number,
        );
        continue;
      }

      cells.push({ kind: "seat", seat });
    }

    return cells;
  };

  const seatTypeUiLabel = (seatType: SeatUiType) => {
    switch (seatType) {
      case "VIP":
        return tb("vip");
      case "COUPLE":
        return tb("coupleSeatType");
      case "DISABLED":
        return tb("disabled");
      default:
        return tb("standard");
    }
  };

  const statusUiLabel = (status: SeatUiStatus) => {
    switch (status) {
      case "HELD":
        return tb("seatUiHELD");
      case "BOOKED":
        return tb("seatUiBOOKED");
      case "BLOCKED":
        return tb("seatUiBLOCKED");
      default:
        return tb("seatUiAVAILABLE");
    }
  };

  const renderSeatButton = (seat: Seat, wide?: boolean, displayLabel?: string) => {
    const status = getSeatStatus(seat);
    const type = getSeatType(seat);
    const price = getSeatPrice(seat);
    const selectable = canSelect(seat);
    const blockedByTicket = status === "AVAILABLE" && !seatAllowedByTicket(seat);
    const label = displayLabel ?? seatCode(seat.row, seat.number);
    const interactable =
      !disabled && type !== "DISABLED" && (status === "AVAILABLE" || isSelected(seat));

    return (
      <Tooltip key={seat.id}>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={!interactable}
            onClick={() => interactable && onSeatClick(seat.id)}
            tabIndex={selectable ? 0 : -1}
            onKeyDown={(e) => {
              if (selectable && (e.key === " " || e.key === "Enter")) {
                e.preventDefault();
                onSeatClick(seat.id);
              }
            }}
            className={cn(
              "relative h-9 touch-manipulation rounded-md border text-[10px] font-semibold sm:text-[11px]",
              wide ? "min-w-[4.5rem] flex-1 px-2" : "w-9 min-w-9",
              "transition-[transform,background-color,border-color,color,box-shadow] duration-150",
              "focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none",
              "active:scale-95",
              selectable && "hover:-translate-y-0.5 hover:shadow-sm",
              blockedByTicket
                ? "bg-muted/40 text-muted-foreground border-border cursor-not-allowed opacity-50"
                : getSeatColor(seat),
            )}
            aria-label={`${tb("tooltipSeatTitle", { row: seat.row, number: label })} — ${seatTypeUiLabel(type)} — ${statusUiLabel(status)}`}
          >
            <span className="relative z-10">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-semibold">{label}</div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>{seatTypeUiLabel(type)}</span>
            <span>•</span>
            <span>{statusUiLabel(status)}</span>
          </div>
          <div className="mt-1 font-medium">
            {price > 0 ? formatVnd(price, locale) : tb("priceUnavailable")}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const title =
    roomName != null && roomName.length > 0
      ? tb("selectSeatsRoomTitle", { room: roomName })
      : tb("selectSeats");

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-4">
        <h2 className="text-center text-lg font-bold tracking-wide text-foreground uppercase sm:text-xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-center text-sm">
          {ticketSeatPlan?.mode === "double_only"
            ? tb("seatMapHintDouble")
            : ticketSeatPlan?.mode === "single_only"
              ? tb("seatMapHintSingle")
              : tb("seatMapHint")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-available-border))] bg-[hsl(var(--seat-available-bg))] text-[hsl(var(--seat-available-fg))]"
          >
            {tb("available")}
          </Badge>
          <Badge variant="default">{tb("selected")}</Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-booked-border))] bg-[hsl(var(--seat-booked-bg))] text-[hsl(var(--seat-booked-fg))]"
          >
            {tb("booked")}
          </Badge>
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-held-border))] bg-[hsl(var(--seat-held-bg))] text-[hsl(var(--seat-held-fg))]"
          >
            {tb("held")}
          </Badge>
          {isCinestar && (
            <Badge variant="outline" className="border-dashed">
              {tb("aisle")}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-[hsl(var(--seat-couple-border))] bg-[hsl(var(--seat-couple-bg))] text-[hsl(var(--seat-couple-fg))]"
          >
            {tb("coupleSeatType")}
          </Badge>
        </div>

        <div
          className={cn(
            "overflow-x-auto overscroll-x-contain py-2",
            "[-webkit-overflow-scrolling:touch]",
          )}
        >
          <div className="pointer-events-none mb-4">
            <div className="mx-auto max-w-2xl">
              <div className="from-primary/60 h-2 rounded-t-[100%] bg-gradient-to-b to-transparent" />
              <div className="text-muted-foreground mt-2 text-center text-xs font-semibold tracking-[0.22em] uppercase">
                {tb("screenLabel")}
              </div>
            </div>
          </div>

          <div className="inline-block min-w-min">
            <div className="space-y-1.5">
              {rows.map((row) => {
                const cells = buildRowCells(rowMap[row]);
                return (
                  <div key={row} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="text-muted-foreground w-7 shrink-0 text-center text-sm font-semibold sm:w-8">
                      {row}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {cells.map((cell, idx) => {
                        if (cell.kind === "aisle") {
                          return (
                            <div
                              key={`${row}-aisle-${idx}`}
                              className="mx-1 w-3 shrink-0 sm:w-4"
                              aria-hidden
                            />
                          );
                        }
                        if (cell.kind === "couple") {
                          const primary = cell.seats[0];
                          const allSelected = cell.seats.every((s) => isSelected(s));
                          const anySelectable = cell.seats.some((s) => canSelect(s));
                          const couplePrice = cell.seats.reduce(
                            (sum, s) => sum + getSeatPrice(s),
                            0,
                          );
                          const status = cell.seats.some((s) => getSeatStatus(s) === "BOOKED")
                            ? "BOOKED"
                            : cell.seats.some((s) => getSeatStatus(s) === "HELD")
                              ? "HELD"
                              : allSelected
                                ? "AVAILABLE"
                                : getSeatStatus(primary);
                          const coupleBlocked = !seatAllowedByTicket(primary);
                          return (
                            <Tooltip key={`${row}-couple-${cell.label}`}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  disabled={
                                    disabled ||
                                    (!anySelectable &&
                                      !allSelected &&
                                      cell.seats.every((s) => getSeatStatus(s) !== "AVAILABLE"))
                                  }
                                  onClick={() => {
                                    if (disabled) return;
                                    onSeatClick(primary.id);
                                  }}
                                  className={cn(
                                    "relative h-9 min-w-[4.5rem] flex-1 rounded-md border px-2 text-[10px] font-semibold sm:min-w-[5.5rem] sm:text-[11px]",
                                    allSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : coupleBlocked
                                        ? "bg-muted/40 text-muted-foreground border-border cursor-not-allowed opacity-50"
                                        : getSeatColor(primary),
                                    anySelectable && "hover:-translate-y-0.5 hover:shadow-sm",
                                  )}
                                >
                                  {cell.label}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-semibold">
                                  {tb("coupleSeatLabel", { label: cell.label })}
                                </div>
                                <div>
                                  {tb("coupleSeatType")} • {statusUiLabel(status as SeatUiStatus)}
                                </div>
                                {couplePrice > 0 ? (
                                  <div className="mt-1 font-medium">
                                    {formatVnd(couplePrice, locale)}
                                  </div>
                                ) : null}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return renderSeatButton(cell.seat);
                      })}
                    </div>
                    <div className="text-muted-foreground w-7 shrink-0 text-center text-sm font-semibold sm:w-8">
                      {row}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
