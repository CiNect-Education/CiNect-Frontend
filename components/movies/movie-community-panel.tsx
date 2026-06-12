"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { CommunityReviewCard } from "@/components/community/community-review-card";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { useCommunityReviews, useCommunityPosts } from "@/hooks/queries/use-community";
import type { CommunityPostItem, CommunityReviewItem } from "@/components/community/community-types";

type MovieCommunityPanelProps = {
  movieId: string;
};

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown };
  return Array.isArray(d.data) ? d.data : [];
}

export function MovieCommunityPanel({ movieId }: MovieCommunityPanelProps) {
  const t = useTranslations("community");

  const {
    data: reviewsRes,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useCommunityReviews({
    page: 1,
    limit: 30,
    movieId,
    verifiedOnly: "false",
    sort: "newest",
  });

  const {
    data: postsRes,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useCommunityPosts({ page: 1, limit: 20, movieId });

  const reviews = useMemo(
    () => toList<CommunityReviewItem>(reviewsRes?.data ?? reviewsRes),
    [reviewsRes],
  );
  const posts = useMemo(
    () => toList<CommunityPostItem>(postsRes?.data ?? postsRes),
    [postsRes],
  );

  return (
    <section id="community" className="cinect-detail-section scroll-mt-24">
      <h3 className="mb-4 font-semibold">{t("movieCommunityTitle")}</h3>
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reviews">{t("tabReviews")}</TabsTrigger>
          <TabsTrigger value="talk">{t("tabTalk")}</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="community-feed mt-0">
          {reviewsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : reviewsError ? (
            <ApiErrorState error={reviewsError} onRetry={refetchReviews} />
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("movieReviewsEmpty")}</p>
          ) : (
            reviews.map((review) => (
              <CommunityReviewCard key={review.id} review={review} variant="inline" />
            ))
          )}
        </TabsContent>

        <TabsContent value="talk" className="community-feed mt-0">
          {postsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : postsError ? (
            <ApiErrorState error={postsError} onRetry={refetchPosts} />
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("movieDiscussionsEmpty")}</p>
          ) : (
            posts.map((post) => <CommunityPostCard key={post.id} post={post} hideMovieLink />)
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
