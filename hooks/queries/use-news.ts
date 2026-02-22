import { useApiQuery } from "@/hooks/use-api-query";
import { newsArticleSchema } from "@/lib/schemas/common";
import type { NewsArticle } from "@/types/domain";
import type { QueryParams } from "@/types/api";
import { z } from "zod";

export function useNews(params?: QueryParams) {
  return useApiQuery<NewsArticle[]>(["news", JSON.stringify(params)], "/news", params, {
    schema: z.array(newsArticleSchema),
  });
}

export function useNewsArticle(slug: string) {
  return useApiQuery<NewsArticle>(["news", slug], `/news/${slug}`, undefined, {
    schema: newsArticleSchema,
    enabled: !!slug,
  });
}
