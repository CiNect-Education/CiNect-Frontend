import { Skeleton } from "@/components/ui/skeleton";

export default function GiftLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
