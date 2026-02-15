import { Skeleton } from "@/components/ui/skeleton";

export default function CinemasLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-6 h-9 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="mt-2 h-5 w-2/3" />
            <Skeleton className="mt-1 h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
