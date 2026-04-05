"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useGiftCards } from "@/hooks/queries/use-gifts";
import { Gift, ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function GiftPage() {
  const t = useTranslations("gift");
  const tNav = useTranslations("nav");
  const { data: giftCardsRes, isLoading, error, refetch } = useGiftCards();
  const giftCards = (giftCardsRes?.data ?? []) as import("@/types/domain").GiftCard[];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="mb-8 h-8 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
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
        title={t("giftCardsTitle")}
        description={t("giftCardsDescription")}
        breadcrumbs={[{ label: tNav("home"), href: "/" }, { label: t("giftCardsTitle") }]}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {giftCards?.map((card) => (
          <Card key={card.id} className="hover:border-primary/50 overflow-hidden transition-colors">
            <div className="from-primary/10 to-primary/5 flex aspect-video items-center justify-center bg-gradient-to-br">
              <Gift className="text-primary/40 h-16 w-16" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{card.description}</p>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold">{card.value.toLocaleString()}đ</span>
                  {card.price < card.value && (
                    <Badge variant="secondary" className="ml-2">
                      {t("saveAmount", {
                        amount: `${(card.value - card.price).toLocaleString()}đ`,
                      })}
                    </Badge>
                  )}
                </div>
              </div>

              {card.expiresAt && (
                <div className="text-muted-foreground text-xs">
                  {t("validUntil", {
                    date: new Date(card.expiresAt).toLocaleDateString(),
                  })}
                </div>
              )}

              <Link href={`/gift/${card.id}`}>
                <Button className="w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t("buyNow")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t("whyGiftCards")}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <p>• {t("whyPoint1")}</p>
          <p>• {t("whyPoint2")}</p>
          <p>• {t("whyPoint3")}</p>
          <p>• {t("whyPoint4")}</p>
          <p>• {t("whyPoint5")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
