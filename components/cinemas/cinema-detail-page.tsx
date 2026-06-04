"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCinema, useCinemaShowtimes } from "@/hooks/queries/use-cinemas";
import { useComingSoonMovies } from "@/hooks/queries/use-movies";
import { useActivePromotions } from "@/hooks/queries/use-promotions";
import { CinemaDetailComingSoonRow } from "./cinema-detail-coming-soon-row";
import { CinemaDetailHero } from "./cinema-detail-hero";
import { CinemaDetailMovieRow } from "./cinema-detail-movie-row";
import { CinemaDetailPromotions } from "./cinema-detail-promotions";
import { CinemaDetailSpecialPanel } from "./cinema-detail-special-panel";
import { CinemaDetailTabs } from "./cinema-detail-tabs";
import { CinemaDetailTicketPrices } from "./cinema-detail-ticket-prices";
import {
  groupShowtimesByMovie,
  toList,
  type CinemaDetailTab,
} from "./cinema-detail-utils";
import { localCalendarDate } from "@/lib/booking-region";
import type { MovieListItem, Showtime } from "@/types/domain";

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
  const cinemaSlug = params.id as string;

  const [tab, setTab] = useState<CinemaDetailTab>("nowShowing");

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

  const tabItems = TABS.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));

  if (isLoading) {
    return (
      <div className="cinect-cinema-detail">
        <div className="container">
          <Skeleton className="h-[200px] w-full rounded-none" />
        </div>
        <section className="sec-movies">
          <div className="movies sc-pd-b">
            <div className="container">
              <Skeleton className="mb-6 h-12 w-full" />
              <div className="movies-list row">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="col col-6 h-64" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cinect-cinema-detail">
        <div className="container px-4 py-12">
          <ApiErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="cinect-cinema-detail">
        <div className="container px-4 py-12 text-center">
          <p className="text-muted-foreground">{t("cinemaNotFound")}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/cinemas">{t("backToCinemas")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cinect-cinema-detail">
      <section className="sec-hbooking">
        <div className="container">
          <CinemaDetailHero cinema={cinema} />
        </div>
      </section>

      <section className="sec-movies">
        <div className="movies sc-pd-b">
          <div className="container">
            <CinemaDetailTabs
              tabs={tabItems}
              activeTab={tab}
              onTabChange={setTab}
              ariaLabel={t("detailTabs")}
            />

            {tab === "nowShowing" && (
              <div className="movies-tab-panel">
                <div className="re-head">
                  <h2 className="heading --t-center">{t("tabNowShowing")}</h2>
                </div>

                <ul className="movies-age-legend" aria-label={t("ageRatingLegend")}>
                  {AGE_RATINGS.map((code) => (
                    <li key={code}>{t(`ageRatingDesc.${code}`)}</li>
                  ))}
                </ul>

                {loadingShowtimes ? (
                  <div className="movies-list row">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="col col-6 h-64" />
                    ))}
                  </div>
                ) : movieGroups.length > 0 ? (
                  <div className="movies-list row">
                    {movieGroups.map((group) => (
                      <CinemaDetailMovieRow
                        key={group.movieId}
                        group={group}
                        cinemaId={cinema.id}
                        dateOptions={dateOptions}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="movies-empty">{t("noShowtimesOnDate")}</p>
                )}
              </div>
            )}

            {tab === "special" && (
              <div className="movies-tab-panel">
                <div className="re-head">
                  <h2 className="heading --t-center">{t("tabSpecial")}</h2>
                </div>

                {loadingShowtimes ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <CinemaDetailSpecialPanel>
                    {specialGroups.length > 0 ? (
                      <div className="movies-list row">
                        {specialGroups.map((group) => (
                          <CinemaDetailMovieRow
                            key={group.movieId}
                            group={group}
                            cinemaId={cinema.id}
                            dateOptions={dateOptions}
                          />
                        ))}
                      </div>
                    ) : null}
                  </CinemaDetailSpecialPanel>
                )}
              </div>
            )}

            {tab === "comingSoon" && (
              <div className="movies-tab-panel">
                <div className="re-head">
                  <h2 className="heading --t-center">{t("tabComingSoon")}</h2>
                </div>
                {loadingComing ? (
                  <div className="movies-list row">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="col col-6 h-64" />
                    ))}
                  </div>
                ) : comingSoon.length > 0 ? (
                  <div className="movies-list row">
                    {comingSoon.map((movie) => (
                      <CinemaDetailComingSoonRow key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <p className="movies-empty">{t("noComingSoon")}</p>
                )}
              </div>
            )}

            {tab === "prices" && (
              <div className="movies-tab-panel movies-tab-panel--prices">
                <div className="re-head">
                  <h2 className="heading --t-center">{t("tabTicketPrices")}</h2>
                </div>
                <CinemaDetailTicketPrices cinemaId={cinema.id} />
              </div>
            )}

            {(tab === "nowShowing" || tab === "special") && (
              <CinemaDetailPromotions promotions={promotions} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
