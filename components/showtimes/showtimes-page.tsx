"use client";

import "./cinect-showtimes.css";
import { useTranslations } from "next-intl";
import { ApiErrorState } from "@/components/system/api-error-state";
import { ShowtimesFilterBar } from "./showtimes-filter-bar";
import { ShowtimesMovieBlock } from "./showtimes-movie-block";
import { ShowtimesScrollTop } from "./showtimes-scroll-top";
import { ShowtimesResultsSkeleton } from "./showtimes-results-skeleton";
import { ShowtimesSkeleton } from "./showtimes-skeleton";
import { useShowtimesPage } from "./use-showtimes-page";

export function ShowtimesPage() {
  const t = useTranslations("showtimes");
  const {
    mounted,
    date,
    movieId,
    cinemaId,
    dateOptions,
    movieOptions,
    cinemaOptions,
    movieBlocks,
    isLoading,
    error,
    refetch,
    setDate,
    setMovie,
    setCinema,
  } = useShowtimesPage();

  if (!mounted) {
    return <ShowtimesSkeleton />;
  }

  return (
    <div className="cinect-showtimes">
      <div className="container">
        <ShowtimesFilterBar
          date={date}
          movieId={movieId}
          cinemaId={cinemaId}
          dateOptions={dateOptions}
          movieOptions={movieOptions}
          cinemaOptions={cinemaOptions}
          moviesLoading={isLoading}
          onDateChange={setDate}
          onMovieChange={setMovie}
          onCinemaChange={setCinema}
        />

        <div className="movies-showtimes">
          {isLoading ? (
            <>
              <ShowtimesResultsSkeleton />
              <ShowtimesResultsSkeleton />
            </>
          ) : error ? (
            <ApiErrorState error={error} onRetry={refetch} />
          ) : movieBlocks.length === 0 ? (
            <div className="showtimes-empty">
              <p className="showtimes-empty__title">{t("noResultsTitle")}</p>
              <p className="showtimes-empty__hint">{t("noResultsHint")}</p>
            </div>
          ) : (
            movieBlocks.map((block) => (
              <ShowtimesMovieBlock key={block.movieId} block={block} />
            ))
          )}
        </div>
      </div>
      <ShowtimesScrollTop />
    </div>
  );
}
