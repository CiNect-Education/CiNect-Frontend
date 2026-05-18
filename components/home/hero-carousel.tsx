"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
import { RemoteImage } from "@/components/shared/remote-image";

interface HeroCarouselProps {
  movies: MovieListItem[];
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const t = useTranslations("home");
  const tMovies = useTranslations("movies");

  if (!movies.length) return null;

  return (
    <Carousel opts={{ align: "start", loop: true }} className="cinect-banner-carousel w-full">
      <CarouselContent className="ml-0">
        {movies.map((movie) => {
          const heroImage = movie.bannerUrl || movie.posterUrl;
          return (
            <CarouselItem key={movie.id} className="basis-full pl-0">
              <div className="cinect-banner-carousel__slide relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-neutral-900 md:aspect-[3/1]">
                {heroImage ? (
                  <RemoteImage
                    src={heroImage}
                    alt={movie.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white/70">
                    {movie.title}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-6 md:p-10">
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
                      <Button size="lg" variant="outlineLight" asChild>
                        <Link href={`/movies/${movie.slug}`}>
                          <Play className="mr-2 h-4 w-4" />
                          {tMovies("learnMore")}
                        </Link>
                      </Button>
                      <Button size="lg" variant="purple" asChild>
                        <Link href={`/showtimes?movie=${movie.id}`}>{t("bookNow")}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="cinect-carousel-nav cinect-carousel-nav--prev left-3 top-1/2 -translate-y-1/2 border-0 bg-black/45 text-white hover:bg-black/65 md:left-4" />
      <CarouselNext className="cinect-carousel-nav cinect-carousel-nav--next right-3 top-1/2 -translate-y-1/2 border-0 bg-black/45 text-white hover:bg-black/65 md:right-4" />
    </Carousel>
  );
}
