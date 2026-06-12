import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NewsPageClient from "./news-page-client";

function NewsPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-6 h-10 w-48" />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsPageFallback />}>
      <NewsPageClient />
    </Suspense>
  );
}
