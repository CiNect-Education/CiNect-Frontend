import type { HoldDetails } from "@/types/domain";

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === "object" && v !== null && "toString" in v) {
    const n = Number(String(v));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Maps Prisma hold payloads and minor API drift into the checkout `HoldDetails` shape.
 */
export function normalizeHoldDetails(raw: unknown): HoldDetails | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const holdId = String(o.holdId ?? o.id ?? "");
  const showtimeId = String(o.showtimeId ?? "");
  const expiresAt = o.expiresAt != null ? String(o.expiresAt) : "";

  const stRaw = o.showtime;
  const st = stRaw && typeof stRaw === "object" ? (stRaw as Record<string, unknown>) : null;
  const basePrice = num(st?.basePrice) ?? 0;

  const mapSeatRow = (seat: Record<string, unknown>, seatIdFallback: string) => ({
    id: String(seat.id ?? seatIdFallback),
    row: String(seat.row ?? seat.rowLabel ?? ""),
    number: Number(seat.number ?? 0),
    type: String(seat.type ?? "STANDARD"),
    price: num(seat.price) ?? basePrice,
  });

  if (Array.isArray(o.seats) && o.seats.length > 0) {
    const seats = (o.seats as unknown[]).map((s, i) => {
      const x = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      return mapSeatRow(x, String(x.id ?? i));
    });

    let showtime: HoldDetails["showtime"];
    if (st) {
      const movie = st.movie as Record<string, unknown> | undefined;
      const cinema = st.cinema as Record<string, unknown> | undefined;
      const room = st.room as Record<string, unknown> | undefined;
      showtime = {
        movieTitle: (st.movieTitle as string | undefined) ?? (movie?.title as string | undefined),
        cinemaName: (st.cinemaName as string | undefined) ?? (cinema?.name as string | undefined),
        roomName: (st.roomName as string | undefined) ?? (room?.name as string | undefined),
        startTime: st.startTime != null ? String(st.startTime) : undefined,
        format: st.format != null ? String(st.format) : undefined,
        cinemaId:
          st.cinemaId != null
            ? String(st.cinemaId)
            : cinema?.id != null
              ? String(cinema.id)
              : undefined,
      };
    }

    return { holdId, showtimeId, expiresAt, seats, showtime };
  }

  const holdSeats = Array.isArray(o.holdSeats) ? o.holdSeats : [];
  if (holdSeats.length === 0 && !showtimeId) return null;

  const seats = holdSeats.map((hs) => {
    const row = (hs && typeof hs === "object" ? hs : {}) as Record<string, unknown>;
    const seat = (row.seat as Record<string, unknown> | undefined) ?? row;
    return mapSeatRow(seat, String(row.seatId ?? seat.id ?? ""));
  });

  let showtime: HoldDetails["showtime"];
  if (st) {
    const movie = st.movie as Record<string, unknown> | undefined;
    const cinema = st.cinema as Record<string, unknown> | undefined;
    const room = st.room as Record<string, unknown> | undefined;
    showtime = {
      movieTitle: (st.movieTitle as string | undefined) ?? (movie?.title as string | undefined),
      cinemaName: (st.cinemaName as string | undefined) ?? (cinema?.name as string | undefined),
      roomName: (st.roomName as string | undefined) ?? (room?.name as string | undefined),
      startTime: st.startTime != null ? String(st.startTime) : undefined,
      format: st.format != null ? String(st.format) : undefined,
      cinemaId:
        st.cinemaId != null
          ? String(st.cinemaId)
          : cinema?.id != null
            ? String(cinema.id)
            : undefined,
    };
  }

  return { holdId, showtimeId, expiresAt, seats, showtime };
}
