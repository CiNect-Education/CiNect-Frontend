"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useCampaign } from "@/hooks/queries/use-campaigns";
import { Link } from "@/i18n/navigation";
import { Tag, Film, Calendar } from "lucide-react";
import { format } from "date-fns";

function toObj<T>(v: unknown): T | null {
  if (!v) return null;
  const d = v as { data?: unknown };
  return (d.data ?? v) as T;
}

export default function CampaignPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data, isLoading, error, refetch } = useCampaign(slug);

  const campaign = toObj<{
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    imageUrl?: string;
    bannerUrl?: string;
    startDate: string;
    endDate: string;
    movies?: Array<{ id: string; title: string; posterUrl: string }>;
    promotions?: Array<{ id: string; title: string; code: string }>;
    metadata?: { title?: string; description?: string; ogImage?: string };
  }>(data?.data ?? data);

  useEffect(() => {
    if (campaign?.title) {
      document.title = campaign.metadata?.title ?? `${campaign.title} | CiNect Campaigns`;
      const desc = campaign.metadata?.description ?? campaign.description;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
    }
  }, [campaign?.title, campaign?.description, campaign?.metadata]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="h-12 w-96 mb-6" />
        <Skeleton className="aspect-[21/9] w-full rounded-lg mb-8" />
        <Skeleton className="h-32 w-full" />
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

  if (!campaign) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/campaigns" className="text-primary hover:underline mt-2 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={campaign.title}
        description={campaign.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.title },
        ]}
      />

      {/* Hero Banner */}
      {(campaign.bannerUrl || campaign.imageUrl) && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={campaign.bannerUrl ?? campaign.imageUrl}
            alt={campaign.title}
            className="w-full aspect-[21/9] object-cover"
          />
        </div>
      )}

      {/* Campaign Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none mb-10">
        {campaign.content ? (
          <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
        ) : (
          <p className="text-muted-foreground">{campaign.description}</p>
        )}
      </div>

      {/* Date Range */}
      <Card className="mb-10">
        <CardContent className="flex items-center gap-2 pt-6">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-sm">
            {format(new Date(campaign.startDate), "PPP")} –{" "}
            {format(new Date(campaign.endDate), "PPP")}
          </span>
        </CardContent>
      </Card>

      {/* Tagged Movies */}
      {campaign.movies && campaign.movies.length > 0 && (
        <Card className="mb-10">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Film className="h-5 w-5" />
              Featured Movies
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {campaign.movies.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`}>
                  <div className="rounded-lg overflow-hidden border transition hover:border-primary/50">
                    <div className="aspect-[2/3] bg-muted">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">{movie.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Promotions */}
      {campaign.promotions && campaign.promotions.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Related Promotions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {campaign.promotions.map((promo) => (
                <Link key={promo.id} href="/promotions">
                  <Badge variant="secondary" className="px-4 py-2 text-sm hover:bg-primary/20">
                    {promo.title} – {promo.code}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
