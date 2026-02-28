"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiErrorState } from "@/components/system/api-error-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePromotions } from "@/hooks/queries/use-promotions";
import { apiClient } from "@/lib/api-client";
import { Tag, Copy, Check, ChevronLeft, ChevronRight, TicketPercent } from "lucide-react";
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
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLookup, setVoucherLookup] = useState<Promotion | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

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

  async function handleVoucherLookup() {
    const code = voucherCode.trim();
    if (!code) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    setVoucherLoading(true);
    setVoucherLookup(null);
    try {
      const res = await apiClient.get<Promotion>("/promotions/lookup", { code });
      const promo = (res?.data ?? res) as Promotion;
      setVoucherLookup(promo);
      toast.success("Tìm thấy voucher!");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        toast.error("Mã không tồn tại hoặc đã hết hạn");
      } else {
        toast.error("Không thể tra cứu mã. Thử lại sau.");
      }
    } finally {
      setVoucherLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") || "Promotions"}
        description={t("description") || "Special offers and discounts"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: t("title") || "Promotions" }]}
      />

      {/* Voucher code lookup — exclusive vouchers only visible when user enters code */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-end gap-3 p-4 sm:flex-nowrap">
          <div className="flex-1 space-y-1">
            <label className="text-foreground flex items-center gap-2 text-sm font-medium">
              <TicketPercent className="h-4 w-4" />
              Nhập mã voucher
            </label>
            <Input
              placeholder="VD: SUMMER2025"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleVoucherLookup()}
              className="max-w-xs font-mono"
            />
          </div>
          <Button onClick={handleVoucherLookup} disabled={voucherLoading}>
            {voucherLoading ? "Đang tra cứu..." : "Tra cứu"}
          </Button>
        </CardContent>
        <p className="text-muted-foreground px-4 pb-2 text-xs">
          Mã exclusive chỉ hiển thị khi bạn nhập đúng. Voucher thành viên xem tại trang Thành viên.
        </p>
        {voucherLookup && (
          <CardContent className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs">
              Voucher của bạn (chỉ hiển thị khi nhập đúng mã):
            </p>
            <Card
              className="cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              onClick={() => setSelectedPromo(voucherLookup)}
            >
              <div className="bg-muted flex gap-4 p-4">
                {voucherLookup.imageUrl && (
                  <img
                    src={voucherLookup.imageUrl}
                    alt={voucherLookup.title}
                    className="h-20 w-28 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{voucherLookup.title}</h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {voucherLookup.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {voucherLookup.discountValue != null && (
                      <Badge variant="secondary" className="text-primary">
                        {voucherLookup.discountType === "PERCENTAGE"
                          ? `${voucherLookup.discountValue}% off`
                          : `Save ${voucherLookup.discountValue}`}
                      </Badge>
                    )}
                    {voucherLookup.code && (
                      <Badge variant="outline">{voucherLookup.code}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </CardContent>
        )}
      </Card>

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
          <Tag className="text-muted-foreground mb-3 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">{t("emptyState") || "No promotions"}</h3>
          <p className="text-muted-foreground text-sm">Check back later for new offers.</p>
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
                <div className="bg-muted aspect-video overflow-hidden">
                  {promo.imageUrl ? (
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Tag className="text-muted-foreground h-16 w-16" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 line-clamp-1 font-semibold">{promo.title}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
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
                    {promo.code && <Badge variant="outline">{promo.code}</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
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
              <span className="text-muted-foreground px-4 text-sm">
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
                  <div className="bg-muted aspect-video overflow-hidden rounded-lg">
                    <img
                      src={selectedPromo.imageUrl}
                      alt={selectedPromo.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <p className="text-muted-foreground text-sm">{selectedPromo.description}</p>
                {selectedPromo.conditions && (
                  <p className="text-muted-foreground text-xs">{selectedPromo.conditions}</p>
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
                    <code className="bg-muted rounded border px-3 py-2 font-mono text-sm">
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
                <p className="text-muted-foreground text-xs">
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
