import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminSeatsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-10 w-full" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
