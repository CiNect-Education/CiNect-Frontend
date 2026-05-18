"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { MovieListItem } from "@/types/domain";
import { HomeMovieCard } from "@/components/home/home-movie-card";

interface MovieCarouselProps {
  movies: MovieListItem[];
  title: string;
  viewAllHref?: string;
}

export function MovieCarousel({ movies, title, viewAllHref }: MovieCarouselProps) {
  const t = useTranslations("home");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">{title}</h2>
        {viewAllHref && (
          <Button variant="ghost" asChild>
            <Link href={viewAllHref}>{t("viewAllArrow")}</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.map((movie) => (
          <HomeMovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
