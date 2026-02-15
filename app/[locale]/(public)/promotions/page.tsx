"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePromotions } from "@/hooks/queries/use-promotions";
import { Tag, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Promotion } from "@/types/domain";
import { toast } from "sonner";

function toList<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const d = v as { data?: unknown; items?: unknown };
  const arr = d.data ?? d.items;
  return Array.isArray(arr) ? arr : [];
}

export default function PromotionsPage() {
  const t = useTranslations("promotions");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [copied, setCopied] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 12;

  const { data, isLoading, error, refetch } = usePromotions({ page, limit });
  const promotions = toList<Promotion>(data?.data ?? data);

  const meta = data?.meta as { page?: number; totalPages?: number; total?: number } | undefined;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const total = meta?.total ?? promotions.length;

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Promo code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") || "Promotions"}
        description={t("description") || "Special offers and discounts"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: t("title") || "Promotions" }]}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ApiErrorState error={error} onRetry={refetch} />
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Tag className="mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t("emptyState") || "No promotions"}</h3>
          <p className="text-sm text-muted-foreground">Check back later for new offers.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <Card
                key={promo.id}
                className="cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                onClick={() => setSelectedPromo(promo)}
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  {promo.imageUrl ? (
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Tag className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-semibold line-clamp-1">{promo.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {promo.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {promo.discountValue != null && (
                      <Badge variant="secondary" className="text-primary">
                        {promo.discountType === "PERCENTAGE"
                          ? `${promo.discountValue}% off`
                          : `Save ${promo.discountValue}`}
                      </Badge>
                    )}
                    {promo.code && (
                      <Badge variant="outline">{promo.code}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Valid: {new Date(promo.startDate).toLocaleDateString()} –{" "}
                    {new Date(promo.endDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedPromo} onOpenChange={(o) => !o && setSelectedPromo(null)}>
        <DialogContent className="max-w-lg">
          {selectedPromo && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPromo.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedPromo.imageUrl && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={selectedPromo.imageUrl}
                      alt={selectedPromo.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{selectedPromo.description}</p>
                {selectedPromo.conditions && (
                  <p className="text-xs text-muted-foreground">{selectedPromo.conditions}</p>
                )}
                {selectedPromo.discountValue != null && (
                  <Badge variant="secondary" className="text-primary">
                    {selectedPromo.discountType === "PERCENTAGE"
                      ? `${selectedPromo.discountValue}% off`
                      : `Save ${selectedPromo.discountValue}`}
                  </Badge>
                )}
                {selectedPromo.code && (
                  <div className="flex items-center gap-2">
                    <code className="rounded border bg-muted px-3 py-2 font-mono text-sm">
                      {selectedPromo.code}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(selectedPromo.code!)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Valid: {new Date(selectedPromo.startDate).toLocaleDateString()} –{" "}
                  {new Date(selectedPromo.endDate).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
