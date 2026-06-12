"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CirclePlay, Clock, Film, Globe, Subtitles, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { countryLabelForLanguage } from "@/lib/movie-display";
import { localizeAudioLabel, localizeRoomFormat } from "@/lib/showtime-display";
import {
  formatShowtimeClock,
  type ShowtimeMovieBlock,
} from "@/lib/showtimes-page-utils";
import { ageRatingMessageKey } from "@/components/cinemas/cinema-detail-utils";

function MetaRow({ icon: Icon, children }: { icon: typeof Tag; children: ReactNode }) {
  return (
    <li>
      <Icon className="meta-ic" aria-hidden />
      <span className="txt">{children}</span>
    </li>
  );
}

type ShowtimesMovieBlockProps = {
  block: ShowtimeMovieBlock;
};

export function ShowtimesMovieBlock({ block }: ShowtimesMovieBlockProps) {
  const locale = useLocale();
  const t = useTranslations("cinemas");
  const tMovies = useTranslations("movies");
  const tShow = useTranslations("showtimeDisplay");

  const age = block.movieAgeRating ?? "";
  const ageKey = age ? ageRatingMessageKey(age) : null;
  const ageDesc = ageKey ? t(ageKey) : null;
  const displayAge =
    age === "C13" ? "T13" : age === "C16" ? "T16" : age === "C18" ? "T18" : age;
  const titleWithAge = displayAge
    ? `${block.movieTitle} (${displayAge})`
    : block.movieTitle;

  const movieHref = block.movieSlug
    ? `/movies/${block.movieSlug}`
    : `/showtimes?movie=${block.movieId}`;

  const genres = block.movieGenres?.join(", ") ?? "";
  const country = countryLabelForLanguage(block.movieLanguage ?? undefined, (k) =>
    tMovies(k),
  );
  const audio = block.movieLanguage
    ? localizeAudioLabel(block.movieLanguage, (k) => tShow(k))
    : null;
  const subtitles = block.movieSubtitles
    ? localizeAudioLabel(block.movieSubtitles, (k) => tShow(k))
    : null;
  const sampleShowtime = block.theaters[0]
    ? Object.values(block.theaters[0].byFormat)[0]?.[0]
    : undefined;
  const formatLabel = sampleShowtime?.format
    ? localizeRoomFormat(String(sampleShowtime.format), (k) => tShow(k))
    : null;

  const hasTheaters = block.theaters.length > 0;

  return (
    <article className="movies-showtime row">
      <div className="sec-showtimes-left col">
        <div className="movies-img">
          <Link href={movieHref} className="inner">
            {block.moviePosterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.moviePosterUrl} alt={block.movieTitle} loading="lazy" />
            ) : (
              <div className="movies-img__placeholder" />
            )}
          </Link>
        </div>
        <h2 className="movies-name">
          <Link href={movieHref}>{titleWithAge}</Link>
        </h2>
        <div className="movies-type">
          <ul>
            {genres ? <MetaRow icon={Tag}>{genres}</MetaRow> : null}
            {block.movieDuration ? (
              <MetaRow icon={Clock}>{block.movieDuration}&apos;</MetaRow>
            ) : null}
            {country ? <MetaRow icon={Globe}>{country}</MetaRow> : null}
            {audio ? <MetaRow icon={Film}>{audio}</MetaRow> : null}
            {subtitles ? <MetaRow icon={Subtitles}>{subtitles}</MetaRow> : null}
            {formatLabel ? <MetaRow icon={Film}>{formatLabel}</MetaRow> : null}
            {ageDesc ? <MetaRow icon={Tag}>{ageDesc}</MetaRow> : null}
          </ul>
        </div>
      </div>

      <div className="sec-showtimes-right col">
        {!hasTheaters ? (
          <div className="showtimes-no-slots">
            <span className="showtimes-no-slots__icon" aria-hidden>
              <CirclePlay />
            </span>
            <span>{tMovies("noShowtimes")}</span>
          </div>
        ) : (
          block.theaters.map((theater) => (
            <div key={theater.cinemaId} className="movies-list row">
              <h3 className="theater-heading">{theater.cinemaName}</h3>
              {theater.cinemaAddress ? (
                <p className="theater-sub">{theater.cinemaAddress}</p>
              ) : null}
              {Object.entries(theater.byFormat).map(([fmt, times]) => (
                <div key={fmt} className="movies-time">
                  <p className="movies-rp-title">{fmt}</p>
                  <div className="movies-time-items">
                    {times.map((st) => (
                      <Link
                        key={st.id}
                        href={`/booking/${st.id}`}
                        className="movies-time-item"
                      >
                        {formatShowtimeClock(st.startTime, locale)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
