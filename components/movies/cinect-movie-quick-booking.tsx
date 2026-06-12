"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCinemas, useShowtimes } from "@/hooks/queries/use-cinemas";
import {
  BOOKING_CITY_CHANGED_EVENT,
  localCalendarDate,
  normalizeBookingCityId,
  SELECTED_CITY_STORAGE_KEY,
} from "@/lib/booking-region";
import type { Showtime } from "@/types/domain";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["cinema", "movie", "date", "showtime"] as const;
const AUTO_OPEN_DELAY_MS = 160;

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

function formatDateLabel(date: Date, locale: string, t: (key: string) => string) {
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
  if (isToday) return t("today");
  if (isTomorrow) return t("tomorrow");
  return date.toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

type CinectMovieQuickBookingProps = {
  className?: string;
};

export function CinectMovieQuickBooking({
  className,
}: CinectMovieQuickBookingProps) {
  const t = useTranslations("home");
  const tMovies = useTranslations("movies");
  const locale = useLocale();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [cityId, setCityId] = useState("");
  const [cinemaId, setCinemaId] = useState("");
  const [movieId, setMovieId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [showtimeId, setShowtimeId] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingAutoOpen = useRef<number | null>(null);
  const autoOpenTimer = useRef<number | null>(null);

  const clearAutoOpenTimer = useCallback(() => {
    if (autoOpenTimer.current !== null) {
      window.clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = null;
    }
  }, []);

  const openStepDropdown = useCallback(
    (step: number, delay = AUTO_OPEN_DELAY_MS) => {
      clearAutoOpenTimer();
      setOpenStep(null);
      autoOpenTimer.current = window.setTimeout(() => {
        setActiveStep(step);
        setOpenStep(step);
        window.requestAnimationFrame(() => {
          triggerRefs.current[step]?.focus({ preventScroll: true });
        });
        autoOpenTimer.current = null;
      }, delay);
    },
    [clearAutoOpenTimer]
  );

  const queueAutoOpen = useCallback((step: number) => {
    pendingAutoOpen.current = step;
    setActiveStep(step);
    setOpenStep(null);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function syncCityFromStorage() {
      const saved = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
      setCityId(normalizeBookingCityId(saved || ""));
    }
    syncCityFromStorage();
    window.addEventListener("storage", syncCityFromStorage);
    window.addEventListener(BOOKING_CITY_CHANGED_EVENT, syncCityFromStorage);
    return () => {
      window.removeEventListener("storage", syncCityFromStorage);
      window.removeEventListener(BOOKING_CITY_CHANGED_EVENT, syncCityFromStorage);
    };
  }, []);

  useEffect(() => () => clearAutoOpenTimer(), [clearAutoOpenTimer]);

  const { data: cinemasRes, isLoading: cinemasLoading } = useCinemas({
    city: cityId || undefined,
    limit: 120,
  });

  const cinemaMoviesParams = useMemo(
    () => (cinemaId ? { cinemaId } : undefined),
    [cinemaId]
  );
  const { data: cinemaShowtimesRes, isLoading: cinemaMoviesLoading } =
    useShowtimes(cinemaMoviesParams);

  const showtimeParams = useMemo(() => {
    if (!cinemaId || !movieId || !dateStr) return undefined;
    return { cinemaId, movieId, date: dateStr };
  }, [cinemaId, movieId, dateStr]);
  const { data: showtimesRes, isLoading: showtimesLoading } = useShowtimes(showtimeParams);

  const cinemas = toList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);
  const cinemaShowtimes = toList<Showtime>(cinemaShowtimesRes?.data ?? cinemaShowtimesRes);
  const showtimes = toList<Showtime>(showtimesRes?.data ?? showtimesRes);

  const moviesAtCinema = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const st of cinemaShowtimes) {
      if (!st.movieId) continue;
      map.set(st.movieId, { id: st.movieId, title: st.movieTitle ?? st.movieId });
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [cinemaShowtimes, locale]);

  const allDateOptions = useMemo(() => {
    if (!mounted) return [];
    const start = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: localCalendarDate(d), date: d };
    });
  }, [mounted]);

  const dateOptions = useMemo(() => {
    if (!cinemaId || !movieId) return allDateOptions;
    const dates = new Set(
      cinemaShowtimes
        .filter((st) => st.movieId === movieId)
        .map((st) => localCalendarDate(new Date(st.startTime)))
    );
    if (dates.size === 0) return allDateOptions;
    return allDateOptions.filter(({ iso }) => dates.has(iso));
  }, [allDateOptions, cinemaId, movieId, cinemaShowtimes]);

  const stepValues = [cinemaId, movieId, dateStr, showtimeId];
  const stepDone = stepValues.map(Boolean);

  useEffect(() => {
    setCinemaId("");
    setMovieId("");
    setDateStr("");
    setShowtimeId("");
    setActiveStep(0);
    setOpenStep(null);
    pendingAutoOpen.current = null;
  }, [cityId]);

  useEffect(() => {
    if (!cinemaId) return;
    if (!cinemas.some((c) => c.id === cinemaId)) {
      setCinemaId("");
      setMovieId("");
      setDateStr("");
      setShowtimeId("");
      queueAutoOpen(0);
      return;
    }
    if (movieId && !moviesAtCinema.some((m) => m.id === movieId)) {
      setMovieId("");
      setDateStr("");
      setShowtimeId("");
      queueAutoOpen(1);
    }
  }, [cinemaId, movieId, moviesAtCinema, cinemas, queueAutoOpen]);

  useEffect(() => {
    const step = pendingAutoOpen.current;
    if (step === null) return;

    if (step === 1) {
      if (cinemaMoviesLoading) return;
      if (moviesAtCinema.length === 0) {
        pendingAutoOpen.current = null;
        return;
      }
    }

    if (step === 3) {
      if (!dateStr || showtimesLoading) return;
      if (showtimes.length === 0) {
        pendingAutoOpen.current = null;
        return;
      }
    }

    pendingAutoOpen.current = null;
    openStepDropdown(step);
  }, [
    cinemaMoviesLoading,
    moviesAtCinema.length,
    dateStr,
    showtimesLoading,
    showtimes.length,
    openStepDropdown,
  ]);

  function handleCinemaChange(value: string) {
    setCinemaId(value);
    setMovieId("");
    setDateStr("");
    setShowtimeId("");
    queueAutoOpen(1);
  }

  function handleMovieChange(value: string) {
    setMovieId(value);
    setDateStr("");
    setShowtimeId("");
    openStepDropdown(2);
  }

  function handleDateChange(value: string) {
    setDateStr(value);
    setShowtimeId("");
    queueAutoOpen(3);
  }

  function handleShowtimeChange(value: string) {
    setShowtimeId(value);
    setActiveStep(4);
    setOpenStep(null);
    clearAutoOpenTimer();
  }

  function handleBook() {
    if (!showtimeId) return;
    router.push(`/booking/${showtimeId}`);
  }

  const steps = [
    {
      key: STEP_KEYS[0],
      placeholder: t("selectCinema"),
      ariaLabel: t("selectCinema"),
      value: cinemaId || undefined,
      onChange: handleCinemaChange,
      loading: cinemasLoading,
      options: cinemas.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: STEP_KEYS[1],
      placeholder: t("selectMovie"),
      ariaLabel: t("selectMovie"),
      value: movieId || undefined,
      onChange: handleMovieChange,
      loading: cinemaMoviesLoading,
      options: moviesAtCinema.map((m) => ({ value: m.id, label: m.title })),
    },
    {
      key: STEP_KEYS[2],
      placeholder: t("selectDate"),
      ariaLabel: t("selectDate"),
      value: dateStr || undefined,
      onChange: handleDateChange,
      loading: false,
      options: dateOptions.map(({ iso, date }) => ({
        value: iso,
        label: formatDateLabel(date, locale, t),
      })),
    },
    {
      key: STEP_KEYS[3],
      placeholder: t("selectShowtime"),
      ariaLabel: t("selectShowtime"),
      value: showtimeId || undefined,
      onChange: handleShowtimeChange,
      loading: showtimesLoading,
      options: showtimes.map((st) => ({
        value: st.id,
        label: formatShowtimeLabel(st, locale),
      })),
    },
  ] as const;

  if (!mounted) {
    return (
      <section className={cn("cinect-movie-quick-book", className)} aria-hidden>
        <div className="cinect-movie-quick-book__inner">
          <div className="cinect-movie-quick-book__title-skeleton" />
          <div className="cinect-movie-quick-book__fields">
            {STEP_KEYS.map((key) => (
              <div key={key} className="cinect-movie-quick-book__select-skeleton" />
            ))}
          </div>
          <div className="cinect-movie-quick-book__submit-skeleton" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("cinect-movie-quick-book", className)}
      aria-labelledby="cinect-movie-quick-book-title"
    >
      <div className="cinect-movie-quick-book__inner">
        <h1 id="cinect-movie-quick-book-title" className="cinect-movie-quick-book__title">
          {t("quickBooking")}
        </h1>

        <div className="cinect-movie-quick-book__fields">
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            const isDone = stepDone[index];
            const isInteractive = isActive || isDone;
            const canOpen =
              isInteractive &&
              !step.loading &&
              !(index === 1 && !cinemaId) &&
              !(index === 2 && (!cinemaId || !movieId)) &&
              !(index === 3 && (!cinemaId || !movieId || !dateStr || step.options.length === 0));

            let placeholder = step.placeholder;
            if (index === 0 && cityId && !step.loading && step.options.length === 0) {
              placeholder = t("noCinemasInCity");
            }
            if (index === 1 && cinemaId && step.loading) placeholder = t("loadingOptions");
            if (index === 1 && cinemaId && !step.loading && step.options.length === 0) {
              placeholder = tMovies("noShowtimes");
            }
            if (index === 3 && cinemaId && movieId && dateStr && step.loading) {
              placeholder = t("loadingOptions");
            }
            if (index === 3 && cinemaId && movieId && dateStr && !step.loading && step.options.length === 0) {
              placeholder = tMovies("noShowtimes");
            }

            return (
              <div
                key={step.key}
                className={cn(
                  "cinect-movie-quick-book__item",
                  isInteractive && "cinect-movie-quick-book__item--interactive",
                  isActive && "cinect-movie-quick-book__item--active",
                  isDone && "cinect-movie-quick-book__item--done",
                  openStep === index && "cinect-movie-quick-book__item--open"
                )}
              >
                <Select
                  value={step.value}
                  open={canOpen && openStep === index}
                  onValueChange={step.onChange}
                  disabled={!canOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      clearAutoOpenTimer();
                      pendingAutoOpen.current = null;
                      setActiveStep(index);
                      setOpenStep(index);
                      return;
                    }
                    if (openStep === index) setOpenStep(null);
                  }}
                >
                  <SelectTrigger
                    ref={(el) => {
                      triggerRefs.current[index] = el;
                    }}
                    className="cinect-movie-quick-book__select"
                    aria-label={step.ariaLabel}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent className="cinect-movie-quick-book__content">
                    {step.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="cinect-movie-quick-book__option"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={cn(
            "cinect-movie-quick-book__submit cinect-btn-purple",
            !showtimeId && "cinect-movie-quick-book__submit--locked",
            showtimeId && "cinect-movie-quick-book__submit--ready"
          )}
          onClick={handleBook}
        >
          <span>{tMovies("bookNowSubmit")}</span>
        </button>
      </div>
    </section>
  );
}
