"use client";

import type { MovieListItem } from "@/types/domain";
import { useTranslations } from "next-intl";
import { HomeMovieRowCarousel } from "@/components/home/home-movie-row-carousel";

interface ComingSoonCarouselProps {
  movies: MovieListItem[];
  title?: string;
  viewAllHref?: string;
}

/** Coming soon — same horizontal scroll row as now showing (Cinestar-style). */
export function ComingSoonCarousel({ movies, title, viewAllHref }: ComingSoonCarouselProps) {
  const tHome = useTranslations("home");

  return (
    <HomeMovieRowCarousel
      movies={movies}
      title={title ?? tHome("comingSoon")}
      viewAllHref={viewAllHref}
      variant="comingSoon"
    />
  );
}
