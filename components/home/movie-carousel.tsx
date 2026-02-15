"use client";

import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Calendar } from "lucide-react";
import type { MovieListItem } from "@/types/domain";

interface MovieCarouselProps {
  movies: MovieListItem[];
  title: string;
  viewAllHref?: string;
}

export function MovieCarousel({
  movies,
  title,
  viewAllHref,
}: MovieCarouselProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">{title}</h2>
        {viewAllHref && (
          <Button variant="ghost" asChild>
            <Link href={viewAllHref}>View All →</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.map((movie) => (
          <Link key={movie.id} href={`/movies/${movie.id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                {movie.rating && (
                  <Badge className="absolute right-2 top-2 bg-black/80">
                    {movie.rating}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="mb-2 line-clamp-1 font-semibold text-balance">
                  {movie.title}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {movie.genres && movie.genres.length > 0 && (
                    <span className="line-clamp-1">
                      {movie.genres.map((g) => (typeof g === "object" && g !== null && "name" in g ? (g as { name: string }).name : String(g))).join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {movie.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {movie.duration}m
                    </span>
                  )}
                  {movie.rating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {movie.rating}
                    </span>
                  )}
                  {movie.releaseDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(movie.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
