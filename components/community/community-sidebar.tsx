"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { RemoteImage } from "@/components/shared/remote-image";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useMovies } from "@/hooks/queries/use-movies";
import { Star } from "lucide-react";
import type { MovieListItem } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export function CommunitySidebar() {
  const t = useTranslations("community");
  const { data, isLoading, error, refetch } = useMovies({
    status: "NOW_SHOWING",
    nowShowing: true,
    limit: 5,
    sort: "rating:desc",
  });

  const movies = toList<MovieListItem>(data?.data ?? data);

  return (
    <aside className="community-sidebar lg:sticky lg:top-24 lg:self-start">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground uppercase">
        {t("topRated")}
      </h2>

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="h-16 w-11 shrink-0 rounded" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : movies.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("emptyMovies")}</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {movies.map((movie) => (
            <li key={movie.id}>
              <Link
                href={`/movies/${movie.slug ?? movie.id}`}
                className="flex gap-3 py-3 transition-colors hover:opacity-90"
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-muted">
                  {movie.posterUrl ? (
                    <RemoteImage
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug font-medium">{movie.title}</p>
                  {typeof movie.rating === "number" && movie.rating > 0 ? (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-current" />
                      {movie.rating.toFixed(1)}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/movies?sort=rating:desc"
        className="text-muted-foreground mt-4 inline-block text-sm underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("viewAllMovies")}
      </Link>
    </aside>
  );
}
