import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type {
  Movie,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  PricingRule,
  Promotion,
  User,
} from "@/types/domain";
import type { QueryParams } from "@/types/api";

// ─── KPIs & Dashboard ────────────────────────────────────────────
export function useAdminKPIs(range = "7d") {
  return useApiQuery<{
    totalRevenue: number;
    totalBookings: number;
    totalMovies: number;
    totalCinemas: number;
    occupancyRate: number;
  }>(["admin", "kpis", range], "/admin/kpis", { range });
}

export function useAdminRevenue(range = "30d") {
  return useApiQuery<Array<{ date: string; revenue: number }>>(
    ["admin", "revenue", range],
    "/admin/revenue",
    { range }
  );
}

export function useAdminOccupancy(range = "30d") {
  return useApiQuery<
    Array<{
      date: string;
      occupancy: number;
      cinemaId?: string;
      cinemaName?: string;
    }>
  >(["admin", "occupancy", range], "/admin/occupancy", { range });
}

export function useAdminRecentBookings(limit = 10) {
  return useApiQuery<Booking[]>(
    ["admin", "bookings", "recent", String(limit)],
    "/admin/bookings/recent",
    { limit }
  );
}

// ─── Movies CRUD ─────────────────────────────────────────────────
export function useAdminMovies(params?: QueryParams) {
  return useApiQuery<Movie[]>(
    ["admin", "movies", JSON.stringify(params ?? {})],
    "/admin/movies",
    params
  );
}
export function useCreateMovie() {
  return useApiMutation<Movie, Partial<Movie>>("post", "/admin/movies", {
    successMessage: "Movie created",
    invalidateKeys: [["admin", "movies"]],
  });
}
export function useUpdateMovie() {
  return useApiMutation<Movie, Partial<Movie> & { id: string }>(
    "put",
    (v) => `/admin/movies/${v.id}`,
    {
      successMessage: "Movie updated",
      invalidateKeys: [["admin", "movies"]],
    }
  );
}
export function useDeleteMovie() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/movies/${v.id}`, {
    successMessage: "Movie deleted",
    invalidateKeys: [["admin", "movies"]],
  });
}

// ─── Cinemas CRUD ────────────────────────────────────────────────
export function useAdminCinemas(params?: QueryParams) {
  return useApiQuery<Cinema[]>(
    ["admin", "cinemas", JSON.stringify(params ?? {})],
    "/admin/cinemas",
    params
  );
}
export function useCreateCinema() {
  return useApiMutation<Cinema, Partial<Cinema>>("post", "/admin/cinemas", {
    successMessage: "Cinema created",
    invalidateKeys: [["admin", "cinemas"]],
  });
}
export function useUpdateCinema() {
  return useApiMutation<Cinema, Partial<Cinema> & { id: string }>(
    "put",
    (v) => `/admin/cinemas/${v.id}`,
    {
      successMessage: "Cinema updated",
      invalidateKeys: [["admin", "cinemas"]],
    }
  );
}
export function useDeleteCinema() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/cinemas/${v.id}`, {
    successMessage: "Cinema deleted",
    invalidateKeys: [["admin", "cinemas"]],
  });
}

// ─── Rooms CRUD ──────────────────────────────────────────────────
export function useAdminRooms(params?: QueryParams) {
  return useApiQuery<Room[]>(
    ["admin", "rooms", JSON.stringify(params ?? {})],
    "/admin/rooms",
    params
  );
}
export function useCreateRoom() {
  return useApiMutation<Room, Partial<Room>>("post", "/admin/rooms", {
    successMessage: "Room created",
    invalidateKeys: [["admin", "rooms"]],
  });
}
export function useUpdateRoom() {
  return useApiMutation<Room, Partial<Room> & { id: string }>(
    "put",
    (v) => `/admin/rooms/${v.id}`,
    {
      successMessage: "Room updated",
      invalidateKeys: [["admin", "rooms"]],
    }
  );
}
export function useDeleteRoom() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/rooms/${v.id}`, {
    successMessage: "Room deleted",
    invalidateKeys: [["admin", "rooms"]],
  });
}

// ─── Seats ───────────────────────────────────────────────────────
export function useAdminRoomSeats(roomId?: string) {
  return useApiQuery<Seat[]>(
    ["admin", "rooms", roomId ?? "", "seats"],
    `/admin/rooms/${roomId ?? ""}/seats`,
    undefined,
    { enabled: !!roomId }
  );
}
export function useUpdateRoomSeats() {
  return useApiMutation<Seat[], { roomId: string; seats: Partial<Seat>[] }>(
    "put",
    (v) => `/admin/rooms/${v.roomId}/seats`,
    {
      successMessage: "Seats updated",
      invalidateKeys: [["admin", "rooms"]],
    }
  );
}
export function useImportRoomSeats() {
  return useApiMutation<Seat[], { roomId: string; layout: Record<string, unknown> }>(
    "post",
    (v) => `/admin/rooms/${v.roomId}/seats/import`,
    {
      successMessage: "Layout imported",
      invalidateKeys: [["admin", "rooms"]],
    }
  );
}

// ─── Showtimes ───────────────────────────────────────────────────
export function useAdminShowtimes(params?: QueryParams) {
  return useApiQuery<Showtime[]>(
    ["admin", "showtimes", JSON.stringify(params ?? {})],
    "/admin/showtimes",
    params
  );
}
export function useCreateShowtime() {
  return useApiMutation<Showtime, Partial<Showtime>>("post", "/admin/showtimes", {
    successMessage: "Showtime created",
    invalidateKeys: [["admin", "showtimes"]],
  });
}
export function useUpdateShowtime() {
  return useApiMutation<Showtime, Partial<Showtime> & { id: string }>(
    "put",
    (v) => `/admin/showtimes/${v.id}`,
    {
      successMessage: "Showtime updated",
      invalidateKeys: [["admin", "showtimes"]],
    }
  );
}
export function useDeleteShowtime() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/showtimes/${v.id}`, {
    successMessage: "Showtime deleted",
    invalidateKeys: [["admin", "showtimes"]],
  });
}

// ─── Bookings Admin ──────────────────────────────────────────────
export function useAdminBookings(params?: QueryParams) {
  return useApiQuery<Booking[]>(
    ["admin", "bookings", JSON.stringify(params ?? {})],
    "/admin/bookings",
    params
  );
}
export function useAdminCancelBooking() {
  return useApiMutation<void, { id: string }>("post", (v) => `/admin/bookings/${v.id}/cancel`, {
    successMessage: "Booking cancelled",
    invalidateKeys: [["admin", "bookings"]],
  });
}
export function useAdminRefundBooking() {
  return useApiMutation<void, { id: string }>("post", (v) => `/admin/bookings/${v.id}/refund`, {
    successMessage: "Booking refunded",
    invalidateKeys: [["admin", "bookings"]],
  });
}

// ─── Pricing Rules ───────────────────────────────────────────────
export function useAdminPricingRules(params?: QueryParams) {
  return useApiQuery<PricingRule[]>(
    ["admin", "pricing-rules", JSON.stringify(params ?? {})],
    "/admin/pricing-rules",
    params
  );
}
export function useCreatePricingRule() {
  return useApiMutation<PricingRule, Partial<PricingRule>>("post", "/admin/pricing-rules", {
    successMessage: "Rule created",
    invalidateKeys: [["admin", "pricing-rules"]],
  });
}
export function useUpdatePricingRule() {
  return useApiMutation<PricingRule, Partial<PricingRule> & { id: string }>(
    "put",
    (v) => `/admin/pricing-rules/${v.id}`,
    {
      successMessage: "Rule updated",
      invalidateKeys: [["admin", "pricing-rules"]],
    }
  );
}
export function useDeletePricingRule() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/pricing-rules/${v.id}`, {
    successMessage: "Rule deleted",
    invalidateKeys: [["admin", "pricing-rules"]],
  });
}

// ─── Promotions Admin ────────────────────────────────────────────
export function useAdminPromotions(params?: QueryParams) {
  return useApiQuery<Promotion[]>(
    ["admin", "promotions", JSON.stringify(params ?? {})],
    "/admin/promotions",
    params
  );
}
export function useCreatePromotion() {
  return useApiMutation<Promotion, Partial<Promotion>>("post", "/admin/promotions", {
    successMessage: "Promotion created",
    invalidateKeys: [["admin", "promotions"]],
  });
}
export function useUpdatePromotion() {
  return useApiMutation<Promotion, Partial<Promotion> & { id: string }>(
    "put",
    (v) => `/admin/promotions/${v.id}`,
    {
      successMessage: "Promotion updated",
      invalidateKeys: [["admin", "promotions"]],
    }
  );
}
export function useDeletePromotion() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/promotions/${v.id}`, {
    successMessage: "Promotion deleted",
    invalidateKeys: [["admin", "promotions"]],
  });
}

// ─── Reports ─────────────────────────────────────────────────────
export function useAdminReportSales(params?: QueryParams) {
  return useApiQuery<Array<{ date: string; revenue: number; bookings: number }>>(
    ["admin", "reports", "sales", JSON.stringify(params ?? {})],
    "/admin/reports/sales",
    params
  );
}
export function useAdminReportMovies(params?: QueryParams) {
  return useApiQuery<
    Array<{
      movieId: string;
      movieTitle: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>
  >(["admin", "reports", "movies", JSON.stringify(params ?? {})], "/admin/reports/movies", params);
}
export function useAdminReportCinemas(params?: QueryParams) {
  return useApiQuery<
    Array<{
      cinemaId: string;
      cinemaName: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>
  >(
    ["admin", "reports", "cinemas", JSON.stringify(params ?? {})],
    "/admin/reports/cinemas",
    params
  );
}

// ─── Users (RBAC) ────────────────────────────────────────────────
export function useAdminUsers(params?: QueryParams) {
  return useApiQuery<User[]>(
    ["admin", "users", JSON.stringify(params ?? {})],
    "/admin/users",
    params
  );
}
export function useCreateUser() {
  return useApiMutation<User, Partial<User> & { password: string }>("post", "/admin/users", {
    successMessage: "User created",
    invalidateKeys: [["admin", "users"]],
  });
}
export function useUpdateUser() {
  return useApiMutation<User, Partial<User> & { id: string }>(
    "put",
    (v) => `/admin/users/${v.id}`,
    {
      successMessage: "User updated",
      invalidateKeys: [["admin", "users"]],
    }
  );
}
export function useDeleteUser() {
  return useApiMutation<void, { id: string }>("delete", (v) => `/admin/users/${v.id}`, {
    successMessage: "User deleted",
    invalidateKeys: [["admin", "users"]],
  });
}

// ─── Roles ───────────────────────────────────────────────────────
export function useAdminRoles() {
  return useApiQuery<Array<{ id: string; name: string; permissions: string[] }>>(
    ["admin", "roles"],
    "/admin/roles"
  );
}

// ─── Audit Logs ──────────────────────────────────────────────────
export function useAdminAuditLogs(params?: QueryParams) {
  return useApiQuery<
    Array<{
      id: string;
      userId: string;
      userName: string;
      action: string;
      entity: string;
      entityId: string;
      details: string;
      timestamp: string;
    }>
  >(["admin", "audit-logs", JSON.stringify(params ?? {})], "/admin/audit-logs", params);
}

// ─── Analytics ───────────────────────────────────────────────────
export function useAdminAnalyticsRevenue(params?: QueryParams) {
  return useApiQuery<Array<{ date: string; revenue: number; predicted?: boolean }>>(
    ["admin", "analytics", "revenue", JSON.stringify(params ?? {})],
    "/admin/analytics/revenue",
    params
  );
}
export function useAdminAnalyticsForecast(params?: QueryParams) {
  return useApiQuery<Array<{ date: string; revenue: number }>>(
    ["admin", "analytics", "forecast", JSON.stringify(params ?? {})],
    "/admin/analytics/forecast",
    params
  );
}
export function useAdminAnalyticsOccupancy(params?: QueryParams) {
  return useApiQuery<
    Array<{ cinemaId: string; cinemaName: string; date: string; occupancy: number }>
  >(
    ["admin", "analytics", "occupancy", JSON.stringify(params ?? {})],
    "/admin/analytics/occupancy",
    params
  );
}
export function useAdminAnalyticsCustomerSegments() {
  return useApiQuery<Array<{ segment: string; count: number; percentage: number }>>(
    ["admin", "analytics", "customer-segments"],
    "/admin/analytics/customer-segments"
  );
}
export function useAdminAnalyticsPeakHours() {
  return useApiQuery<Array<{ hour: number; bookings: number }>>(
    ["admin", "analytics", "peak-hours"],
    "/admin/analytics/peak-hours"
  );
}
