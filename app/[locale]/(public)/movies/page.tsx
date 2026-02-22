"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MovieFilter } from "@/components/movies/movie-filter";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useMovies } from "@/hooks/queries/use-movies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Star, Calendar, Film, ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieListItem } from "@/types/domain";
import type { PaginationMeta } from "@/types/api";

const SORT_OPTIONS = [
  { value: "releaseDate:desc", label: "Newest First" },
  { value: "releaseDate:asc", label: "Oldest First" },
  { value: "title:asc", label: "Title A-Z" },
  { value: "title:desc", label: "Title Z-A" },
  { value: "rating:desc", label: "Highest Rated" },
  { value: "rating:asc", label: "Lowest Rated" },
];

function MoviesContent() {
  const t = useTranslations("movies");
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const language = searchParams.get("language") || undefined;
  const ageRating = searchParams.get("ageRating") || undefined;
  const durationMin = searchParams.get("durationMin") || undefined;
  const durationMax = searchParams.get("durationMax") || undefined;
  const format = searchParams.get("format") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 24;

  const params: Record<string, string | number | undefined> = {
    q,
    status,
    genre,
    language,
    ageRating,
    durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
    durationMax: durationMax ? parseInt(durationMax, 10) : undefined,
    format,
    sort: sort || "releaseDate:desc",
    page,
    limit,
  };
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  const { data, isLoading, error, refetch } = useMovies(params);

  const items = Array.isArray(data?.data)
    ? data.data
    : ((data?.data as unknown as { items?: MovieListItem[] })?.items ?? []);
  const meta = data?.meta as PaginationMeta | undefined;
  const movies = Array.isArray(items) ? items : [];
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const total = meta?.total ?? movies.length;

  function updateSort(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("sort", value);
    p.delete("page");
    router.push(`?${p.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") || "Movies"}
        description={t("description") || "Browse our complete movie collection"}
      />

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="lg:sticky lg:top-20">
            <MovieFilter collapsibleOnMobile />
          </div>
        </aside>

        <div className="flex-1">
          {/* Sticky Sort Bar */}
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3 backdrop-blur">
            <span className="text-muted-foreground text-sm">
              {total > 0 ? `${total} movies` : "No results"}
            </span>
            <Select value={sort || "releaseDate:desc"} onValueChange={updateSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-muted h-96 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <ApiErrorState error={error} onRetry={refetch} />
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Film className="text-muted-foreground mb-3 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">{t("noResults") || "No movies found"}</h3>
              <p className="text-muted-foreground text-sm">
                {t("tryDifferentFilters") || "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-muted-foreground px-4 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: MovieListItem }) {
  const genres =
    movie.genres?.map((g) =>
      typeof g === "object" && g !== null && "name" in g ? g.name : String(g)
    ) ?? [];
  return (
    <Link href={`/movies/${movie.id}`}>
      <Card className="group hover:shadow-primary/20 h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="bg-muted relative aspect-[2/3] overflow-hidden">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <Film className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {movie.status === "NOW_SHOWING" && <Badge className="bg-primary">Now Showing</Badge>}
            {movie.status === "COMING_SOON" && <Badge className="bg-secondary">Coming Soon</Badge>}
            {movie.ageRating && (
              <Badge variant="outline" className="bg-background/80">
                {movie.ageRating}
              </Badge>
            )}
          </div>
          {movie.rating && (
            <Badge className="absolute top-2 right-2 bg-black/80">{movie.rating}</Badge>
          )}
          {movie.formats?.length ? (
            <div className="absolute right-2 bottom-2 left-2 flex flex-wrap gap-1">
              {movie.formats.slice(0, 3).map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold text-balance">{movie.title}</h3>
          {genres.length > 0 && (
            <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">{genres.join(", ")}</p>
          )}
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            {movie.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {movie.duration}m
              </span>
            )}
            {movie.rating && (
              <span className="flex items-center gap-1">
                <Star className="fill-primary text-primary h-3 w-3" />
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
  );
}

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <div className="bg-muted h-96 animate-pulse rounded-lg" />
        </div>
      }
    >
      <MoviesContent />
    </Suspense>
  );
}
