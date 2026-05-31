"use client";

import type { MovieListItem } from "@/types/domain";
import { HomeMovieRowCarousel } from "@/components/home/home-movie-row-carousel";

interface MovieCarouselProps {
  movies: MovieListItem[];
  title: string;
  viewAllHref?: string;
}

/** Now showing — horizontal scroll row (Cinestar-style). */
export function MovieCarousel({ movies, title, viewAllHref }: MovieCarouselProps) {
  return (
    <HomeMovieRowCarousel
      movies={movies}
      title={title}
      viewAllHref={viewAllHref}
      variant="nowShowing"
    />
  );
}
