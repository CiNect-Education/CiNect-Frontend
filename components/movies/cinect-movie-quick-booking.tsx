"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMovies } from "@/hooks/queries/use-movies";
import { useCinemas, useShowtimes } from "@/hooks/queries/use-cinemas";
import { localCalendarDate } from "@/lib/booking-region";
import type { Showtime } from "@/types/domain";

const ANY = "__ANY__";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? (arr as T[]) : [];
}

function formatShowtimeLabel(st: Showtime, locale: string) {
  const start = new Date(st.startTime);
  const time = start.toLocaleTimeString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const room = st.roomName ?? st.format ?? "";
  return room ? `${time} · ${room}` : time;
}

export function CinectMovieQuickBooking() {
  const t = useTranslations("home");
  const tMovies = useTranslations("movies");
  const locale = useLocale();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [cinemaId, setCinemaId] = useState(ANY);
  const [movieId, setMovieId] = useState(ANY);
  const [dateStr, setDateStr] = useState("");
  const [showtimeId, setShowtimeId] = useState(ANY);

  useEffect(() => {
    setDateStr(localCalendarDate());
    setMounted(true);
  }, []);

  const { data: moviesRes, isLoading: moviesLoading } = useMovies({
    status: "NOW_SHOWING",
    limit: 80,
  });
  const { data: cinemasRes, isLoading: cinemasLoading } = useCinemas({ limit: 120 });
  const showtimeParams = useMemo(() => {
    if (cinemaId === ANY || movieId === ANY || !dateStr) return undefined;
    return { cinemaId, movieId, date: dateStr };
  }, [cinemaId, movieId, dateStr]);

  const { data: showtimesRes, isLoading: showtimesLoading } = useShowtimes(showtimeParams);

  const movies = toList<{ id: string; title: string }>(moviesRes?.data ?? moviesRes);
  const cinemas = toList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);
  const showtimes = toList<Showtime>(showtimesRes?.data ?? showtimesRes);

  const dateOptions = useMemo(() => {
    if (!mounted) return [];
    const start = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: localCalendarDate(d), date: d };
    });
  }, [mounted]);

  useEffect(() => {
    setShowtimeId(ANY);
  }, [cinemaId, movieId, dateStr]);

  function handleBook() {
    if (showtimeId !== ANY) {
      router.push(`/booking/${showtimeId}`);
      return;
    }
    const params = new URLSearchParams();
    if (cinemaId !== ANY) params.set("cinema", cinemaId);
    if (movieId !== ANY) params.set("movie", movieId);
    if (dateStr) params.set("date", dateStr);
    router.push(`/showtimes?${params.toString()}`);
  }

  const canBook = showtimeId !== ANY || dateStr.length > 0;

  return (
    <section className="cinect-movie-quick-book" aria-labelledby="cinect-movie-quick-book-title">
      <div className="cinect-movie-quick-book__inner">
        <h1 id="cinect-movie-quick-book-title" className="cinect-movie-quick-book__title">
          {t("quickBooking")}
        </h1>

        <div className="cinect-movie-quick-book__fields">
          <Select value={cinemaId} onValueChange={setCinemaId} disabled={cinemasLoading}>
            <SelectTrigger className="cinect-movie-quick-book__select" aria-label={t("selectCinema")}>
              <SelectValue placeholder={t("selectCinema")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("selectCinema")}</SelectItem>
              {cinemas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={movieId} onValueChange={setMovieId} disabled={moviesLoading}>
            <SelectTrigger className="cinect-movie-quick-book__select" aria-label={t("selectMovie")}>
              <SelectValue placeholder={t("selectMovie")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("selectMovie")}</SelectItem>
              {movies.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mounted ? dateStr : undefined} onValueChange={setDateStr} disabled={!mounted}>
            <SelectTrigger className="cinect-movie-quick-book__select" aria-label={t("selectDate")}>
              <SelectValue placeholder={mounted ? t("today") : t("selectDate")} />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map(({ iso, date }) => {
                const now = new Date();
                const isToday =
                  date.getFullYear() === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate();
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                const isTomorrow =
                  date.getFullYear() === tomorrow.getFullYear() &&
                  date.getMonth() === tomorrow.getMonth() &&
                  date.getDate() === tomorrow.getDate();
                const label = isToday
                  ? t("today")
                  : isTomorrow
                    ? t("tomorrow")
                    : date.toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      });
                return (
                  <SelectItem key={iso} value={iso}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={showtimeId}
            onValueChange={setShowtimeId}
            disabled={
              showtimesLoading ||
              cinemaId === ANY ||
              movieId === ANY ||
              !dateStr ||
              showtimes.length === 0
            }
          >
            <SelectTrigger className="cinect-movie-quick-book__select" aria-label={t("selectShowtime")}>
              <SelectValue
                placeholder={
                  cinemaId !== ANY && movieId !== ANY && dateStr
                    ? showtimesLoading
                      ? t("loadingOptions")
                      : showtimes.length === 0
                        ? tMovies("noShowtimes")
                        : t("selectShowtime")
                    : t("selectShowtime")
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("selectShowtime")}</SelectItem>
              {showtimes.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {formatShowtimeLabel(st, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button type="button" className="cinect-movie-quick-book__submit" disabled={!canBook} onClick={handleBook}>
          {tMovies("bookNowSubmit")}
        </button>
      </div>
    </section>
  );
}
