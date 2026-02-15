"use client";

import { Link } from "@/i18n/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Calendar } from "lucide-react";
import type { MovieListItem } from "@/types/domain";

interface ComingSoonCarouselProps {
  movies: MovieListItem[];
  title: string;
  viewAllHref?: string;
}

export function ComingSoonCarousel({
  movies,
  title,
  viewAllHref,
}: ComingSoonCarouselProps) {
  if (!movies.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All →
          </Link>
        )}
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-4">
          {movies.map((movie) => (
            <CarouselItem
              key={movie.id}
              className="basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <Link href={`/movies/${movie.id}`}>
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
                    <Badge className="absolute left-2 top-2 bg-primary">
                      Coming Soon
                    </Badge>
                    {movie.rating && (
                      <Badge className="absolute right-2 top-2 bg-black/80">
                        {movie.rating}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold text-balance">
                      {movie.title}
                    </h3>
                    {movie.genres?.length ? (
                      <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
                        {movie.genres.map((g) => ("name" in g ? g.name : String(g))).join(", ")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {movie.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {movie.duration}m
                        </span>
                      )}
                      {movie.releaseDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(movie.releaseDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
