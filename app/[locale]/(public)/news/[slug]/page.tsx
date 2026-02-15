"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useNewsArticle, useNews } from "@/hooks/queries/use-news";
import { Calendar, User, Newspaper, Tag } from "lucide-react";
import type { NewsArticle } from "@/types/domain";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function NewsArticlePage() {
  const params = useParams();
  const t = useTranslations("news");
  const slug = params.slug as string;

  const { data: articleRes, isLoading, error, refetch } = useNewsArticle(slug);
  const article = articleRes?.data as import("@/types/domain").NewsArticle | undefined;

  const relatedIds = article?.relatedArticleIds ?? [];
  const { data: relatedRes } = useNews(
    relatedIds.length > 0 ? { ids: relatedIds.join(",") } : undefined
  );
  const relatedRaw = relatedRes?.data ?? relatedRes;
  const relatedList = Array.isArray(relatedRaw)
    ? relatedRaw
    : (relatedRaw as { items?: NewsArticle[] })?.items ?? [];
  const relatedArticles = toList<NewsArticle>(relatedList).filter(
    (a) => a.id !== article?.id && relatedIds.includes(a.id)
  );

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | CiNect News`;
    }
  }, [article?.title]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <PageHeader
          title=""
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: t("title") || "News", href: "/news" },
            { label: "Article" },
          ]}
        />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-6 h-4 w-48" />
        <Skeleton className="mb-8 aspect-video rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Newspaper className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Article not found</p>
          <Link href="/news" className="mt-4 inline-block text-primary hover:underline">
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <PageHeader
        title=""
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: t("title") || "News", href: "/news" },
          { label: article.title },
        ]}
      />

      <article>
        <Badge variant="secondary" className="mb-4">
          {article.category}
        </Badge>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-balance lg:text-4xl">
          {article.title}
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {article.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>

        {article.imageUrl && (
          <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-muted">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {article.content ? (
          article.content.includes("<") ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {article.content}
            </p>
          )
        ) : article.excerpt ? (
          <p className="leading-relaxed text-muted-foreground">{article.excerpt}</p>
        ) : null}

        {article.tags?.length ? (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </article>

      {relatedArticles.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Related Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedArticles.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`}>
                <Card className="overflow-hidden transition-all hover:shadow-md">
                  <div className="flex gap-4 p-4">
                    {a.imageUrl ? (
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded bg-muted">
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <Badge variant="secondary" className="mb-1 text-xs">
                        {a.category}
                      </Badge>
                      <h3 className="font-medium line-clamp-2">{a.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.publishedAt
                          ? new Date(a.publishedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
