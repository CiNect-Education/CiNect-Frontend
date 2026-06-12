"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCommunityReviews, useCommunityPosts } from "@/hooks/queries/use-community";
import { useAuth } from "@/providers/auth-provider";
import { CommunityReviewCard } from "./community-review-card";
import { CommunityPostCard } from "./community-post-card";
import { CommunityCreateDialog } from "./community-create-dialog";
import {
  CommunityFeedToolbar,
  type CommunityFeedFilters,
} from "./community-feed-toolbar";
import type { CommunityPostItem, CommunityReviewItem } from "./community-types";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

function EmptyBlock({
  title,
  hint,
  actionHref,
  actionLabel,
}: {
  title: string;
  hint: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="community-empty">
      <p className="community-empty__title">{title}</p>
      <p className="community-empty__hint">{hint}</p>
      {actionHref && actionLabel ? (
        <Button asChild variant="link" size="sm" className="mt-3">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function CommunityHub() {
  const t = useTranslations("community");
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<CommunityFeedFilters>({
    verifiedOnly: "all",
    sort: "newest",
  });

  const reviewParams = useMemo(
    () => ({
      page: 1,
      limit: 30,
      verifiedOnly: filters.verifiedOnly === "verified" ? "true" : "false",
      sort: filters.sort,
      ...(filters.movieId ? { movieId: filters.movieId } : {}),
      ...(filters.cinemaId ? { cinemaId: filters.cinemaId } : {}),
    }),
    [filters],
  );

  const {
    data: reviewsRes,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useCommunityReviews(reviewParams);

  const [activeTab, setActiveTab] = useState("reviews");

  const {
    data: postsRes,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useCommunityPosts(
    { page: 1, limit: 20 },
    { enabled: activeTab === "talk" },
  );

  const reviews = useMemo(
    () => toList<CommunityReviewItem>(reviewsRes?.data ?? reviewsRes),
    [reviewsRes],
  );
  const posts = useMemo(
    () => toList<CommunityPostItem>(postsRes?.data ?? postsRes),
    [postsRes],
  );

  return (
    <section className="community-hub min-w-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="community-hub__head">
          <TabsList className="community-tabs-list">
            <TabsTrigger value="reviews" className="community-tab-trigger">
              {t("tabReviews")}
            </TabsTrigger>
            <TabsTrigger value="talk" className="community-tab-trigger">
              {t("tabTalk")}
            </TabsTrigger>
          </TabsList>
          {isAuthenticated ? (
            <CommunityCreateDialog onCreated={() => refetchPosts()} />
          ) : null}
        </div>

        <TabsContent value="reviews" className="community-feed mt-0">
          <CommunityFeedToolbar value={filters} onChange={setFilters} />
          {reviewsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="community-feed-item">
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : reviewsError ? (
            <ApiErrorState error={reviewsError} onRetry={refetchReviews} />
          ) : reviews.length === 0 ? (
            <EmptyBlock
              title={t("reviewsEmpty")}
              hint={t("reviewsEmptyHint")}
              actionHref="/movies"
              actionLabel={t("browseMovies")}
            />
          ) : (
            reviews.map((review) => <CommunityReviewCard key={review.id} review={review} />)
          )}
        </TabsContent>

        <TabsContent value="talk" className="community-feed mt-0">
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="community-feed-item">
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          ) : postsError ? (
            <ApiErrorState error={postsError} onRetry={refetchPosts} />
          ) : posts.length === 0 ? (
            <EmptyBlock title={t("discussionsEmpty")} hint={t("discussionsEmptyHint")} />
          ) : (
            posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
