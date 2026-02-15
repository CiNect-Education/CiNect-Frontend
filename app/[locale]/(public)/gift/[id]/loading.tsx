import { Skeleton } from "@/components/ui/skeleton";

export default function GiftDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-video rounded-lg" />
        <div>
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
