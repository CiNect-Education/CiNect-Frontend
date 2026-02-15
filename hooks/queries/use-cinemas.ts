import { useApiQuery } from "@/hooks/use-api-query";
import {
  cinemaSchema,
  cinemaListItemSchema,
  showtimeSchema,
  seatSchema,
} from "@/lib/schemas/cinema";
import type { Cinema, CinemaListItem, Showtime, Seat } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

// ─── Cinema list ───────────────────────────────────────────────────

export function useCinemas(params?: QueryParams) {
  return useApiQuery<CinemaListItem[]>(
    ["cinemas", JSON.stringify(params)],
    "/cinemas",
    params,
    { schema: z.array(cinemaListItemSchema) }
  );
}

export function useCinema(id: string) {
  return useApiQuery<Cinema>(["cinema", id], `/cinemas/${id}`, undefined, {
    schema: cinemaSchema,
    enabled: !!id,
  });
}

// ─── Showtimes ─────────────────────────────────────────────────────

export function useShowtimes(params?: QueryParams) {
  return useApiQuery<Showtime[]>(
    ["showtimes", JSON.stringify(params)],
    "/showtimes",
    params,
    { schema: z.array(showtimeSchema) }
  );
}

export function useShowtimeSearch(params?: QueryParams) {
  return useApiQuery<Showtime[]>(
    ["showtimes", "search", JSON.stringify(params)],
    "/showtimes/search",
    params,
    {
      schema: z.array(showtimeSchema),
      enabled: !!params?.city && !!params?.date,
    }
  );
}

export function useMovieShowtimes(
  movieId: string,
  params?: { city?: string; date?: string }
) {
  return useApiQuery<Showtime[]>(
    ["movie-showtimes", movieId, JSON.stringify(params)],
    `/movies/${movieId}/showtimes`,
    params as QueryParams,
    {
      schema: z.array(showtimeSchema),
      enabled: !!movieId,
    }
  );
}

export function useCinemaShowtimes(cinemaId: string, date?: string) {
  return useApiQuery<Showtime[]>(
    ["cinema-showtimes", cinemaId, date ?? ""],
    `/cinemas/${cinemaId}/showtimes`,
    date ? { date } : undefined,
    {
      schema: z.array(showtimeSchema),
      enabled: !!cinemaId,
    }
  );
}

// ─── Seats ─────────────────────────────────────────────────────────

export function useShowtimeSeats(showtimeId: string) {
  return useApiQuery<Seat[]>(
    ["showtime-seats", showtimeId],
    `/showtimes/${showtimeId}/seats`,
    undefined,
    {
      schema: z.array(seatSchema),
      enabled: !!showtimeId,
      staleTime: 30 * 1000, // 30 seconds -- seats change fast
    }
  );
}
