"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientMounted } from "@/lib/use-client-mounted";
import { useSearchParams, useRouter } from "next/navigation";
import { useShowtimes } from "@/hooks/queries/use-cinemas";
import {
  BOOKING_CITY_CHANGED_EVENT,
  SELECTED_CITY_STORAGE_KEY,
  localCalendarDate,
  normalizeBookingCityId,
} from "@/lib/booking-region";
import { apiClient } from "@/lib/api-client";
import {
  groupShowtimesForShowtimesPage,
  uniqueCinemasFromShowtimes,
  uniqueMoviesFromShowtimes,
  type ShowtimeListItem,
} from "@/lib/showtimes-page-utils";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? (arr as T[]) : [];
}

export function useShowtimesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mounted = useClientMounted();
  const [storedCity, setStoredCity] = useState("");

  const dateFromParams = searchParams.get("date") || "";
  const movieId = searchParams.get("movie") || "";
  const cinemaId = searchParams.get("cinema") || "";

  useEffect(() => {
    setStoredCity(normalizeBookingCityId(localStorage.getItem(SELECTED_CITY_STORAGE_KEY) || ""));
  }, []);

  // Code quan trọng: Tự động tìm kiếm ngày có suất chiếu gần nhất của phim (movieId) và chọn ngày đó.
  useEffect(() => {
    if (!mounted || dateFromParams || !movieId) return;

    let active = true;
    async function fetchNearestDate() {
      try {
        const params: Record<string, string> = { movieId };
        const cityId = normalizeBookingCityId(localStorage.getItem(SELECTED_CITY_STORAGE_KEY) || "");
        if (cityId) params.city = cityId;

        // Gọi API showtimes không truyền ngày, backend sẽ tìm trong 30 ngày (vì có movieId)
        const res = await apiClient.get<any[]>("/showtimes", params);
        const list = res.data ?? res;

        if (active && Array.isArray(list) && list.length > 0) {
          const firstShowtime = list[0];
          if (firstShowtime?.startTime) {
            // Chuyển startTime của suất chiếu gần nhất thành định dạng YYYY-MM-DD
            const nearestDate = localCalendarDate(new Date(firstShowtime.startTime));
            const p = new URLSearchParams(window.location.search);
            p.set("date", nearestDate);
            router.replace(`?${p.toString()}`);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch nearest date for showtimes", err);
      }

      // Fallback: Nếu không tìm thấy suất chiếu nào hoặc API lỗi, chọn ngày hôm nay
      if (active) {
        const p = new URLSearchParams(window.location.search);
        p.set("date", localCalendarDate(new Date()));
        router.replace(`?${p.toString()}`);
      }
    }

    fetchNearestDate();
    return () => {
      active = false;
    };
  }, [mounted, dateFromParams, movieId, router]);

  // Code quan trọng: Fallback chọn ngày hôm nay khi chưa có date và không lọc theo phim
  useEffect(() => {
    if (!mounted || dateFromParams || movieId) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set("date", localCalendarDate(new Date()));
    router.replace(`?${p.toString()}`);
  }, [mounted, dateFromParams, movieId, router, searchParams]);

  useEffect(() => {
    function sync() {
      setStoredCity(normalizeBookingCityId(localStorage.getItem(SELECTED_CITY_STORAGE_KEY) || ""));
    }
    window.addEventListener("storage", sync);
    window.addEventListener(BOOKING_CITY_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(BOOKING_CITY_CHANGED_EVENT, sync);
    };
  }, []);

  const city = normalizeBookingCityId(storedCity);
  const today = useMemo(() => new Date(), [mounted]);
  const date = dateFromParams || (mounted ? localCalendarDate(today) : "");

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (city) p.city = city;
    if (date) p.date = date;
    return p;
  }, [city, date]);

  const { data: showtimesRes, isLoading, error, refetch } = useShowtimes(
    mounted && date ? apiParams : undefined,
  );

  const allShowtimes = useMemo(
    () => toList<ShowtimeListItem>(showtimesRes?.data ?? showtimesRes),
    [showtimesRes],
  );

  const filteredShowtimes = useMemo(() => {
    return allShowtimes.filter((st) => {
      if (movieId && st.movieId !== movieId) return false;
      if (cinemaId && st.cinemaId !== cinemaId) return false;
      return true;
    });
  }, [allShowtimes, movieId, cinemaId]);

  const movieBlocks = useMemo(
    () => groupShowtimesForShowtimesPage(filteredShowtimes),
    [filteredShowtimes],
  );

  const movieOptions = useMemo(() => uniqueMoviesFromShowtimes(allShowtimes), [allShowtimes]);
  const cinemaOptions = useMemo(() => uniqueCinemasFromShowtimes(allShowtimes), [allShowtimes]);

  const dateOptions = useMemo(() => {
    if (!mounted) return [];
    const start = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: localCalendarDate(d), date: d };
    });
  }, [mounted]);

  const pushParams = useCallback(
    (patch: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) p.set(key, value);
        else p.delete(key);
      }
      router.push(`?${p.toString()}`);
    },
    [router, searchParams],
  );

  const setDate = useCallback(
    (d: string) => pushParams({ date: d }),
    [pushParams],
  );

  const setMovie = useCallback(
    (id: string) => pushParams({ movie: id || null }),
    [pushParams],
  );

  const setCinema = useCallback(
    (id: string) => pushParams({ cinema: id || null }),
    [pushParams],
  );

  return {
    mounted,
    city,
    date,
    movieId,
    cinemaId,
    today,
    dateOptions,
    movieOptions,
    cinemaOptions,
    movieBlocks,
    isLoading: !mounted || isLoading,
    error,
    refetch,
    setDate,
    setMovie,
    setCinema,
  };
}
