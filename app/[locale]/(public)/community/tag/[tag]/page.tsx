"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { useCommunityPosts } from "@/hooks/queries/use-community";
import type { CommunityPostItem } from "@/components/community/community-types";
import { ChevronLeft } from "lucide-react";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown };
  return Array.isArray(d.data) ? d.data : [];
}

export default function CommunityHashtagPage() {
  const params = useParams();
  const t = useTranslations("community");
  const tag = decodeURIComponent(params.tag as string);

  const { data, isLoading, error, refetch } = useCommunityPosts({
    page: 1,
    limit: 30,
    hashtag: tag,
  });

  const posts = useMemo(() => toList<CommunityPostItem>(data?.data ?? data), [data]);

  return (
    <div className="community-page mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <Link
        href="/community"
        className="text-muted-foreground mb-4 inline-flex items-center gap-1 text-sm hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToCommunity")}
      </Link>
      <h1 className="mb-2 text-2xl font-bold">#{tag}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{t("hashtagPageDesc")}</p>

      <div className="community-feed">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : error ? (
          <ApiErrorState error={error} onRetry={refetch} />
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("hashtagEmpty")}</p>
        ) : (
          posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
