import type { Showtime } from "@/types/domain";

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
    const raw = (st.format || "2D").toUpperCase();
    const fmt = raw === "2D" ? "STANDARD" : raw;
    if (!group.byFormat[fmt]) group.byFormat[fmt] = [];
    group.byFormat[fmt].push(st);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.movieTitle.localeCompare(b.movieTitle, "vi"),
  );
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
