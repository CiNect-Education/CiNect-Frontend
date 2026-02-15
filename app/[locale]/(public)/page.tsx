"use client";

import { useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { QuickBookingWidget } from "@/components/home/quick-booking-widget";
import { MovieCarousel } from "@/components/home/movie-carousel";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ComingSoonCarousel } from "@/components/home/coming-soon-carousel";
import { Film, Sparkles, Tag, Newspaper, RefreshCcw } from "lucide-react";
import { useNowShowingMovies, useComingSoonMovies } from "@/hooks/queries/use-movies";
import { useActivePromotions } from "@/hooks/queries/use-promotions";
import { useNews } from "@/hooks/queries/use-news";
import { useBanners, useTrendingPromotions } from "@/hooks/queries/use-campaigns";
import { useAuth } from "@/providers/auth-provider";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function HomePage() {
  const t = useTranslations("home");

  const { data: nowShowingRes, isLoading: loadingNow, error: errorNow, refetch: refetchNow } =
    useNowShowingMovies(12);
  const { data: comingSoonRes, isLoading: loadingComing, error: errorComing, refetch: refetchComing } =
    useComingSoonMovies(12);
  const { data: promotionsRes, isLoading: loadingPromo, error: errorPromo, refetch: refetchPromo } =
    useActivePromotions(8);
  const { data: newsRes, isLoading: loadingNews, error: errorNews, refetch: refetchNews } =
    useNews({ limit: 6 });
  const { data: bannersRes } = useBanners("home");
  const { data: trendingRes } = useTrendingPromotions();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchNow(), refetchComing(), refetchPromo(), refetchNews()]);
  }, [refetchNow, refetchComing, refetchPromo, refetchNews]);

  const { pullDistance, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd, progress } =
    usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    const el = document.body;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const nowShowing = toList<import("@/types/domain").MovieListItem>(nowShowingRes);
  const comingSoon = toList<import("@/types/domain").MovieListItem>(comingSoonRes);
  const promotions = toList<import("@/types/domain").Promotion>(promotionsRes);
  const news = toList<import("@/types/domain").NewsArticle>(newsRes);
  const banners = toList<{ id: string; imageUrl: string; linkUrl: string; position: string; priority: number; title?: string }>(bannersRes?.data ?? bannersRes);
  const trendingPromos = toList<{ id: string; title: string; code: string; discountValue: number; discountType: string; imageUrl?: string }>(trendingRes?.data ?? trendingRes);

  return (
    <div className="flex flex-col">
      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance }}
        >
          <RefreshCcw
            className={`h-5 w-5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
            style={{ opacity: progress, transform: `rotate(${progress * 360}deg)` }}
          />
        </div>
      )}

      {/* Hero Section with Featured Carousel */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {isAuthenticated && user
                  ? `Welcome back${(user as { fullName?: string }).fullName ? `, ${(user as { fullName?: string }).fullName}` : ""}!`
                  : (t("welcomeBadge") || "Welcome to CiNect")}
              </span>
            </div>
          </div>
          {banners.length > 0 ? (
            <BannerCarousel banners={banners} />
          ) : loadingNow ? (
            <div className="aspect-[21/9] w-full animate-pulse rounded-lg bg-muted md:aspect-[3/1]" />
          ) : errorNow ? (
            <ApiErrorState error={errorNow} onRetry={refetchNow} compact />
          ) : nowShowing.length > 0 ? (
            <HeroCarousel movies={nowShowing} />
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
              <Film className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                {t("heroSubtitle") ||
                  "Book tickets instantly, discover new releases, and enjoy exclusive benefits."}
              </p>
              <Button size="lg" asChild>
                <Link href="/movies">
                  <Film className="mr-2 h-5 w-5" />
                  {t("browseMovies") || "Browse Movies"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Booking Widget */}
      <section className="relative z-10 mx-auto -mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <QuickBookingWidget />
      </section>

      {/* Now Showing Grid */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loadingNow ? (
          <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
        ) : errorNow ? (
          <ApiErrorState error={errorNow} onRetry={refetchNow} />
        ) : nowShowing.length > 0 ? (
          <MovieCarousel
            movies={nowShowing}
            title={t("nowShowing") || "Now Showing"}
            viewAllHref="/movies?status=NOW_SHOWING"
          />
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Film className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t("noMovies") || "No movies currently showing"}
            </p>
          </div>
        )}
      </section>

      {/* Coming Soon Carousel */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loadingComing ? (
          <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-40 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
        ) : errorComing ? (
          <ApiErrorState error={errorComing} onRetry={refetchComing} compact />
        ) : comingSoon.length > 0 ? (
          <ComingSoonCarousel
            movies={comingSoon}
            title={t("comingSoon") || "Coming Soon"}
            viewAllHref="/movies?status=COMING_SOON"
          />
        ) : null}
      </section>

      {/* Promotions Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-balance">
            {t("promotionsTitle") || "Special Offers & Promotions"}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/promotions">View All →</Link>
          </Button>
        </div>
        {loadingPromo ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : errorPromo ? (
          <ApiErrorState error={errorPromo} onRetry={refetchPromo} compact />
        ) : promotions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {promotions.slice(0, 4).map((promo) => (
              <Link key={promo.id} href="/promotions">
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-video overflow-hidden bg-muted">
                    {promo.imageUrl ? (
                      <img
                        src={promo.imageUrl}
                        alt={promo.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Tag className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{promo.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {promo.description}
                    </p>
                    {promo.discountValue && (
                      <p className="mt-2 text-sm font-medium text-primary">
                        {promo.discountType === "PERCENTAGE"
                          ? `${promo.discountValue}% off`
                          : `Save ${promo.discountValue}`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
            <p className="mb-6 text-muted-foreground text-pretty">
              {t("promotionsDesc") || "Check out our latest deals and exclusive offers"}
            </p>
            <Button size="lg" asChild>
              <Link href="/promotions">
                {t("viewPromotions") || "View All Promotions"}
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Trending Now Section */}
      {trendingPromos.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold">{t("trendingNow") || "Trending Now"}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trendingPromos.map((promo) => (
              <Link key={promo.id} href="/promotions" className="shrink-0">
                <Card className="w-64 overflow-hidden transition-all hover:shadow-lg">
                  {promo.imageUrl && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img src={promo.imageUrl} alt={promo.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{promo.title}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {promo.discountType === "PERCENTAGE"
                        ? `${promo.discountValue}% off`
                        : `Save ${promo.discountValue.toLocaleString()}đ`}
                    </p>
                    {promo.code && (
                      <Badge variant="outline" className="mt-2 font-mono text-xs">
                        {promo.code}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* News Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-balance">
            {t("newsTitle") || "Latest News & Updates"}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/news">View All →</Link>
          </Button>
        </div>
        {loadingNews ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : errorNews ? (
          <ApiErrorState error={errorNews} onRetry={refetchNews} compact />
        ) : news.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-video overflow-hidden bg-muted">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Newspaper className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <span className="text-xs font-medium text-primary">{article.category}</span>
                    <h3 className="mt-1 font-semibold line-clamp-2">{article.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString()
                        : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Newspaper className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No news articles yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
