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

export type ProvinceNewItem = {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  sortOrder: number;
};

export type ProvinceLegacyItem = {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  provinceNew: {
    code: string;
    nameVi: string;
    nameEn: string;
  };
};

// ─── Cinema list ───────────────────────────────────────────────────

export function useCinemas(params?: QueryParams) {
  return useApiQuery<CinemaListItem[]>(["cinemas", JSON.stringify(params)], "/cinemas", params, {
    schema: z.array(cinemaListItemSchema) as unknown as z.ZodType<CinemaListItem[]>,
  });
}

export function useCinema(id: string) {
  return useApiQuery<Cinema>(["cinema", id], `/cinemas/${id}`, undefined, {
    schema: cinemaSchema as unknown as z.ZodType<Cinema>,
    enabled: !!id,
  });
}

export function useProvincesNew() {
  return useApiQuery<ProvinceNewItem[]>(["provinces", "new"], "/provinces/new", undefined, {
    schema: z.array(
      z.object({
        id: z.string(),
        code: z.string(),
        nameVi: z.string(),
        nameEn: z.string(),
        sortOrder: z.number(),
      })
    ) as unknown as z.ZodType<ProvinceNewItem[]>,
  });
}

export function useProvincesLegacy() {
  return useApiQuery<ProvinceLegacyItem[]>(["provinces", "legacy"], "/provinces/legacy", undefined, {
    schema: z.array(
      z.object({
        id: z.string(),
        code: z.string(),
        nameVi: z.string(),
        nameEn: z.string(),
        provinceNew: z.object({
          code: z.string(),
          nameVi: z.string(),
          nameEn: z.string(),
        }),
      })
    ) as unknown as z.ZodType<ProvinceLegacyItem[]>,
  });
}

// ─── Showtimes ─────────────────────────────────────────────────────

export function useShowtimes(params?: QueryParams) {
  return useApiQuery<Showtime[]>(["showtimes", JSON.stringify(params)], "/showtimes", params, {
    schema: z.array(showtimeSchema) as unknown as z.ZodType<Showtime[]>,
  });
}

export function useShowtime(id: string) {
  return useApiQuery<Showtime>(["showtime", id], `/showtimes/${id}`, undefined, {
    schema: showtimeSchema as unknown as z.ZodType<Showtime>,
    enabled: !!id,
  });
}

export function useShowtimeSearch(params?: QueryParams) {
  return useApiQuery<Showtime[]>(
    ["showtimes", "search", JSON.stringify(params)],
    "/showtimes/search",
    params,
    {
      schema: z.array(showtimeSchema) as unknown as z.ZodType<Showtime[]>,
      enabled: !!params?.city && !!params?.date,
    }
  );
}

export function useMovieShowtimes(movieId: string, params?: { city?: string; date?: string }) {
  return useApiQuery<Showtime[]>(
    ["movie-showtimes", movieId, JSON.stringify(params)],
    `/movies/${movieId}/showtimes`,
    params as QueryParams,
    {
      schema: z.array(showtimeSchema) as unknown as z.ZodType<Showtime[]>,
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
      schema: z.array(showtimeSchema) as unknown as z.ZodType<Showtime[]>,
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
      schema: z.array(seatSchema) as unknown as z.ZodType<Seat[]>,
      enabled: !!showtimeId,
      staleTime: 30 * 1000, // 30 seconds -- seats change fast
    }
  );
}
