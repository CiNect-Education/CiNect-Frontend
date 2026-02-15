import { Skeleton } from "@/components/ui/skeleton";

export default function NewsArticleLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-4 h-10 w-3/4" />
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="mb-8 aspect-video rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
