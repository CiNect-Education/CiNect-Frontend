"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MovieCarousel } from "@/components/home/movie-carousel";
import { ComingSoonCarousel } from "@/components/home/coming-soon-carousel";
import { CinectMovieQuickBooking } from "@/components/movies/cinect-movie-quick-booking";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useNowShowingMovies, useComingSoonMovies } from "@/hooks/queries/use-movies";
import type { MovieListItem } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export function MoviesBookingLanding() {
  const t = useTranslations("home");
  const tMovies = useTranslations("movies");

  const {
    data: nowShowingRes,
    isLoading: loadingNow,
    error: errorNow,
    refetch: refetchNow,
  } = useNowShowingMovies(24);
  const {
    data: comingSoonRes,
    isLoading: loadingComing,
    error: errorComing,
    refetch: refetchComing,
  } = useComingSoonMovies(24);

  const nowShowing = toList<MovieListItem>(nowShowingRes);
  const comingSoon = toList<MovieListItem>(comingSoonRes);

  return (
    <div className="flex flex-col">
      <CinectMovieQuickBooking />

      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {loadingNow ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-8 w-56" />
            <div className="flex gap-3 overflow-hidden sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-[2/3] w-[41.6667%] shrink-0 rounded-lg md:w-[37.5%] xl:w-1/4"
                />
              ))}
            </div>
          </div>
        ) : errorNow ? (
          <ApiErrorState error={errorNow} onRetry={refetchNow} />
        ) : nowShowing.length > 0 ? (
          <MovieCarousel
            movies={nowShowing}
            title={t("nowShowing")}
            viewAllHref="/movies?view=catalog&status=NOW_SHOWING"
          />
        ) : null}

        {loadingComing ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-8 w-56" />
            <div className="flex gap-3 overflow-hidden sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-[2/3] w-[41.6667%] shrink-0 rounded-lg md:w-[37.5%] xl:w-1/4"
                />
              ))}
            </div>
          </div>
        ) : errorComing ? (
          <ApiErrorState error={errorComing} onRetry={refetchComing} />
        ) : comingSoon.length > 0 ? (
          <ComingSoonCarousel
            movies={comingSoon}
            title={t("comingSoon")}
            viewAllHref="/movies?view=catalog&status=COMING_SOON"
          />
        ) : null}

        <p className="text-center">
          <Link href="/movies?view=catalog" className="cinect-section-more-btn cinect-section-more-btn--outline">
            {tMovies("browseCatalog")}
          </Link>
        </p>
      </div>
    </div>
  );
}
