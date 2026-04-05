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
import Image from "next/image";

function toObj<T>(v: unknown): T | null {
  if (!v) return null;
  const d = v as { data?: unknown };
  return (d.data ?? v) as T;
}

export default function CampaignPage() {
  const params = useParams();
  const t = useTranslations("campaigns");
  const tNav = useTranslations("nav");
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
        <Skeleton className="mb-6 h-12 w-96" />
        <Skeleton className="mb-8 aspect-[21/9] w-full rounded-lg" />
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
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link href="/campaigns" className="text-primary mt-2 inline-block hover:underline">
          {t("backToList")}
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
          { label: tNav("home"), href: "/" },
          { label: t("title"), href: "/campaigns" },
          { label: campaign.title },
        ]}
      />

      {/* Hero Banner */}
      {(campaign.bannerUrl || campaign.imageUrl) && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <div className="bg-muted relative aspect-[21/9] w-full">
            <Image
              src={campaign.bannerUrl ?? campaign.imageUrl ?? ""}
              alt={campaign.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        </div>
      )}

      {/* Campaign Content */}
      <div className="prose prose-neutral dark:prose-invert mb-10 max-w-none">
        {campaign.content ? (
          <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
        ) : (
          <p className="text-muted-foreground">{campaign.description}</p>
        )}
      </div>

      {/* Date Range */}
      <Card className="mb-10">
        <CardContent className="flex items-center gap-2 pt-6">
          <Calendar className="text-primary h-5 w-5" />
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
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Film className="h-5 w-5" />
              Featured Movies
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {campaign.movies.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`}>
                  <div className="hover:border-primary/50 overflow-hidden rounded-lg border transition">
                    <div className="bg-muted aspect-[2/3]">
                      {movie.posterUrl ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Film className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-medium">{movie.title}</h3>
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
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Tag className="h-5 w-5" />
              Related Promotions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {campaign.promotions.map((promo) => (
                <Link key={promo.id} href="/promotions">
                  <Badge variant="secondary" className="hover:bg-primary/20 px-4 py-2 text-sm">
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
