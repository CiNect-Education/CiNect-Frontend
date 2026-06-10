import type { Showtime } from "@/types/domain";

export type ShowtimeListItem = Showtime & {
  cinemaName?: string | null;
  cinemaSlug?: string | null;
  cinemaAddress?: string | null;
  movieTitle?: string | null;
  moviePosterUrl?: string | null;
  movieSlug?: string | null;
  movieDuration?: number | null;
  movieAgeRating?: string | null;
  movieLanguage?: string | null;
  movieSubtitles?: string | null;
  movieGenres?: string[];
  roomFormat?: string | null;
};

export type ShowtimeTheaterGroup = {
  cinemaId: string;
  cinemaName: string;
  cinemaSlug?: string | null;
  cinemaAddress?: string | null;
  byFormat: Record<string, ShowtimeListItem[]>;
};

export type ShowtimeMovieBlock = {
  movieId: string;
  movieTitle: string;
  movieSlug?: string | null;
  moviePosterUrl?: string | null;
  movieDuration?: number | null;
  movieAgeRating?: string | null;
  movieLanguage?: string | null;
  movieSubtitles?: string | null;
  movieGenres?: string[];
  theaters: ShowtimeTheaterGroup[];
};

/** Cinestar showtimes page: Standard vs Deluxe tier labels */
export function formatShowtimeTierLabel(
  format?: string | null,
  roomName?: string | null,
): string {
  const room = (roomName || "").toLowerCase();
  if (room.includes("deluxe")) return "Deluxe";
  const raw = (format || "2D").toUpperCase();
  if (raw === "2D" || raw === "STANDARD") return "Standard";
  if (["IMAX", "4DX", "DOLBY", "3D"].includes(raw)) return "Deluxe";
  return "Standard";
}

export function groupShowtimesForShowtimesPage(
  showtimes: ShowtimeListItem[],
): ShowtimeMovieBlock[] {
  const movieMap = new Map<string, ShowtimeMovieBlock>();

  for (const st of showtimes) {
    let block = movieMap.get(st.movieId);
    if (!block) {
      block = {
        movieId: st.movieId,
        movieTitle: st.movieTitle ?? "—",
        movieSlug: st.movieSlug,
        moviePosterUrl: st.moviePosterUrl,
        movieDuration: st.movieDuration,
        movieAgeRating: st.movieAgeRating,
        movieLanguage: st.movieLanguage,
        movieSubtitles: st.movieSubtitles,
        movieGenres: st.movieGenres,
        theaters: [],
      };
      movieMap.set(st.movieId, block);
    }

    const cinemaId = st.cinemaId;
    let theater = block.theaters.find((t) => t.cinemaId === cinemaId);
    if (!theater) {
      theater = {
        cinemaId,
        cinemaName: st.cinemaName ?? "—",
        cinemaSlug: st.cinemaSlug,
        cinemaAddress: st.cinemaAddress,
        byFormat: {},
      };
      block.theaters.push(theater);
    }

    const tier = formatShowtimeTierLabel(st.format, st.roomName);
    if (!theater.byFormat[tier]) theater.byFormat[tier] = [];
    theater.byFormat[tier].push(st);
  }

  for (const block of movieMap.values()) {
    block.theaters.sort((a, b) => a.cinemaName.localeCompare(b.cinemaName, "vi"));
    for (const theater of block.theaters) {
      for (const list of Object.values(theater.byFormat)) {
        list.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
      }
    }
  }

  return Array.from(movieMap.values()).sort((a, b) =>
    a.movieTitle.localeCompare(b.movieTitle, "vi"),
  );
}

export function uniqueMoviesFromShowtimes(showtimes: ShowtimeListItem[]) {
  const map = new Map<string, { id: string; title: string }>();
  for (const st of showtimes) {
    if (!map.has(st.movieId)) {
      map.set(st.movieId, { id: st.movieId, title: st.movieTitle ?? st.movieId });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export function uniqueCinemasFromShowtimes(showtimes: ShowtimeListItem[]) {
  const map = new Map<string, { id: string; name: string }>();
  for (const st of showtimes) {
    if (!map.has(st.cinemaId)) {
      map.set(st.cinemaId, { id: st.cinemaId, name: st.cinemaName ?? st.cinemaId });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function formatShowtimeClock(time: string, locale: string): string {
  return new Date(time).toLocaleTimeString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatShowtimesDateOption(
  date: Date,
  locale: string,
  todayLabel: string,
  tomorrowLabel: string,
): string {
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

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  if (isToday) {
    return locale.startsWith("vi")
      ? `${todayLabel} ${dd}/${mm}`
      : `${todayLabel} ${mm}/${dd}`;
  }
  if (isTomorrow) {
    return locale.startsWith("vi")
      ? `${tomorrowLabel} ${dd}/${mm}`
      : `${tomorrowLabel} ${mm}/${dd}`;
  }
  if (locale.startsWith("vi")) {
    return `${dd}/${mm}/${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}
