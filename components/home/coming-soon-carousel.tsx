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

export function ComingSoonCarousel({ movies, title, viewAllHref }: ComingSoonCarouselProps) {
  if (!movies.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-primary text-sm font-medium hover:underline">
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
                <Card className="group hover:shadow-primary/20 overflow-hidden transition-all hover:shadow-lg">
                  <div className="bg-muted relative aspect-[2/3] overflow-hidden">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center">
                        No Image
                      </div>
                    )}
                    <Badge className="bg-primary absolute top-2 left-2">Coming Soon</Badge>
                    {movie.rating && (
                      <Badge className="absolute top-2 right-2 bg-black/80">{movie.rating}</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold text-balance">{movie.title}</h3>
                    {movie.genres?.length ? (
                      <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">
                        {movie.genres.map((g) => ("name" in g ? g.name : String(g))).join(", ")}
                      </p>
                    ) : null}
                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
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
