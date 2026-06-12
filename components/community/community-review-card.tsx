"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/shared/remote-image";
import { ReviewVerifiedBadge } from "@/components/reviews/review-verified-badge";
import { SpoilerContent } from "@/components/reviews/spoiler-content";
import { CommunityComments } from "@/components/community/community-comments";
import { ContentReportDialog } from "@/components/community/content-report-dialog";
import { useReviewReaction } from "@/hooks/queries/use-community";
import { useAuth } from "@/providers/auth-provider";
import { Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { CommunityReviewItem } from "./community-types";

type CommunityReviewCardProps = {
  review: CommunityReviewItem;
  variant?: "feed" | "inline";
};

export function CommunityReviewCard({ review, variant = "feed" }: CommunityReviewCardProps) {
  const t = useTranslations("community");
  const locale = useLocale();
  const dateFnsLocale = locale === "vi" ? vi : enUS;
  const { isAuthenticated } = useAuth();
  const react = useReviewReaction();

  const movie = review.movie;
  const movieHref = movie?.slug ?? movie?.id ? `/movies/${movie.slug ?? movie.id}` : "/movies";
  const userInitial = review.userName?.charAt(0).toUpperCase() || "U";
  const showMovieMeta = variant === "feed";

  async function handleHelpful() {
    if (!isAuthenticated) {
      toast.message(t("loginToInteract"));
      return;
    }
    if (!review.id) return;
    try {
      await react.mutateAsync({ reviewId: review.id });
    } catch {
      toast.error(t("helpfulError"));
    }
  }

  return (
    <article className="community-feed-item">
      <div className="flex gap-4">
        {showMovieMeta && movie?.posterUrl ? (
          <Link
            href={movieHref}
            className="relative hidden h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-sm bg-muted sm:block"
          >
            <RemoteImage
              src={movie.posterUrl}
              alt={movie.title ?? "Movie"}
              fill
              className="object-cover"
              sizes="48px"
            />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="bg-muted relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold">
              {review.userAvatar ? (
                <RemoteImage
                  src={review.userAvatar}
                  alt={review.userName ?? t("unknownUser")}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                userInitial
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                {review.userId ? (
                  <Link href={`/users/${review.userId}`} className="font-medium hover:underline">
                    {review.userName ?? t("unknownUser")}
                  </Link>
                ) : (
                  <span className="font-medium">{review.userName ?? t("unknownUser")}</span>
                )}
                {review.createdAt ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <time className="text-muted-foreground text-xs" dateTime={review.createdAt}>
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                        locale: dateFnsLocale,
                      })}
                    </time>
                  </>
                ) : null}
                {review.isVerified ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <ReviewVerifiedBadge />
                  </>
                ) : null}
              </div>

              {showMovieMeta ? (
                <Link
                  href={movieHref}
                  className="text-muted-foreground mt-1 inline-block text-xs hover:text-foreground hover:underline"
                >
                  {movie?.title ?? t("unknownMovie")}
                </Link>
              ) : null}

              {review.cinema?.name ? (
                <p className="text-muted-foreground mt-0.5 text-xs">{review.cinema.name}</p>
              ) : null}
            </div>
          </div>

          {review.title ? (
            <h4 className="mt-3 text-sm font-semibold leading-snug">{review.title}</h4>
          ) : null}

          {typeof review.rating === "number" ? (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-[#f3ea28] text-[#f3ea28]" />
              <span className="font-semibold">{review.rating}/10</span>
            </div>
          ) : null}

          {review.tags && review.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                >
                  {t(`emotionTag_${tag}` as "emotionTag_great")}
                </span>
              ))}
            </div>
          ) : null}

          <SpoilerContent hasSpoiler={review.hasSpoiler} className="mt-2">
            <p className="text-sm leading-relaxed text-foreground/90">{review.content}</p>
          </SpoilerContent>

          {review.imageUrls && review.imageUrls.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.imageUrls.map((url) => (
                <div
                  key={url}
                  className="relative h-24 w-24 overflow-hidden rounded-md bg-muted sm:h-28 sm:w-28"
                >
                  <RemoteImage src={url} alt="" fill className="object-cover" sizes="112px" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 gap-1.5 px-0 text-xs hover:bg-transparent hover:text-foreground"
              disabled={react.isPending}
              onClick={handleHelpful}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {t("helpfulCount", { count: review.helpfulCount ?? 0 })}
            </Button>
            {review.id ? <ContentReportDialog targetType="REVIEW" targetId={review.id} /> : null}
          </div>

          {review.id ? <CommunityComments targetType="REVIEW" targetId={review.id} /> : null}
        </div>
      </div>
    </article>
  );
}
