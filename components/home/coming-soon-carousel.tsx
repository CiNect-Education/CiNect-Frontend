"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { MovieListItem } from "@/types/domain";
import { HomeFeaturedMovieCard } from "@/components/home/home-featured-movie-card";

interface ComingSoonCarouselProps {
  movies: MovieListItem[];
  title?: string;
  viewAllHref?: string;
}

export function ComingSoonCarousel({ movies, title, viewAllHref }: ComingSoonCarouselProps) {
  const tHome = useTranslations("home");

  if (!movies.length) return null;

  const heading = title ?? tHome("comingSoon");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-balance">{heading}</h2>
        {viewAllHref ? (
          <Button variant="ghost" asChild>
            <Link href={viewAllHref}>{tHome("viewAllArrow")}</Link>
          </Button>
        ) : null}
      </div>
      <Carousel opts={{ align: "start", loop: false }} className="cinect-featured-carousel w-full">
        <CarouselContent className="-ml-4 md:-ml-6">
          {movies.map((movie) => (
            <CarouselItem
              key={movie.id}
              className="basis-full pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/3"
            >
              <HomeFeaturedMovieCard movie={movie} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="cinect-carousel-nav cinect-carousel-nav--prev -left-2 top-[42%] border-0 bg-background/90 shadow-md md:-left-4" />
        <CarouselNext className="cinect-carousel-nav cinect-carousel-nav--next -right-2 top-[42%] border-0 bg-background/90 shadow-md md:-right-4" />
      </Carousel>
    </div>
  );
}
