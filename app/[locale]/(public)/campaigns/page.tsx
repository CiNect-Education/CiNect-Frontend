"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useActiveCampaigns } from "@/hooks/queries/use-campaigns";
import { Link } from "@/i18n/navigation";
import { Tag, Calendar } from "lucide-react";
import { format } from "date-fns";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown };
  return Array.isArray(d.data) ? d.data : [];
}

export default function CampaignsPage() {
  const { data, isLoading, error, refetch } = useActiveCampaigns();
  const campaigns = toList<{
    id: string;
    title: string;
    slug: string;
    description: string;
    imageUrl?: string;
    startDate: string;
    endDate: string;
  }>(data?.data ?? data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title="Campaigns"
        description="Discover our latest campaigns, movie tie-ins, and special offers"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Campaigns" }]}
      />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tag className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="mb-2 font-medium">No active campaigns</p>
          <p className="text-muted-foreground text-sm">
            Check back soon for new campaigns and promotions.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.slug}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                <div className="bg-muted aspect-video overflow-hidden">
                  {campaign.imageUrl ? (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Tag className="text-muted-foreground h-12 w-12" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="line-clamp-2 font-semibold">{campaign.title}</h3>
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                    {campaign.description}
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(campaign.startDate), "MMM d")} –{" "}
                    {format(new Date(campaign.endDate), "MMM d, yyyy")}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
