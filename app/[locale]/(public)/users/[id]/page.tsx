"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityUserProfile, useCommunityReviews, useCommunityPosts } from "@/hooks/queries/use-community";
import { MessageSquare, PencilLine } from "lucide-react";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function PublicUserProfilePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const t = useTranslations("community");

  const { data, isLoading, error, refetch } = useCommunityUserProfile(id);
  const { data: postsRes } = useCommunityPosts({ userId: id, page: 1, limit: 8 });
  const { data: reviewsRes } = useCommunityReviews({ userId: id, page: 1, limit: 8 });

  const user = data?.data as
    | {
        id: string;
        fullName?: string;
        avatar?: string;
        city?: string;
        profilePublic?: boolean;
      }
    | undefined;
  const posts = toList<Record<string, unknown>>(postsRes?.data ?? postsRes);
  const reviews = toList<Record<string, unknown>>(reviewsRes?.data ?? reviewsRes);

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

  if (!user || user.profilePublic === false) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{t("profilePrivate")}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title={t("profileTitle")} description={t("profileDesc")} breadcrumbs={[{ label: t("title"), href: "/community" }, { label: user.fullName ?? t("unknownUser") }]} />

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} alt={user.fullName ?? "user"} />
            <AvatarFallback>{(user.fullName ?? "U").charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.fullName ?? t("unknownUser")}</p>
            <p className="text-sm text-muted-foreground">{user.city ?? t("unknownCity")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <PencilLine className="h-4 w-4" />
              {t("userPosts")}
            </p>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("buzzEmpty")}</p>
            ) : (
              posts.map((post) => (
                <div key={String(post.id ?? "")} className="rounded-md border p-3 text-sm">
                  {String(post.content ?? "")}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4" />
              {t("userReviews")}
            </p>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("reviewsEmpty")}</p>
            ) : (
              reviews.map((review) => (
                <div key={String(review.id ?? "")} className="rounded-md border p-3 text-sm">
                  <p>{String(review.content ?? "")}</p>
                  {review.isVerified ? (
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {t("verifiedBadge")}
                    </Badge>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
