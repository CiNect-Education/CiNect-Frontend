"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RemoteImage } from "@/components/shared/remote-image";
import { useCommunityUserProfile } from "@/hooks/queries/use-community";
import { ReviewVerifiedBadge } from "@/components/reviews/review-verified-badge";
import { Crown, MessageSquare, Star, Ticket } from "lucide-react";

type ProfileReview = {
  id: string;
  rating?: number;
  content?: string;
  isVerified?: boolean;
  createdAt?: string;
  movie?: { id?: string; title?: string; slug?: string; posterUrl?: string };
};

export default function PublicUserProfilePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const t = useTranslations("community");

  const { data, isLoading, error, refetch } = useCommunityUserProfile(id);
  const profile = data?.data;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{t("profilePrivate")}</CardContent>
        </Card>
      </div>
    );
  }

  const reviews = (profile.recentReviews ?? []) as ProfileReview[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title={t("profileTitle")} description={t("profileDesc")} />

      <Card className="mb-6 overflow-hidden border-white/10 bg-gradient-to-br from-[#663399]/15 to-transparent">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border-2 border-[#f3ea28]/30">
            <AvatarImage src={profile.avatar ?? undefined} alt={profile.fullName} />
            <AvatarFallback className="text-lg">{(profile.fullName ?? "U").charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xl font-semibold">{profile.fullName}</p>
            <p className="text-muted-foreground text-sm">{profile.city ?? t("unknownCity")}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Crown className="h-3 w-3 text-[#f3ea28]" />
                {profile.membershipTier}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Star className="h-3 w-3" />
                {profile.reviewCount} {t("profileReviewsCount")}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Ticket className="h-3 w-3" />
                {profile.bookingCount} {t("profileBookingsCount")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-[#f3ea28]" />
          {t("userReviews")}
        </h2>
        {reviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">{t("reviewsEmpty")}</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const movieHref = review.movie?.slug ?? review.movie?.id
                ? `/movies/${review.movie.slug ?? review.movie.id}`
                : "/movies";
              return (
                <Card key={review.id} className="border-white/10">
                  <CardContent className="flex gap-3 p-4">
                    {review.movie?.posterUrl ? (
                      <Link href={movieHref} className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md">
                        <RemoteImage
                          src={review.movie.posterUrl}
                          alt={review.movie.title ?? ""}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </Link>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={movieHref} className="font-semibold hover:text-[#f3ea28]">
                          {review.movie?.title ?? t("unknownMovie")}
                        </Link>
                        {typeof review.rating === "number" ? (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Star className="h-3 w-3 fill-[#f3ea28] text-[#f3ea28]" />
                            {review.rating}/10
                          </Badge>
                        ) : null}
                        {review.isVerified ? <ReviewVerifiedBadge /> : null}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{review.content}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
