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
import Image from "next/image";

const SORT_OPTIONS = [
  { value: "releaseDate:desc", labelKey: "sortNewestFirst" as const },
  { value: "releaseDate:asc", labelKey: "sortOldestFirst" as const },
  { value: "title:asc", labelKey: "sortTitleAsc" as const },
  { value: "title:desc", labelKey: "sortTitleDesc" as const },
  { value: "rating:desc", labelKey: "sortRatingDesc" as const },
  { value: "rating:asc", labelKey: "sortRatingAsc" as const },
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
    ...(q ? { search: q } : {}),
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
        title={t("title")}
        description={t("description")}
      />

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="lg:sticky lg:top-20">
            <MovieFilter collapsibleOnMobile />
          </div>
        </aside>

        <div className="flex-1">
          {/* Sticky Sort Bar */}
          <div className="cinect-glass sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <span className="text-muted-foreground text-sm">
              {t("resultsSummary", { count: total })}
            </span>
            <Select value={sort || "releaseDate:desc"} onValueChange={updateSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="bg-muted aspect-[2/3] animate-pulse" />
                  <CardContent className="p-4">
                    <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                    <div className="bg-muted mt-2 h-3 w-1/2 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <ApiErrorState error={error} onRetry={refetch} />
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Film className="text-muted-foreground mb-3 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">{t("noResults")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("tryDifferentFilters")}
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
    <Link href={`/movies/${movie.slug}`}>
      <Card className="group hover:shadow-primary/20 h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="bg-muted relative aspect-[2/3] overflow-hidden">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <Film className="h-12 w-12" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
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
