import { Skeleton } from "@/components/ui/skeleton";

export default function PromotionsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="mt-2 h-5 w-3/4" />
            <Skeleton className="mt-1 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
