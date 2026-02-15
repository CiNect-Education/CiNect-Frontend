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
  const { data: giftCardsRes, isLoading, error, refetch } = useGiftCards();
  const giftCards = (giftCardsRes?.data ?? []) as import("@/types/domain").GiftCard[];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="h-8 w-64 mb-8" />
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
        title="Gift Cards"
        description="Give the gift of entertainment with cinema gift cards"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Gift Cards" },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {giftCards?.map((card) => (
          <Card key={card.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Gift className="h-16 w-16 text-primary/40" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{card.description}</p>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold">{card.value.toLocaleString()}đ</span>
                  {card.price < card.value && (
                    <Badge variant="secondary" className="ml-2">
                      Save {(card.value - card.price).toLocaleString()}đ
                    </Badge>
                  )}
                </div>
              </div>

              {card.expiresAt && (
                <div className="text-xs text-muted-foreground">
                  Valid until {new Date(card.expiresAt).toLocaleDateString()}
                </div>
              )}

              <Link href={`/gift/${card.id}`}>
                <Button className="w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Why Choose Our Gift Cards?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Perfect gift for movie lovers - redeemable for tickets, snacks, and merchandise</p>
          <p>• Digital delivery - instant email delivery or schedule for a special date</p>
          <p>• Flexible amounts - choose from preset amounts or create a custom value</p>
          <p>• No expiration fees - full value guaranteed throughout validity period</p>
          <p>• Easy to use - redeem online or at the cinema box office</p>
        </CardContent>
      </Card>
    </div>
  );
}
