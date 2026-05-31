"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCinema, useCinemaShowtimes } from "@/hooks/queries/use-cinemas";
import { useComingSoonMovies } from "@/hooks/queries/use-movies";
import { useActivePromotions } from "@/hooks/queries/use-promotions";
import { CinemaDetailHero } from "./cinema-detail-hero";
import { CinemaDetailMovieRow } from "./cinema-detail-movie-row";
import {
  groupShowtimesByMovie,
  toList,
  type CinemaDetailTab,
} from "./cinema-detail-utils";
import { localCalendarDate } from "@/lib/booking-region";
import { RemoteImage } from "@/components/shared/remote-image";
import { cn } from "@/lib/utils";
import type { MovieListItem, Showtime } from "@/types/domain";
import { Film } from "lucide-react";

const TABS: { id: CinemaDetailTab; labelKey: string }[] = [
  { id: "nowShowing", labelKey: "tabNowShowing" },
  { id: "comingSoon", labelKey: "tabComingSoon" },
  { id: "special", labelKey: "tabSpecial" },
  { id: "prices", labelKey: "tabTicketPrices" },
];

const AGE_RATINGS = ["P", "K", "C13", "C16", "C18"] as const;

export function CinemaDetailPage() {
  const params = useParams();
  const t = useTranslations("cinemas");
  const locale = useLocale();
  const cinemaSlug = params.id as string;

  const [tab, setTab] = useState<CinemaDetailTab>("nowShowing");
  const [defaultDate, setDefaultDate] = useState("");
  const [movieDates, setMovieDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setDefaultDate(localCalendarDate());
  }, []);

  const { data: cinemaRes, isLoading, error, refetch } = useCinema(cinemaSlug);
  const cinema = cinemaRes?.data;

  const { data: showtimesRes, isLoading: loadingShowtimes } = useCinemaShowtimes(
    cinema?.id || "",
    undefined,
  );
  const { data: comingSoonRes, isLoading: loadingComing } = useComingSoonMovies(24);
  const { data: promosRes } = useActivePromotions(6);

  const showtimes = toList<Showtime>(showtimesRes?.data ?? showtimesRes);
  const comingSoon = toList<MovieListItem>(comingSoonRes);
  const promotions = toList(promosRes?.data ?? promosRes);

  const movieGroups = useMemo(() => groupShowtimesByMovie(showtimes), [showtimes]);

  const specialGroups = useMemo(() => {
    const special = showtimes.filter((st) => st.memberExclusive);
    return groupShowtimesByMovie(special);
  }, [showtimes]);

  const dateOptions = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: localCalendarDate(d), date: d };
    });
  }, []);

  function getMovieDate(movieId: string) {
    return movieDates[movieId] || defaultDate;
  }

  function setMovieDate(movieId: string, iso: string) {
    setMovieDates((prev) => ({ ...prev, [movieId]: iso }));
  }

  const activeGroups = tab === "special" ? specialGroups : movieGroups;

  if (isLoading) {
    return (
      <div className="cinect-cinema-detail">
        <Skeleton className="h-[154px] w-full rounded-none" />
        <div className="mx-auto max-w-[1100px] px-3 py-8">
          <Skeleton className="mb-6 h-12 w-full" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full md:w-[calc(50%-8px)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-12">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("cinemaNotFound")}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/cinemas">{t("backToCinemas")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="cinect-cinema-detail">
      <CinemaDetailHero cinema={cinema} />

      <nav className="cinect-movies-fil" aria-label={t("detailTabs")}>
        <div className="cinect-movies-fil-slider">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "cinect-movies-fil-btn",
                tab === item.id && "is-active",
              )}
              onClick={() => setTab(item.id)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      <div className="cinect-cinema-detail-body">
        {(tab === "nowShowing" || tab === "special") && (
          <section className="cinect-sec-movies">
            <h2 className="cinect-sec-movies__title">
              {tab === "special" ? t("tabSpecial") : t("tabNowShowing")}
            </h2>

            <ul className="cinect-movies-age-legend">
              {AGE_RATINGS.map((code) => (
                <li key={code}>{t(`ageRatingDesc.${code}`)}</li>
              ))}
            </ul>

            {loadingShowtimes ? (
              <div className="cinect-movies-list">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full md:w-[calc(50%-12px)]" />
                ))}
              </div>
            ) : activeGroups.length > 0 ? (
              <div className="cinect-movies-list">
                {activeGroups.map((group) => (
                  <CinemaDetailMovieRow
                    key={group.movieId}
                    group={group}
                    cinemaId={cinema.id}
                    movieDate={getMovieDate(group.movieId)}
                    dateOptions={dateOptions}
                    onDateChange={(iso) => setMovieDate(group.movieId, iso)}
                  />
                ))}
              </div>
            ) : (
              <p className="cinect-movies-empty">
                {tab === "special" ? t("noSpecialShowtimes") : t("noShowtimesOnDate")}
              </p>
            )}
          </section>
        )}

        {tab === "comingSoon" && (
          <section className="cinect-sec-movies">
            <h2 className="cinect-sec-movies__title">{t("tabComingSoon")}</h2>
            {loadingComing ? (
              <Skeleton className="h-40 w-full" />
            ) : comingSoon.length > 0 ? (
              <div className="cinect-movies-list cinect-movies-list--coming">
                {comingSoon.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.slug}`}
                    className="cinect-movies-item cinect-movies-item--coming"
                  >
                    <div className="cinect-movies-img">
                      {movie.posterUrl ? (
                        <RemoteImage
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="cinect-movies-img__placeholder">
                          <Film className="h-8 w-8 text-white/30" />
                        </div>
                      )}
                    </div>
                    <p className="cinect-movies-name">{movie.title}</p>
                    {movie.releaseDate ? (
                      <p className="cinect-movies-coming-date">
                        {new Date(movie.releaseDate).toLocaleDateString(
                          locale.startsWith("vi") ? "vi-VN" : "en-US",
                        )}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="cinect-movies-empty">{t("noComingSoon")}</p>
            )}
          </section>
        )}

        {tab === "prices" && (
          <section className="cinect-sec-movies">
            <h2 className="cinect-sec-movies__title">{t("tabTicketPrices")}</h2>
            <p className="cinect-prices-note">{t("ticketPricesNote")}</p>
            <div className="cinect-prices-table-wrap">
              <table className="cinect-prices-table">
                <thead>
                  <tr>
                    <th>{t("priceType")}</th>
                    <th>{t("priceWeekday")}</th>
                    <th>{t("priceWeekend")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t("priceStandard")}</td>
                    <td>{t("priceStandardWeekday")}</td>
                    <td>{t("priceStandardWeekend")}</td>
                  </tr>
                  <tr>
                    <td>{t("priceStudent")}</td>
                    <td>{t("priceStudentWeekday")}</td>
                    <td>{t("priceStudentWeekend")}</td>
                  </tr>
                  <tr>
                    <td>{t("priceChild")}</td>
                    <td>{t("priceChildWeekday")}</td>
                    <td>{t("priceChildWeekend")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {promotions.length > 0 && (
          <section className="cinect-sec-promos">
            <div className="cinect-sec-promos__head">
              <h2 className="cinect-sec-movies__title">{t("promotionsSection")}</h2>
              <Link href="/promotions" className="cinect-sec-promos__all">
                {t("allPromotions")}
              </Link>
            </div>
            <div className="cinect-sec-promos__grid">
              {promotions.map((promo) => (
                <Link key={promo.id} href={`/promotions/${promo.id}`} className="cinect-sec-promos__card">
                  {promo.imageUrl ? (
                    <RemoteImage
                      src={promo.imageUrl}
                      alt={promo.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white">
                      {promo.title}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
