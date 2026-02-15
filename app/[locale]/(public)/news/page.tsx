"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useNews } from "@/hooks/queries/use-news";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsArticle } from "@/types/domain";
import type { NewsCategory } from "@/types/domain";

const CATEGORIES: NewsCategory[] = [
  "REVIEWS",
  "TRAILERS",
  "PROMOTIONS",
  "GUIDES",
  "GENERAL",
];

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function NewsPage() {
  const t = useTranslations("news");
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = (searchParams.get("category") as NewsCategory) || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 12;

  const params: Record<string, string | number> = { page, limit };
  if (category) params.category = category;

  const { data, isLoading, error, refetch } = useNews(params);
  const articles = toList<NewsArticle>(data?.data ?? data);

  const meta = data?.meta as { page?: number; totalPages?: number; total?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;

  function setCategoryAndNavigate(c: NewsCategory | "") {
    const p = new URLSearchParams(searchParams.toString());
    if (c) p.set("category", c);
    else p.delete("category");
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
        title={t("title") || "News"}
        description={t("description") || "Latest news and updates"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: t("title") || "News" }]}
      />

      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={!category ? "default" : "outline"}
          size="sm"
          onClick={() => setCategoryAndNavigate("")}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryAndNavigate(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-1 h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Newspaper className="mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t("emptyState") || "No articles"}</h3>
          <p className="text-sm text-muted-foreground">Check back later for new content.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-video overflow-hidden bg-muted">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {article.category}
                    </Badge>
                    <h3 className="mb-2 font-semibold line-clamp-2">{article.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {article.excerpt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString()
                        : ""}{" "}
                      • {article.author}
                    </p>
                  </CardContent>
                </Card>
              </Link>
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
              <span className="px-4 text-sm text-muted-foreground">
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
  );
}
