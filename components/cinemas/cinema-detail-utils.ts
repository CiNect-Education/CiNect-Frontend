import type { Showtime } from "@/types/domain";
import { localCalendarDate } from "@/lib/booking-region";

export type CinemaDetailTab = "nowShowing" | "comingSoon" | "special" | "prices";

export type MovieShowtimeGroup = {
  movieId: string;
  movieTitle: string;
  movieSlug?: string | null;
  moviePosterUrl?: string | null;
  movieDuration?: number | null;
  movieAgeRating?: string | null;
  movieLanguage?: string | null;
  movieSubtitles?: string | null;
  movieGenres?: string[];
  byFormat: Record<string, Showtime[]>;
};

export function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? (arr as T[]) : [];
}

/** Cinestar label: 2D → Standard, IMAX stays IMAX */
export function formatShowtimeFormatLabel(format?: string | null): string {
  const raw = (format || "2D").toUpperCase();
  if (raw === "2D" || raw === "STANDARD") return "Standard";
  return format?.trim() || "Standard";
}

export function groupShowtimesByMovie(showtimes: Showtime[]): MovieShowtimeGroup[] {
  const map = new Map<string, MovieShowtimeGroup>();

  for (const st of showtimes) {
    const movieId = st.movieId;
    if (!map.has(movieId)) {
      map.set(movieId, {
        movieId,
        movieTitle: st.movieTitle ?? "—",
        movieSlug: (st as Showtime & { movieSlug?: string }).movieSlug,
        moviePosterUrl: st.moviePosterUrl,
        movieDuration: (st as Showtime & { movieDuration?: number }).movieDuration,
        movieAgeRating: (st as Showtime & { movieAgeRating?: string }).movieAgeRating,
        movieLanguage: (st as Showtime & { movieLanguage?: string }).movieLanguage,
        movieSubtitles: (st as Showtime & { movieSubtitles?: string }).movieSubtitles,
        movieGenres: (st as Showtime & { movieGenres?: string[] }).movieGenres,
        byFormat: {},
      });
    }
    const group = map.get(movieId)!;
    const fmt = formatShowtimeFormatLabel(st.format);
    if (!group.byFormat[fmt]) group.byFormat[fmt] = [];
    group.byFormat[fmt].push(st);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.movieTitle.localeCompare(b.movieTitle, "vi"),
  );
}

export function getMovieShowDates(group: MovieShowtimeGroup): string[] {
  const dates = new Set<string>();
  for (const list of Object.values(group.byFormat)) {
    for (const st of list) {
      dates.add(localCalendarDate(new Date(st.startTime)));
    }
  }
  return Array.from(dates).sort();
}

export type MovieDateShowtimeBlock = {
  dateIso: string;
  date: Date;
  byFormat: Record<string, Showtime[]>;
};

/** Cinestar shows at most 2 `.movies-rp-block` per movie on book-tickets */
export const CINEMA_DETAIL_MAX_DATE_BLOCKS = 2;

/** Cinestar: one `.movies-rp-block` per screening date (max 2) */
export function groupShowtimesByDateBlocks(
  group: MovieShowtimeGroup,
  dateOptions: { iso: string; date: Date }[],
  maxBlocks = CINEMA_DETAIL_MAX_DATE_BLOCKS,
): MovieDateShowtimeBlock[] {
  const available = new Set(getMovieShowDates(group));
  const dates = dateOptions.filter((d) => available.has(d.iso));
  const source = dates.length > 0 ? dates : dateOptions.slice(0, 7);
  const today = localCalendarDate();

  const blocks = source
    .map(({ iso, date }) => {
      const byFormat: Record<string, Showtime[]> = {};
      for (const list of Object.values(group.byFormat)) {
        for (const st of list) {
          if (localCalendarDate(new Date(st.startTime)) !== iso) continue;
          const fmt = formatShowtimeFormatLabel(st.format);
          if (!byFormat[fmt]) byFormat[fmt] = [];
          byFormat[fmt].push(st);
        }
      }
      for (const list of Object.values(byFormat)) {
        list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      }
      return { dateIso: iso, date, byFormat };
    })
    .filter((block) => Object.keys(block.byFormat).length > 0)
    .sort((a, b) => {
      if (a.dateIso === today) return -1;
      if (b.dateIso === today) return 1;
      return a.dateIso.localeCompare(b.dateIso);
    });

  return blocks.slice(0, maxBlocks);
}

export function filterDateOptionsForMovie(
  group: MovieShowtimeGroup,
  dateOptions: { iso: string; date: Date }[],
): { iso: string; date: Date }[] {
  const available = new Set(getMovieShowDates(group));
  const filtered = dateOptions.filter((d) => available.has(d.iso));
  return filtered.length > 0 ? filtered : dateOptions.slice(0, 7);
}

export function defaultDateForMovie(
  group: MovieShowtimeGroup,
  dateOptions: { iso: string; date: Date }[],
  fallback: string,
): string {
  const filtered = filterDateOptionsForMovie(group, dateOptions);
  const today = localCalendarDate();
  if (filtered.some((d) => d.iso === today)) return today;
  if (filtered.some((d) => d.iso === fallback)) return fallback;
  return filtered[0]?.iso ?? fallback;
}

export function formatCinemaDateLabel(date: Date, locale: string): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const weekday = date.getDay();

  if (locale.startsWith("vi")) {
    const viWeekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dd = String(day).padStart(2, "0");
    const mm = String(month).padStart(2, "0");
    return `${viWeekdays[weekday]}, ${dd}/${mm}/${date.getFullYear()}`;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShowtimeTime(st: Showtime, locale: string): string {
  return new Date(st.startTime).toLocaleTimeString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Map API age codes to i18n keys (Cinestar uses T13/T16/T18 labels) */
export function ageRatingMessageKey(
  age: string,
): "ageRatingDesc.P" | "ageRatingDesc.K" | "ageRatingDesc.C13" | "ageRatingDesc.C16" | "ageRatingDesc.C18" | null {
  const n = age.toUpperCase();
  if (n === "P") return "ageRatingDesc.P";
  if (n === "K") return "ageRatingDesc.K";
  if (n === "C13" || n === "T13") return "ageRatingDesc.C13";
  if (n === "C16" || n === "T16") return "ageRatingDesc.C16";
  if (n === "C18" || n === "T18") return "ageRatingDesc.C18";
  return null;
}
