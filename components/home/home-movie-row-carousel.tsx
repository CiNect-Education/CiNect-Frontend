"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieListItem } from "@/types/domain";
import { HomeMovieCard } from "@/components/home/home-movie-card";

/** Slide width matches cinestar.com.vn `.web-movie-item` (25% / 37.5% / 41.67%). */
const SLIDE_BASIS =
  "basis-[41.6667%] pl-3 sm:pl-4 md:basis-[37.5%] xl:basis-1/4";

export type HomeMovieRowVariant = "nowShowing" | "comingSoon";

interface HomeMovieRowCarouselProps {
  movies: MovieListItem[];
  title: string;
  viewAllHref?: string;
  variant?: HomeMovieRowVariant;
}

export function HomeMovieRowCarousel({
  movies,
  title,
  viewAllHref,
  variant = "nowShowing",
}: HomeMovieRowCarouselProps) {
  const t = useTranslations("home");

  if (!movies.length) return null;

  return (
    <section className="cinect-movie-row-carousel space-y-4">
      <h2 className="font-display text-center text-xl font-bold tracking-wide text-white uppercase sm:text-2xl">
        {title}
      </h2>

      <Carousel
        className="relative mt-6 w-full sm:mt-8"
        opts={{
          align: "start",
          loop: false,
          dragFree: false,
          slidesToScroll: "auto",
          containScroll: "trimSnaps",
        }}
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {movies.map((movie) => (
            <CarouselItem key={movie.id} className={SLIDE_BASIS}>
              <HomeMovieCard
                movie={movie}
                variant={variant === "comingSoon" ? "comingSoon" : "nowShowing"}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          variant="ghost"
          className="cinect-movie-row-carousel__nav cinect-movie-row-carousel__nav--prev hidden md:inline-flex"
        >
          <ChevronLeft className="cinect-movie-row-carousel__chevron" strokeWidth={2.25} aria-hidden />
        </CarouselPrevious>
        <CarouselNext
          variant="ghost"
          className="cinect-movie-row-carousel__nav cinect-movie-row-carousel__nav--next hidden md:inline-flex"
        >
          <ChevronRight className="cinect-movie-row-carousel__chevron" strokeWidth={2.25} aria-hidden />
        </CarouselNext>

        <CarouselPagination className="cinect-movie-row-carousel__pagination pt-4" />
      </Carousel>

      {viewAllHref ? (
        <div className="flex justify-center pt-2">
          <Link href={viewAllHref} className="cinect-section-more-btn cinect-section-more-btn--outline">
            {t("seeMore")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
