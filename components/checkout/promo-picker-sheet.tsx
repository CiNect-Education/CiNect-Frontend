"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/showtime-display";
import type { PaymentMethod, Promotion } from "@/types/domain";

type PromoPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotions: Promotion[];
  appliedPromoCode?: string | null;
  paymentMethod: PaymentMethod;
  orderAmount: number;
  isApplying?: boolean;
  onApply: (code: string) => Promise<void> | void;
};

function paymentMethodShort(m: PaymentMethod, t: (key: string) => string) {
  if (m === "CARD") return t("pmShortCard");
  if (m === "BANK_TRANSFER") return t("pmShortBank");
  return m.toLowerCase();
}

function formatDiscountLabel(
  promo: Promotion,
  locale: string,
  tHome: (key: "percentOff", values: { value: number }) => string,
) {
  if (promo.discountType === "PERCENTAGE") {
    return tHome("percentOff", { value: promo.discountValue });
  }
  return formatVnd(promo.discountValue, locale);
}

function isPromoEligibleForPayment(
  promo: Promotion,
  paymentMethod: PaymentMethod,
): boolean {
  if (!promo.eligiblePaymentMethods || promo.eligiblePaymentMethods.length === 0) {
    return true;
  }
  return promo.eligiblePaymentMethods.includes(paymentMethod);
}

export function PromoPickerSheet({
  open,
  onOpenChange,
  promotions,
  appliedPromoCode,
  paymentMethod,
  orderAmount,
  isApplying,
  onApply,
}: PromoPickerSheetProps) {
  const t = useTranslations("checkout");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const fmt = (n: number) => formatVnd(n, locale);

  const [manualCode, setManualCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedCode(appliedPromoCode ?? null);
    setManualCode("");
  }, [open, appliedPromoCode]);

  const sortedPromotions = useMemo(() => {
    return [...promotions].sort((a, b) => {
      const aOk = isPromoEligibleForPayment(a, paymentMethod);
      const bOk = isPromoEligibleForPayment(b, paymentMethod);
      if (aOk !== bOk) return aOk ? -1 : 1;
      return 0;
    });
  }, [promotions, paymentMethod]);

  const resolvedCode = (selectedCode ?? manualCode.trim()).trim();
  const isSameAsApplied =
    Boolean(
      appliedPromoCode &&
        resolvedCode &&
        appliedPromoCode.toUpperCase() === resolvedCode.toUpperCase(),
    );

  const handleUse = async () => {
    const code = resolvedCode;
    if (!code || isSameAsApplied) return;
    try {
      await onApply(code);
      onOpenChange(false);
    } catch {
      // Error toast handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] flex-col gap-0 rounded-t-2xl p-0 sm:max-w-lg sm:mx-auto"
      >
        <SheetHeader className="border-border/40 border-b px-4 py-4 text-left">
          <SheetTitle>{t("promoPickerTitle")}</SheetTitle>
        </SheetHeader>

        <div className="border-border/40 border-b px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setSelectedCode(null);
              }}
              placeholder={t("promoPlaceholder")}
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!manualCode.trim() || isApplying || isSameAsApplied}
              onClick={() => void handleUse()}
            >
              {isApplying ? tCommon("applying") : tCommon("apply")}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {sortedPromotions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("promoNoEligible")}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedPromotions.map((promo) => {
                if (!promo.code) return null;
                const eligible = isPromoEligibleForPayment(promo, paymentMethod);
                const isSelected =
                  selectedCode?.toUpperCase() === promo.code.toUpperCase();
                const isApplied =
                  appliedPromoCode?.toUpperCase() === promo.code.toUpperCase();
                const discountLabel = formatDiscountLabel(promo, locale, tHome);

                return (
                  <button
                    key={promo.id}
                    type="button"
                    disabled={!eligible || isApplying}
                    onClick={() => {
                      if (!eligible) return;
                      setSelectedCode(promo.code ?? null);
                      setManualCode("");
                    }}
                    className={cn(
                      "cinect-promo-voucher flex w-full overflow-hidden rounded-lg border text-left transition-colors",
                      eligible
                        ? "hover:border-primary/40"
                        : "cursor-not-allowed opacity-55",
                      (isSelected || isApplied) && "border-primary/50 ring-1 ring-primary/25",
                    )}
                  >
                    <div className="bg-primary text-primary-foreground flex w-[88px] shrink-0 flex-col items-center justify-center px-2 py-4 text-center">
                      <span className="text-sm leading-tight font-bold">{discountLabel}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-start gap-3 p-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="line-clamp-1 text-sm font-semibold">{promo.title}</p>
                        {promo.description && (
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {promo.description}
                          </p>
                        )}
                        <div className="text-muted-foreground space-y-0.5 text-[11px]">
                          {promo.minPurchase != null && promo.minPurchase > 0 && (
                            <p>{t("promoMinOrder", { amount: fmt(promo.minPurchase) })}</p>
                          )}
                          <p>
                            {t("promoValidUntil", {
                              date: new Date(promo.endDate).toLocaleDateString(locale),
                            })}
                          </p>
                          {!eligible && promo.eligiblePaymentMethods?.length ? (
                            <p className="text-amber-600 dark:text-amber-400">
                              {t("promoPaymentMethodOnly", {
                                methods: promo.eligiblePaymentMethods
                                  .map((m) => paymentMethodShort(m, t))
                                  .join(", "),
                              })}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-primary font-mono text-xs font-semibold">
                          {promo.code}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          isSelected || isApplied
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40",
                        )}
                        aria-hidden
                      >
                        {(isSelected || isApplied) && (
                          <span className="bg-primary-foreground h-1.5 w-1.5 rounded-full" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter className="border-border/40 mt-0 border-t px-4 py-3">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={!resolvedCode || isApplying || isSameAsApplied}
            onClick={() => void handleUse()}
          >
            {isApplying ? tCommon("applying") : t("promoUse")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type PromoPickerRowProps = {
  appliedPromoCode?: string | null;
  appliedPromotion?: Promotion | null;
  eligibleCount: number;
  onOpen: () => void;
};

export function PromoPickerRow({
  appliedPromoCode,
  appliedPromotion,
  eligibleCount,
  onOpen,
}: PromoPickerRowProps) {
  const t = useTranslations("checkout");
  const tHome = useTranslations("home");
  const locale = useLocale();

  const discountHint = appliedPromotion
    ? formatDiscountLabel(appliedPromotion, locale, tHome)
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="cinect-flow-interactive flex w-full items-center gap-3 px-3 py-3.5 text-left"
    >
      <Tag className="text-primary h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("promoCodeLabel")}</p>
        {appliedPromoCode ? (
          <p className="text-primary truncate text-xs font-semibold">
            {discountHint ? `${discountHint} · ` : ""}
            {appliedPromoCode}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            {eligibleCount > 0
              ? t("promoEligibleCount", { count: eligibleCount })
              : t("selectPromo")}
          </p>
        )}
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  );
}
