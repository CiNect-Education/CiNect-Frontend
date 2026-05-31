"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RemoteImage } from "@/components/shared/remote-image";
import { countryLabelForLanguage } from "@/lib/movie-display";
import { localizeAudioLabel } from "@/lib/showtime-display";
import { cn } from "@/lib/utils";
import type { Showtime } from "@/types/domain";
import {
  formatCinemaDateLabel,
  formatShowtimeTime,
  type MovieShowtimeGroup,
} from "./cinema-detail-utils";
import { localCalendarDate } from "@/lib/booking-region";

interface CinemaDetailMovieRowProps {
  group: MovieShowtimeGroup;
  cinemaId: string;
  movieDate: string;
  dateOptions: { iso: string; date: Date }[];
  onDateChange: (iso: string) => void;
}

export function CinemaDetailMovieRow({
  group,
  cinemaId,
  movieDate,
  dateOptions,
  onDateChange,
}: CinemaDetailMovieRowProps) {
  const locale = useLocale();
  const t = useTranslations("cinemas");
  const tMovies = useTranslations("movies");
  const tShow = useTranslations("showtimeDisplay");

  const showtimesForDate = useMemo(() => {
    const merged: Showtime[] = [];
    for (const list of Object.values(group.byFormat)) {
      for (const st of list) {
        if (localCalendarDate(new Date(st.startTime)) === movieDate) merged.push(st);
      }
    }
    merged.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return merged;
  }, [group.byFormat, movieDate]);

  const byFormatForDate = useMemo(() => {
    const out: Record<string, Showtime[]> = {};
    for (const st of showtimesForDate) {
      const raw = (st.format || "2D").toUpperCase();
      const fmt = raw === "2D" ? "STANDARD" : raw;
      if (!out[fmt]) out[fmt] = [];
      out[fmt].push(st);
    }
    return out;
  }, [showtimesForDate]);

  const genres = group.movieGenres?.join(", ") ?? "";
  const country = countryLabelForLanguage(group.movieLanguage ?? undefined, (k) => tMovies(k));
  const audio = group.movieLanguage
    ? localizeAudioLabel(group.movieLanguage, (k) => tShow(k))
    : null;
  const subs = group.movieSubtitles
    ? localizeAudioLabel(group.movieSubtitles, (k) => tShow(k))
    : null;
  const age = group.movieAgeRating ?? "";
  const ageDescKey = age
    ? (`ageRatingDesc.${age}` as "ageRatingDesc.P" | "ageRatingDesc.K" | "ageRatingDesc.C13" | "ageRatingDesc.C16" | "ageRatingDesc.C18")
    : null;
  const ageDesc = ageDescKey ? t(ageDescKey) : null;

  return (
    <div className="cinect-movies-item">
      <div className="cinect-movies-wr">
        <div className="cinect-movies-img">
          <Link
            href={
              group.movieSlug
                ? `/movies/${group.movieSlug}`
                : `/showtimes?cinema=${cinemaId}&movie=${group.movieId}`
            }
          >
            {group.moviePosterUrl ? (
              <RemoteImage
                src={group.moviePosterUrl}
                alt={group.movieTitle}
                fill
                sizes="(max-width: 767px) 120px, 280px"
                className="object-cover"
              />
            ) : (
              <div className="cinect-movies-img__placeholder" />
            )}
          </Link>
        </div>

        <div className="cinect-movies-content">
          <h3 className="cinect-movies-name">
            <Link
              href={
                group.movieSlug
                  ? `/movies/${group.movieSlug}`
                  : `/showtimes?cinema=${cinemaId}&movie=${group.movieId}`
              }
            >
              {group.movieTitle}
              {age ? ` (${age})` : ""}
            </Link>
          </h3>

          <ul className="cinect-movies-type">
            {ageDesc ? <li>{ageDesc}</li> : null}
            {genres ? <li>{genres}</li> : null}
            {group.movieDuration ? <li>{group.movieDuration}</li> : null}
            {country ? <li>{country}</li> : null}
            {audio ? <li>{audio}</li> : null}
            {subs ? <li>{subs}</li> : null}
          </ul>

          <div className="cinect-movies-rp">
            <div className="cinect-movies-rp-block is-active">
              <div className="cinect-movies-rp-day">
                <Select value={movieDate} onValueChange={onDateChange}>
                  <SelectTrigger
                    className="cinect-movies-rp-day__select"
                    aria-label={t("selectShowtimeDate")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map(({ iso, date }) => (
                      <SelectItem key={iso} value={iso}>
                        {formatCinemaDateLabel(date, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="cinect-movies-rp-body">
                {Object.keys(byFormatForDate).length > 0 ? (
                  Object.entries(byFormatForDate).map(([fmt, times]) => (
                    <div key={fmt} className="cinect-movies-rp-item">
                      <p className="cinect-movies-rp-title">{fmt}</p>
                      <div className="cinect-movies-time">
                        {times.map((st, idx) => (
                          <Link
                            key={st.id}
                            href={`/booking/${st.id}`}
                            className={cn(
                              "cinect-movies-time-item",
                              idx === 0 && "is-active",
                            )}
                          >
                            {formatShowtimeTime(st, locale)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="cinect-movies-rp-empty">{t("noShowtimesOnDate")}</p>
                )}

                <Link
                  href={`/showtimes?cinema=${cinemaId}&movie=${group.movieId}&date=${movieDate}`}
                  className="cinect-movies-more"
                >
                  {t("viewMoreShowtimes")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
