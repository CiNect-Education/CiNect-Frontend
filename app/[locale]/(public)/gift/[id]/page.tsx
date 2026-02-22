"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { useGiftCard, usePurchaseGiftCard } from "@/hooks/queries/use-gifts";
import { Gift, CreditCard, Mail, MessageSquare, ShoppingCart } from "lucide-react";

export default function GiftDetailPage() {
  const params = useParams();
  const t = useTranslations("gift");
  const tCommon = useTranslations("common");
  const giftId = params.id as string;

  const { data: giftRes, isLoading, error, refetch } = useGiftCard(giftId);
  const giftCard = giftRes?.data;
  const purchaseGiftCard = usePurchaseGiftCard();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const handlePurchase = () => {
    purchaseGiftCard.mutate({
      giftCardId: giftId,
      recipientEmail: recipientEmail || undefined,
      message: message || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <ApiErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Gift className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">Gift card not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={giftCard.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: t("title"), href: "/gift" },
          { label: giftCard.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="from-primary/20 to-primary/5 relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br">
          {giftCard.imageUrl ? (
            <Image src={giftCard.imageUrl} alt={giftCard.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Gift className="text-primary/30 h-24 w-24" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-2xl font-bold">{giftCard.title}</h1>
            <p className="text-muted-foreground">{giftCard.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Value</p>
              <p className="text-primary text-3xl font-bold">{giftCard.value.toLocaleString()}đ</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              <p className="text-2xl font-semibold">{giftCard.price.toLocaleString()}đ</p>
            </div>
            <Badge variant={giftCard.status === "AVAILABLE" ? "default" : "secondary"}>
              {giftCard.status}
            </Badge>
          </div>

          {giftCard.expiresAt && (
            <p className="text-muted-foreground text-sm">
              Valid until: {new Date(giftCard.expiresAt).toLocaleDateString()}
            </p>
          )}

          {/* Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                {t("sendGift")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipientEmail">{t("recipientEmail")} (optional)</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="recipient@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message">{t("message")} (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handlePurchase}
                disabled={purchaseGiftCard.isPending || giftCard.status !== "AVAILABLE"}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {purchaseGiftCard.isPending
                  ? "Processing..."
                  : `${t("buyGiftCard")} - ${giftCard.price.toLocaleString()}đ`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
