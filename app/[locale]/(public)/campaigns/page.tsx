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
        <Skeleton className="h-8 w-48 mb-6" />
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
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Campaigns" },
        ]}
      />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tag className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 font-medium">No active campaigns</p>
          <p className="text-sm text-muted-foreground">
            Check back soon for new campaigns and promotions.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.slug}`}>
              <Card className="overflow-hidden transition-all hover:shadow-lg h-full">
                <div className="aspect-video overflow-hidden bg-muted">
                  {campaign.imageUrl ? (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Tag className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2">{campaign.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
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
