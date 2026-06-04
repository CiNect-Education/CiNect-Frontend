"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { RemoteImage } from "@/components/shared/remote-image";
import { countryLabelForLanguage } from "@/lib/movie-display";
import { localizeAudioLabel } from "@/lib/showtime-display";
import { ChevronDown, Clock, Film, Globe, Subtitles, Tag, UserCheck } from "lucide-react";
import type { Showtime } from "@/types/domain";
import {
  ageRatingMessageKey,
  formatCinemaDateLabel,
  formatShowtimeFormatLabel,
  formatShowtimeTime,
  groupShowtimesByDateBlocks,
  type MovieShowtimeGroup,
} from "./cinema-detail-utils";
import { cn } from "@/lib/utils";

interface CinemaDetailMovieRowProps {
  group: MovieShowtimeGroup;
  cinemaId: string;
  dateOptions: { iso: string; date: Date }[];
}

function MetaChip({ icon: Icon, children }: { icon: typeof Tag; children: ReactNode }) {
  return (
    <li>
      <Icon className="meta-ic" aria-hidden />
      <span className="txt">{children}</span>
    </li>
  );
}

export function CinemaDetailMovieRow({
  group,
  cinemaId,
  dateOptions,
}: CinemaDetailMovieRowProps) {
  const locale = useLocale();
  const t = useTranslations("cinemas");
  const tMovies = useTranslations("movies");
  const tShow = useTranslations("showtimeDisplay");

  const dateBlocks = useMemo(
    () => groupShowtimesByDateBlocks(group, dateOptions),
    [group, dateOptions],
  );

  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(dateBlocks.map((b) => b.dateIso)),
  );

  useEffect(() => {
    setExpandedDates(new Set(dateBlocks.map((b) => b.dateIso)));
  }, [dateBlocks]);

  function toggleDate(iso: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  const genres = group.movieGenres?.join(", ") ?? "";
  const country = countryLabelForLanguage(group.movieLanguage ?? undefined, (k) => tMovies(k));
  const audio = group.movieLanguage
    ? localizeAudioLabel(group.movieLanguage, (k) => tShow(k))
    : null;
  const subs = group.movieSubtitles
    ? localizeAudioLabel(group.movieSubtitles, (k) => tShow(k))
    : null;
  const age = group.movieAgeRating ?? "";
  const ageKey = age ? ageRatingMessageKey(age) : null;
  const ageDesc = ageKey ? t(ageKey) : null;
  const displayAge =
    age === "C13" ? "T13" : age === "C16" ? "T16" : age === "C18" ? "T18" : age;

  const desktopMeta = (
    <ul>
      {genres ? <MetaChip icon={Tag}>{genres}</MetaChip> : null}
      {group.movieDuration ? <MetaChip icon={Clock}>{group.movieDuration}</MetaChip> : null}
      {country ? <MetaChip icon={Globe}>{country}</MetaChip> : null}
      {audio ? <MetaChip icon={Film}>{audio}</MetaChip> : null}
      {!audio && subs ? <MetaChip icon={Subtitles}>{subs}</MetaChip> : null}
      {audio && subs && subs !== audio ? <MetaChip icon={Subtitles}>{subs}</MetaChip> : null}
      {ageDesc ? <MetaChip icon={UserCheck}>{ageDesc}</MetaChip> : null}
    </ul>
  );

  const movieHref = group.movieSlug
    ? `/movies/${group.movieSlug}`
    : `/showtimes?cinema=${cinemaId}&movie=${group.movieId}`;

  const seeMoreHref = group.movieSlug
    ? `/movies/${group.movieSlug}`
    : `/showtimes?cinema=${cinemaId}&movie=${group.movieId}`;

  return (
    <div className="movies-item col col-6">
      <div className="movies-wr">
        <div className="movies-img">
          <Link href={movieHref} className="inner">
            {group.moviePosterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.moviePosterUrl} alt={group.movieTitle} />
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
              {group.movieTitle}
              {displayAge ? ` (${displayAge})` : ""}
            </Link>
          </h3>

          <div className="movies-type is-desktop">{desktopMeta}</div>

          <div className="movies-rp collapseBlockJS">
            {dateBlocks.length > 0 ? (
              dateBlocks.map((block) => {
                const isOpen = expandedDates.has(block.dateIso);
                return (
                  <div
                    key={block.dateIso}
                    className={cn("movies-rp-block collapseItem", isOpen && "active")}
                  >
                    <button
                      type="button"
                      className="movies-rp-day collapseHead"
                      onClick={() => toggleDate(block.dateIso)}
                      aria-expanded={isOpen}
                    >
                      <span className="txt">{formatCinemaDateLabel(block.date, locale)}</span>
                      <ChevronDown className="collapse-chevron" aria-hidden />
                    </button>
                    <div
                      className="movies-rp-body collapseBody"
                      style={{ display: isOpen ? "block" : "none" }}
                    >
                      {Object.entries(block.byFormat).map(([fmt, times]) => (
                        <div key={fmt} className="movies-rp-item">
                          <p className="movies-rp-title">{fmt}</p>
                          <div className="movies-time">
                            <div className="movies-time-slider">
                              {times.map((st: Showtime, idx) => (
                                <div key={st.id} className="movies-time-slide col">
                                  <Link
                                    href={`/booking/${st.id}`}
                                    className={cn("movies-time-item", idx === 0 && "active")}
                                  >
                                    {formatShowtimeTime(st, locale)}
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="movies-rp-block collapseItem active">
                <div className="movies-rp-noti">
                  <p>{t("noShowtimesOnDate")}</p>
                </div>
              </div>
            )}
          </div>

          <Link href={seeMoreHref} className="btn-see-more">
            {t("viewMoreShowtimes")}
          </Link>
        </div>
      </div>
    </div>
  );
}
