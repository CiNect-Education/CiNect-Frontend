"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useMyGiftCards } from "@/hooks/queries/use-gifts";
import { Gift, Copy, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function AccountGiftsPage() {
  const t = useTranslations("account");
  const { data: giftsRes, isLoading, error, refetch } = useMyGiftCards();
  const gifts = giftsRes?.data as import("@/types/domain").GiftCard[] | undefined;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Gift card code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title={t("gifts")} description={t("giftsDesc")} />
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("gifts")}
        description={t("giftsDesc")}
        breadcrumbs={[
          { label: t("title"), href: "/account/profile" },
          { label: t("gifts") },
        ]}
      />

      {!gifts || gifts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Gift}
              title="No gift cards"
              description="Gift cards you have purchased or received will appear here."
              onAction={() => {}}
              actionLabel="Browse Gift Cards"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {gifts.map((gift) => (
            <Card key={gift.id} className="relative overflow-hidden">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5" />
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gift.title}</CardTitle>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {gift.recipientEmail || "Self"}
                    </div>
                  </div>
                  <Badge variant={gift.status === "AVAILABLE" ? "default" : "secondary"}>
                    {gift.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{gift.value.toLocaleString()}đ</span>
                  {gift.price < gift.value && (
                    <span className="text-sm text-muted-foreground line-through">
                      {gift.price.toLocaleString()}đ
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                  <code className="font-mono text-sm font-semibold">{gift.code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(gift.code ?? "", gift.id)}
                  >
                    {copiedId === gift.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {gift.purchasedAt && (
                    <div>Purchased: {format(new Date(gift.purchasedAt), "PP")}</div>
                  )}
                  {gift.expiresAt && (
                    <div>Expires: {format(new Date(gift.expiresAt), "PP")}</div>
                  )}
                </div>

                {gift.status === "AVAILABLE" && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/movies">Use Now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
