"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { RemoteImage } from "@/components/shared/remote-image";
import { useMovies } from "@/hooks/queries/use-movies";
import { useCommunityReviews } from "@/hooks/queries/use-community";
import { useAuth } from "@/providers/auth-provider";
import { Star, Ticket, ShieldCheck, MessageSquare, Users } from "lucide-react";
import type { MovieListItem } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

type ReviewFeedItem = {
  id?: string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  content?: string;
  isVerified?: boolean;
  helpfulCount?: number;
  createdAt?: string;
  movie?: { id?: string; title?: string; slug?: string; posterUrl?: string };
};

export default function CommunityPage() {
  const t = useTranslations("community");
  const tNav = useTranslations("nav");
  const { isAuthenticated } = useAuth();

  const {
    data: moviesData,
    isLoading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useMovies({ status: "NOW_SHOWING", nowShowing: true, limit: 4, sort: "rating:desc" });

  const { data: reviewsRes, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } =
    useCommunityReviews({ page: 1, limit: 30, verifiedOnly: "true" });

  const topMovies = toList<MovieListItem>(moviesData?.data ?? moviesData);
  const reviews = useMemo(
    () => toList<ReviewFeedItem>(reviewsRes?.data ?? reviewsRes),
    [reviewsRes]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />

      <Card className="mb-8 border-[#f3ea28]/25 bg-[#f3ea28]/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#f3ea28]" />
            <div>
              <p className="font-semibold">{t("verifiedOnlyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t("verifiedOnlyDesc")}</p>
            </div>
          </div>
          {isAuthenticated ? (
            <Button asChild variant="cta" size="sm" className="shrink-0">
              <Link href="/account/orders">{t("reviewYourMovies")}</Link>
            </Button>
          ) : (
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">{tNav("login")}</Link>
              </Button>
              <Button asChild variant="cta" size="sm">
                <Link href="/register">{tNav("register")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="h-5 w-5 text-[#f3ea28]" />
            {t("verifiedReviewsFeed")}
          </h2>
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : reviewsError ? (
          <ApiErrorState error={reviewsError} onRetry={refetchReviews} />
        ) : reviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">{t("reviewsEmpty")}</p>
              <p className="text-muted-foreground max-w-md text-sm">{t("reviewsEmptyHint")}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/movies">{t("browseMovies")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const movie = review.movie;
              const movieHref = movie?.slug ?? movie?.id ? `/movies/${movie.slug ?? movie.id}` : "/movies";
              return (
                <Card key={String(review.id ?? "")} className="transition-colors hover:border-[#f3ea28]/30">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      {movie?.posterUrl && (
                        <Link href={movieHref} className="relative mx-auto h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:mx-0">
                          <RemoteImage
                            src={movie.posterUrl}
                            alt={movie.title ?? "Movie"}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </Link>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={movieHref} className="font-semibold hover:text-[#f3ea28]">
                            {movie?.title ?? t("unknownMovie")}
                          </Link>
                          {typeof review.rating === "number" && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Star className="h-3 w-3 fill-[#f3ea28] text-[#f3ea28]" />
                              {review.rating}/10
                            </Badge>
                          )}
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <ShieldCheck className="h-3 w-3" />
                            {t("verifiedBadge")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                            {String(review.userName ?? "U").charAt(0)}
                          </div>
                          <span className="font-medium">{String(review.userName ?? t("unknownUser"))}</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{String(review.content ?? "")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Star className="h-5 w-5 text-[#f3ea28]" />
            {t("topRated")}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/movies?sort=rating:desc">{t("viewAllMovies")}</Link>
          </Button>
        </div>

        {moviesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : moviesError ? (
          <ApiErrorState error={moviesError} onRetry={refetchMovies} />
        ) : topMovies.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("emptyMovies")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topMovies.map((movie) => (
              <Link key={movie.id} href={`/movies/${movie.slug ?? movie.id}`} className="group block">
                <Card className="overflow-hidden transition-colors hover:border-[#f3ea28]/40">
                  <div className="relative aspect-[2/3] bg-muted">
                    {movie.posterUrl ? (
                      <RemoteImage
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Ticket className="text-muted-foreground h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold">{movie.title}</p>
                    {typeof movie.rating === "number" && movie.rating > 0 && (
                      <Badge variant="outline" className="mt-2 gap-1 text-xs">
                        <Star className="h-3 w-3 fill-[#f3ea28] text-[#f3ea28]" />
                        {movie.rating.toFixed(1)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
