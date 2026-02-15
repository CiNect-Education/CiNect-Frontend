import { Skeleton } from "@/components/ui/skeleton";

export default function ShowtimesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
