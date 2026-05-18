"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Star } from "lucide-react";
import type { MovieListItem } from "@/types/domain";
import { RemoteImage } from "@/components/shared/remote-image";

interface HomeFeaturedMovieCardProps {
  movie: MovieListItem;
}

export function HomeFeaturedMovieCard({ movie }: HomeFeaturedMovieCardProps) {
  const tMovies = useTranslations("movies");
  const genres =
    movie.genres?.map((g) =>
      typeof g === "object" && g !== null && "name" in g ? (g as { name: string }).name : String(g),
    ) ?? [];

  return (
    <Link href={`/movies/${movie.slug}`} className="block h-full">
      <Card className="group hover:shadow-primary/20 h-full overflow-hidden border-border/60 transition-all hover:shadow-lg">
        <div className="bg-muted relative aspect-[2/3] overflow-hidden">
          {movie.posterUrl ? (
            <RemoteImage
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              {movie.title}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {movie.status === "COMING_SOON" && (
              <Badge className="bg-black/75 text-[10px] text-white shadow-sm">
                {tMovies("comingSoon")}
              </Badge>
            )}
            {movie.ageRating && (
              <Badge className="bg-black/70 text-[10px] text-white shadow-sm backdrop-blur">
                {movie.ageRating}
              </Badge>
            )}
          </div>
          {movie.rating != null && Number(movie.rating) > 0 && (
            <Badge className="absolute top-2 right-2 bg-black/80 text-[10px] text-white shadow-sm">
              {movie.rating}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 line-clamp-2 font-semibold text-balance">{movie.title}</h3>
          {genres.length > 0 && (
            <p className="mb-2 line-clamp-1 text-xs text-foreground/75">{genres.join(", ")}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/70">
            {movie.duration ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {movie.duration}m
              </span>
            ) : null}
            {movie.rating != null && Number(movie.rating) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="fill-primary text-primary h-3 w-3" />
                {movie.rating}
              </span>
            )}
            {movie.releaseDate ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(movie.releaseDate).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
