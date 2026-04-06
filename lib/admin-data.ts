/**
 * Helpers to unwrap admin API payloads from Nest vs Spring and single/double envelopes.
 * TanStack Query `data` is usually ApiEnvelope<T>; some callers pass `res?.data ?? res`.
 */

export function unwrapList<T>(payload: unknown): T[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== "object") return [];

  const o = payload as Record<string, unknown>;

  if (Array.isArray(o.data)) return o.data as T[];

  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    const inner = o.data as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data as T[];
    if (Array.isArray(inner.content)) return inner.content as T[];
  }

  if (Array.isArray(o.content)) return o.content as T[];

  return [];
}

export type AdminKpiShape = {
  totalRevenue: number;
  totalBookings: number;
  totalMovies: number;
  totalCinemas: number;
  occupancyRate: number;
};

/** KPI object may be nested once or use BigDecimal-like numbers in JSON. */
export function unwrapKpiPayload(payload: unknown): AdminKpiShape | undefined {
  if (payload == null) return undefined;
  if (typeof payload !== "object" || Array.isArray(payload)) return undefined;

  const o = payload as Record<string, unknown>;
  let row: Record<string, unknown> = o;

  if (!("totalRevenue" in row) && o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    row = o.data as Record<string, unknown>;
  }

  if (!("totalRevenue" in row) && !("totalBookings" in row)) return undefined;

  return {
    totalRevenue: Number(row.totalRevenue ?? 0),
    totalBookings: Number(row.totalBookings ?? 0),
    totalMovies: Number(row.totalMovies ?? 0),
    totalCinemas: Number(row.totalCinemas ?? 0),
    occupancyRate: Number(row.occupancyRate ?? 0),
  };
}

export type DashboardBookingRow = {
  id: string;
  movieTitle: string;
  cinemaName: string;
  createdAt: string;
  finalAmount: number;
  status: string;
};

/** Chart helpers: occupancy may be 0–1 (ratio) or 0–100 (percent) from API. */
export function normalizeOccupancyRatioForChart(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  if (raw > 1) return Math.min(raw / 100, 1);
  return Math.min(Math.max(raw, 0), 1);
}

export function normalizeDashboardBooking(raw: unknown): DashboardBookingRow {
  if (raw == null || typeof raw !== "object") {
    return {
      id: "",
      movieTitle: "—",
      cinemaName: "—",
      createdAt: "",
      finalAmount: 0,
      status: "",
    };
  }
  const r = raw as Record<string, unknown>;
  const showtime = r.showtime as Record<string, unknown> | undefined;
  const movie = showtime?.movie as Record<string, unknown> | undefined;
  const cinema = showtime?.cinema as Record<string, unknown> | undefined;

  const movieTitle =
    (typeof r.movieTitle === "string" ? r.movieTitle : null) ??
    (typeof movie?.title === "string" ? movie.title : null) ??
    "—";
  const cinemaName =
    (typeof r.cinemaName === "string" ? r.cinemaName : null) ??
    (typeof cinema?.name === "string" ? cinema.name : null) ??
    "—";
  const finalAmount = Number(r.finalAmount ?? r.totalAmount ?? 0);
  const createdAt = r.createdAt != null ? String(r.createdAt) : "";
  return {
    id: String(r.id ?? ""),
    movieTitle,
    cinemaName,
    createdAt,
    finalAmount,
    status: String(r.status ?? ""),
  };
}
