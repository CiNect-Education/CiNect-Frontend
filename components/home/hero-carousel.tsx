"use client";

import { Link } from "@/i18n/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import type { MovieListItem } from "@/types/domain";

interface HeroCarouselProps {
  movies: MovieListItem[];
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  if (!movies.length) return null;

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-0">
        {movies.map((movie) => (
          <CarouselItem key={movie.id} className="pl-0">
            <div className="bg-muted relative aspect-[21/9] w-full overflow-hidden rounded-lg md:aspect-[3/1]">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="from-primary/20 to-primary/5 text-muted-foreground flex h-full w-full items-center justify-center bg-gradient-to-br">
                  {movie.title}
                </div>
              )}
              <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                  <h2 className="mb-2 text-2xl font-bold text-white drop-shadow-md md:text-4xl">
                    {movie.title}
                  </h2>
                  {movie.genres?.length ? (
                    <p className="mb-4 text-sm text-white/90 md:text-base">
                      {movie.genres
                        .map((g) =>
                          typeof g === "object" && g !== null && "name" in g
                            ? (g as { name: string }).name
                            : String(g)
                        )
                        .join(", ")}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" asChild>
                      <Link href={`/movies/${movie.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Learn More
                      </Link>
                    </Button>
                    <Button size="lg" variant="secondary" asChild>
                      <Link href={`/showtimes?movie=${movie.id}`}>Book Tickets</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 md:left-4" />
      <CarouselNext className="right-2 md:right-4" />
    </Carousel>
  );
}
