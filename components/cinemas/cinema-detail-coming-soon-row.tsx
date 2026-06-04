"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { countryLabelForLanguage } from "@/lib/movie-display";
import { localizeAudioLabel } from "@/lib/showtime-display";
import { Clock, Film, Globe, Subtitles, Tag, Tv, UserCheck } from "lucide-react";
import type { MovieListItem } from "@/types/domain";
import { ageRatingMessageKey } from "./cinema-detail-utils";

interface CinemaDetailComingSoonRowProps {
  movie: MovieListItem;
}

function MetaChip({ icon: Icon, children }: { icon: typeof Tag; children: ReactNode }) {
  return (
    <li>
      <Icon className="meta-ic" aria-hidden />
      <span className="txt">{children}</span>
    </li>
  );
}

function genreLabel(movie: MovieListItem): string {
  return (
    movie.genres
      ?.map((g) =>
        typeof g === "object" && g !== null && "name" in g ? (g as { name: string }).name : String(g),
      )
      .join(", ") ?? ""
  );
}

/** Cinestar book-tickets: coming soon uses same row layout + "Chưa có suất chiếu" box */
export function CinemaDetailComingSoonRow({ movie }: CinemaDetailComingSoonRowProps) {
  const t = useTranslations("cinemas");
  const tMovies = useTranslations("movies");
  const tShow = useTranslations("showtimeDisplay");

  const genres = genreLabel(movie);
  const country = countryLabelForLanguage(movie.language, (k) => tMovies(k));
  const audio = movie.language
    ? localizeAudioLabel(movie.language, (k) => tShow(k))
    : null;
  const subs = movie.subtitles
    ? localizeAudioLabel(movie.subtitles, (k) => tShow(k))
    : null;
  const age = movie.ageRating ?? "";
  const ageKey = age ? ageRatingMessageKey(age) : null;
  const ageDesc = ageKey ? t(ageKey) : null;
  const displayAge =
    age === "C13" ? "T13" : age === "C16" ? "T16" : age === "C18" ? "T18" : age;

  const desktopMeta = (
    <ul>
      {genres ? <MetaChip icon={Tag}>{genres}</MetaChip> : null}
      {movie.duration ? <MetaChip icon={Clock}>{movie.duration}</MetaChip> : null}
      {country ? <MetaChip icon={Globe}>{country}</MetaChip> : null}
      {audio ? <MetaChip icon={Film}>{audio}</MetaChip> : null}
      {!audio && subs ? <MetaChip icon={Subtitles}>{subs}</MetaChip> : null}
      {audio && subs && subs !== audio ? <MetaChip icon={Subtitles}>{subs}</MetaChip> : null}
      {ageDesc ? <MetaChip icon={UserCheck}>{ageDesc}</MetaChip> : null}
    </ul>
  );

  const movieHref = `/movies/${movie.slug}`;

  return (
    <div className="movies-item col col-6">
      <div className="movies-wr">
        <div className="movies-img">
          <Link href={movieHref} className="inner">
            {movie.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.posterUrl} alt={movie.title} />
            ) : (
              <div className="movies-img__placeholder" />
            )}
          </Link>
          {ageDesc ? (
            <div className="movies-type is-mobile margin-top movies-type-custom">
              <ul>
                <MetaChip icon={UserCheck}>{ageDesc}</MetaChip>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="movies-content">
          <h3 className="movies-name">
            <Link href={movieHref}>
              {movie.title}
              {displayAge ? ` (${displayAge})` : ""}
            </Link>
          </h3>

          <div className="movies-type is-desktop">{desktopMeta}</div>

          <div className="movies-rp collapseBlockJS">
            <div className="movies-rp-block collapseItem active">
              <div className="movies-rp-noti movies-rp-noti--soon">
                <Tv className="movies-rp-noti__ic" aria-hidden />
                <p>{t("noShowtimesYet")}</p>
              </div>
            </div>
          </div>

          <Link href={movieHref} className="btn-see-more">
            {t("viewMoreShowtimes")}
          </Link>
        </div>
      </div>
    </div>
  );
}
