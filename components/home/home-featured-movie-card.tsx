"use client";

import type { MovieListItem } from "@/types/domain";
import { HomeMovieCard } from "@/components/home/home-movie-card";

interface HomeFeaturedMovieCardProps {
  movie: MovieListItem;
}

export function HomeFeaturedMovieCard({ movie }: HomeFeaturedMovieCardProps) {
  return <HomeMovieCard movie={movie} />;
}
