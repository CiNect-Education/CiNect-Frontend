import type { Seat, TicketProduct, TicketProductCode } from "@/types/domain";

/** Minimal seat fields used for grouping and pricing display. */
export type SeatLike = {
  id: string;
  row: string;
  number: number;
  type?: string;
  seatType?: string;
  pairId?: string | null;
  price?: number;
};

export type SeatDisplayUnit = {
  kind: "single" | "couple";
  label: string;
  seatType: string;
  seatIds: string[];
  seats: SeatLike[];
  price: number;
};

export function coupleBlockLabel(row: string, numbers: number[]): string {
  const minNum = Math.min(...numbers);
  const block = Math.ceil(minNum / 2);
  return `${row}${String(block).padStart(2, "0")}`;
}

export function seatTypeOf(seat: SeatLike): string {
  return String(
    (seat as { type?: string; seatType?: string }).type ??
      (seat as { seatType?: string }).seatType ??
      "STANDARD",
  );
}

export function seatPriceOf(seat: SeatLike): number {
  const raw = (seat as { price?: unknown }).price ?? 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** One couple loveseat → one display row (not two singles). */
export function groupSeatsForDisplay(seats: SeatLike[]): SeatDisplayUnit[] {
  const byId = new Map(seats.map((s) => [s.id, s]));
  const handled = new Set<string>();
  const units: SeatDisplayUnit[] = [];

  for (const seat of seats) {
    if (handled.has(seat.id)) continue;
    const type = seatTypeOf(seat);

    if (type === "COUPLE" && seat.pairId) {
      const partner = byId.get(seat.pairId);
      if (partner) {
        handled.add(seat.id);
        handled.add(partner.id);
        const pair = [seat, partner].sort((a, b) => a.number - b.number);
        units.push({
          kind: "couple",
          label: coupleBlockLabel(seat.row, pair.map((p) => p.number)),
          seatType: "COUPLE",
          seatIds: pair.map((p) => p.id),
          seats: pair,
          price: pair.reduce((sum, s) => sum + seatPriceOf(s), 0),
        });
        continue;
      }
    }

    handled.add(seat.id);
    units.push({
      kind: "single",
      label: `${seat.row}${seat.number}`,
      seatType: type,
      seatIds: [seat.id],
      seats: [seat],
      price: seatPriceOf(seat),
    });
  }

  return units.sort((a, b) => a.label.localeCompare(b.label));
}

export function sumSeatPrices(seats: SeatLike[]): number {
  return groupSeatsForDisplay(seats).reduce((sum, u) => sum + u.price, 0);
}

export function requiredSeatCountFromTickets(
  products: TicketProduct[],
  quantities: Partial<Record<TicketProductCode, number>>,
): number {
  return products.reduce((sum, p) => {
    const q = quantities[p.code] ?? 0;
    return sum + q * p.seatsPerUnit;
  }, 0);
}

export function countDoubleTickets(
  quantities: Partial<Record<TicketProductCode, number>>,
): number {
  return quantities.ADULT_DOUBLE ?? 0;
}

export function countSingleTicketSlots(
  quantities: Partial<Record<TicketProductCode, number>>,
): number {
  return (quantities.ADULT_SINGLE ?? 0) + (quantities.CONCESSION_SINGLE ?? 0);
}

export type TicketSeatPlan = {
  mode: "empty" | "double_only" | "single_only" | "mixed";
  doubleTickets: number;
  singleTickets: number;
  /** Số lần bấm trên sơ đồ (1 ghế đôi = 1 đơn vị). */
  totalDisplayUnits: number;
  /** Số slot vật lý trong DB (vé đôi × 2 + vé đơn). */
  requiredPhysicalSeats: number;
};

/** Phân tích loại vé → quy tắc chọn ghế kiểu Cinestar. */
export function analyzeTicketSeatPlan(
  quantities: Partial<Record<TicketProductCode, number>>,
): TicketSeatPlan {
  const doubleTickets = countDoubleTickets(quantities);
  const singleTickets = countSingleTicketSlots(quantities);
  const totalDisplayUnits = doubleTickets + singleTickets;
  const requiredPhysicalSeats = singleTickets + doubleTickets * 2;

  let mode: TicketSeatPlan["mode"] = "empty";
  if (totalDisplayUnits > 0) {
    if (doubleTickets > 0 && singleTickets === 0) mode = "double_only";
    else if (singleTickets > 0 && doubleTickets === 0) mode = "single_only";
    else mode = "mixed";
  }

  return {
    mode,
    doubleTickets,
    singleTickets,
    totalDisplayUnits,
    requiredPhysicalSeats,
  };
}

export function isCoupleSeat(seat: SeatLike): boolean {
  return seatTypeOf(seat) === "COUPLE" && !!seat.pairId;
}

/** Keys under `booking` namespace for Cinestar-style notice modal. */
export const BOOKING_NOTICE_I18N_KEYS = new Set([
  "cinestarNoticeSeatsEnough",
  "doubleTicketCoupleOnly",
  "singleTicketNoCouple",
  "coupleTicketRequired",
  "seatCountMismatch",
]);

export function resolveBookingNoticeMessage(
  translate: (key: string) => string,
  keyOrMessage: string,
): string {
  if (BOOKING_NOTICE_I18N_KEYS.has(keyOrMessage)) {
    return translate(keyOrMessage);
  }
  return keyOrMessage;
}

/** Trả về key i18n nếu không được phép bấm ghế này. */
export function getSeatClickBlockReason(
  plan: TicketSeatPlan,
  seat: SeatLike,
  selectedSeats: SeatLike[],
): string | null {
  const couple = isCoupleSeat(seat);
  const units = groupSeatsForDisplay(selectedSeats);
  const alreadySelected = selectedSeats.some((s) => s.id === seat.id);

  if (alreadySelected) return null;

  if (plan.mode === "double_only" && !couple) {
    return "doubleTicketCoupleOnly";
  }
  if (plan.mode === "single_only" && couple) {
    return "singleTicketNoCouple";
  }

  if (units.length >= plan.totalDisplayUnits) {
    return "cinestarNoticeSeatsEnough";
  }

  if (couple) {
    let doubleLeft = plan.doubleTickets;
    let singleLeft = plan.singleTickets;
    for (const unit of units) {
      if (unit.kind !== "couple") continue;
      if (doubleLeft > 0) doubleLeft -= 1;
      else singleLeft -= 2;
    }
    if (doubleLeft > 0 || singleLeft >= 2) return null;
    return "coupleTicketRequired";
  }

  if (plan.mode === "mixed") {
    const singleUnitsPicked = units.filter((u) => u.kind === "single").length;
    if (singleUnitsPicked >= plan.singleTickets) {
      return "cinestarNoticeSeatsEnough";
    }
  }

  return null;
}

export function validateTicketSeatSelection(
  products: TicketProduct[],
  quantities: Partial<Record<TicketProductCode, number>>,
  selectedSeats: SeatLike[],
): string | null {
  const plan = analyzeTicketSeatPlan(quantities);
  const units = groupSeatsForDisplay(selectedSeats);

  if (plan.totalDisplayUnits === 0) return null;

  if (units.length !== plan.totalDisplayUnits) {
    return "seatCountMismatch";
  }

  if (plan.mode === "double_only" && units.some((u) => u.kind !== "couple")) {
    return "doubleTicketCoupleOnly";
  }

  if (plan.mode === "single_only" && units.some((u) => u.kind === "couple")) {
    return "singleTicketNoCouple";
  }

  let doubleLeft = plan.doubleTickets;
  let singleLeft = plan.singleTickets;

  for (const unit of units) {
    if (unit.kind === "couple") {
      if (doubleLeft > 0) {
        doubleLeft -= 1;
        continue;
      }
      if (singleLeft >= 2) {
        singleLeft -= 2;
        continue;
      }
      return "coupleTicketRequired";
    }
    if (singleLeft > 0) {
      singleLeft -= 1;
      continue;
    }
    return "seatCountMismatch";
  }

  const requiredPhysical = requiredSeatCountFromTickets(products, quantities);
  if (selectedSeats.length !== requiredPhysical) {
    return "seatCountMismatch";
  }

  return null;
}
